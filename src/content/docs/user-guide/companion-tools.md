---
title: "Companion Integration Testing"
---


This document tracks the investigation and testing of companion UIs for loko workloads.

## MongoDB + mongo-express

**Status:** Working

### Investigation Summary

**Problem:** mongo-express failed to authenticate to MongoDB with "Authentication failed" error.

**Root Cause Analysis:**

1. **Initial approach (broken):** The catalog used `existingSecret` to read password from MongoDB's Kubernetes secret:
   ```yaml
   existingSecret: mongodb
   existingSecretKeyMongodbAdminPassword: MONGO_INITDB_ROOT_PASSWORD
   ```

2. **Why it failed:** MongoDB's `docker-entrypoint.sh` only creates the root user when the data directory is empty (first boot). The `MONGO_INITDB_ROOT_PASSWORD` env var is:
   - Used to create the user on first boot
   - Stored in the Kubernetes secret
   - **Ignored** if data already exists in the PVC

3. **Failure scenario:**
   - User runs `loko env destroy` (PVC data preserved by default)
   - User runs `loko env create` (new cluster, same PVC data)
   - MongoDB sees existing data → skips init → no user created
   - mongo-express tries to auth with password from secret → fails (user doesn't exist in DB)

### Code Changes Made

**1. `loko/generator.py`** - Added credential injection for companions:

```python
def _inject_companion_credentials(self, companion_name: str, base_values: Dict[str, Any], password: str) -> None:
    """Inject parent workload credentials into companion helm values."""
    if companion_name == 'mongo-express':
        base_values['mongodbAdminPassword'] = password
        # Remove existingSecret keys that would conflict
        base_values.pop('existingSecret', None)
        base_values.pop('existingSecretKeyMongodbAdminPassword', None)
        base_values.pop('existingSecretKeySiteCookieSecret', None)
        base_values.pop('existingSecretKeySiteSessionSecret', None)
```

Called in `_process_companions()` when `uses_parent_credentials: true`:
```python
if catalog_companion.secrets and catalog_companion.secrets.uses_parent_credentials:
    parent_password = self._get_or_generate_password(workload_name)
    self._inject_companion_credentials(companion_name, base_values, parent_password)
```

**2. `loko/templates/loko-catalog.yaml`** - Updated mongo-express presets:

```yaml
companions:
  - name: mongo-express
    secrets:
      uses-parent-credentials: true
    presets:
      mongodbServer: mongodb.${LOKO_SYSTEM_WORKLOADS_NAMESPACE}.svc.cluster.local
      mongodbEnableAdmin: true
      mongodbAdminUsername: root
      # mongodbAdminPassword is injected by generator from parent workload secrets
      # This avoids the existingSecret approach which fails when MongoDB PVC has
      # data from a previous run (MONGO_INITDB_* only runs on first container boot)
      ingress:
        # ... ingress config
```

### Password Flow

```
loko secrets (persisted state)
    ↓
generator._get_or_generate_password('mongodb')
    ↓
_inject_companion_credentials() → base_values['mongodbAdminPassword'] = password
    ↓
helmfile.yaml → mongo-express helm values
    ↓
mongo-express container env → connects to MongoDB
```

### Testing

**Clean PVC (works):**
```bash
loko env destroy --purge-storage
loko env create
# mongo-express connects successfully
```

**Stale PVC (fails without post-deploy fix):**
```bash
loko env destroy  # keeps PVC data
loko env create
# MongoDB skips user creation, mongo-express auth fails
```

### Manual Recovery (if needed)

If mongo-express fails to connect due to stale PVC:

```bash
# Scale down MongoDB
kubectl scale statefulset mongodb -n loko-workloads --replicas=0

# Create temp pod without auth
kubectl run mongo-noauth --restart=Never --image=mongo:8.0.16 -n loko-workloads \
  --overrides='{"spec":{"containers":[{"name":"mongo","image":"mongo:8.0.16","command":["mongod","--bind_ip_all","--noauth"],"volumeMounts":[{"name":"data","mountPath":"/data/db"}]}],"volumes":[{"name":"data","persistentVolumeClaim":{"claimName":"mongodb-volume-mongodb-0"}}]}}'

kubectl wait --for=condition=Ready pod/mongo-noauth -n loko-workloads

# Create root user
MONGO_PASS=$(kubectl get secret mongodb -n loko-workloads -o jsonpath='{.data.MONGO_INITDB_ROOT_PASSWORD}' | base64 -d)
kubectl exec mongo-noauth -n loko-workloads -- mongosh admin --eval "db.createUser({user:'root',pwd:'$MONGO_PASS',roles:['root']})"

# Cleanup and restore
kubectl delete pod mongo-noauth -n loko-workloads
kubectl scale statefulset mongodb -n loko-workloads --replicas=1

# Restart mongo-express
kubectl rollout restart deployment mongo-express -n loko-workloads
```

### Future Improvements

**Option: Post-deploy user creation in loko**

Add to `runner.py` after MongoDB deployment:
1. Wait for MongoDB pod ready
2. Check if root user exists
3. Create user if missing with password from loko secrets

This would handle the stale PVC case automatically.

---

## PostgreSQL + pgAdmin

**Status:** Working (requires one-time password entry)

### Investigation Summary

**Problem:** pgAdmin would not auto-connect to PostgreSQL - always prompted for password.

**Root Cause Analysis:**

1. **pgpass file approach (failed):** Kubernetes secret mounts add group permissions via `fsGroup`, resulting in `0640` permissions. PostgreSQL's libpq requires exactly `0600`:
   ```
   WARNING: password file "/pgpass/pgpass" has group or world access; permissions should be u=rw (0600) or less
   ```

2. **Password in servers.json (failed):** pgAdmin's server import from JSON does not persist the `Password` field to its SQLite database - this is by design for security.

3. **PGADMIN_CONFIG_* env vars:** Required careful handling - values like `"False"` must be single-quoted in YAML to preserve Python capitalization (`'False'` not `"False"` which becomes `false`).

**Solution:** Add PVC for pgAdmin data persistence. User enters password once in browser, it's saved in SQLite database and persists across restarts.

### Code Changes Made

**1. `loko/generator.py`** - Added pgAdmin credential injection:

```python
elif companion_name == 'pgadmin':
    # Inject password into servers.json secret for pgAdmin
    secrets = base_values.get('secrets', {})
    config_secret = secrets.get('pgadmin-config', {})
    string_data = config_secret.get('stringData', {})
    if 'servers.json' in string_data:
        string_data['servers.json'] = string_data['servers.json'].replace('PGPASS_PLACEHOLDER', password)
```

**2. `loko/templates/loko-catalog.yaml`** - pgAdmin companion config:

```yaml
companions:
  - name: pgadmin
    description: Web UI for PostgreSQL management
    chart:
      repo: bjw-s
      name: bjw-s/app-template
      version: "4.0.1"
    secrets:
      uses-parent-credentials: true
    presets:
      defaultPodOptions:
        securityContext:
          fsGroup: 5050
      controllers:
        main:
          containers:
            main:
              image:
                repository: dpage/pgadmin4
                tag: "8"
              env:
                PGADMIN_DEFAULT_EMAIL: admin@local.dev
                PGADMIN_DEFAULT_PASSWORD: admin
                PGADMIN_CONFIG_SERVER_MODE: 'False'
                PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False'
                PGADMIN_CONFIG_ALLOW_SAVE_PASSWORD: 'True'
              securityContext:
                runAsUser: 5050
                runAsGroup: 5050
      secrets:
        pgadmin-config:
          stringData:
            servers.json: '{"Servers":{"1":{...,"Password":"PGPASS_PLACEHOLDER","SavePassword":true}}}'
      persistence:
        data:
          type: persistentVolumeClaim
          accessMode: ReadWriteOnce
          size: 1Gi
          advancedMounts:
            main:
              main:
                - path: /var/lib/pgadmin
        servers-config:
          type: secret
          identifier: pgadmin-config
          advancedMounts:
            main:
              main:
                - path: /pgadmin4/servers.json
                  subPath: servers.json
                  readOnly: true
      ingress:
        main:
          enabled: true
          hosts:
            - host: pgadmin.${LOKO_DOMAIN}
```

### Key Configuration Details

| Setting | Value | Reason |
|---------|-------|--------|
| `PGADMIN_CONFIG_SERVER_MODE` | `'False'` | Desktop mode, no login required |
| `PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED` | `'False'` | Skip master password prompt |
| `PGADMIN_CONFIG_ALLOW_SAVE_PASSWORD` | `'True'` | Allow saving passwords |
| `fsGroup: 5050` | pgAdmin GID | Allows reading mounted secrets |
| `runAsUser/runAsGroup: 5050` | pgAdmin UID/GID | Container security context |
| PVC for `/var/lib/pgadmin` | 1Gi | Persists SQLite database with saved passwords |

### First-Time Setup

**⚠️ One-time password entry required:**

1. Open https://pgadmin.dev.me
2. Expand "Servers" → "PostgreSQL"
3. Enter password when prompted: `loko secrets show`
4. Password is saved and persists across pod restarts

### Issues Encountered & Resolutions

| Issue | Cause | Resolution |
|-------|-------|------------|
| `NameError: name 'false' is not defined` | YAML converted `"False"` to `false` | Use single quotes: `'False'` |
| `Expected boolean value; got 'False'` | Double-escaped quotes in YAML | Use single quotes without escaping |
| `password file has group or world access` | fsGroup adds group read to secrets | Abandoned pgpass, use PVC persistence instead |
| Password not imported from servers.json | pgAdmin security design | Use PVC - enter password once manually |
| Helm schema validation errors | `!!str` tag leaked through ruamel.yaml | Use plain single-quoted strings |
| `defaultMode: 0600` became object | Octal in YAML via ruamel.yaml | Use decimal: `384` |

### Comparison with Docker Compose

Working Docker Compose setup uses:
```yaml
volumes:
  - pgadmin_data:/var/lib/pgadmin  # Persistent volume - key difference!
  - ./docker/pgadmin/servers.json:/pgadmin4/servers.json:ro
  - ./docker/pgadmin/pgpass:/pgpass:ro
```

In Docker Compose, mounted files keep host permissions (0600 works). In Kubernetes, secret mounts with fsGroup add group permissions, breaking libpq's strict permission check.

---

## MySQL + phpMyAdmin

**Status:** Working (auto-login, no manual password entry needed)

### Investigation Summary

**Problem:** phpMyAdmin showed login page, requiring manual credential entry.

**Root Cause:** The catalog presets only set `PMA_HOST` and `PMA_PORT`, but not `PMA_USER` and `PMA_PASSWORD` env vars needed for auto-login.

**Solution:** Inject `PMA_USER` and `PMA_PASSWORD` environment variables via generator credential injection. Simple and straightforward - no PVC or complex configuration needed.

### Code Changes Made

**1. `loko/generator.py`** - Added phpMyAdmin credential injection:

```python
elif companion_name == 'phpmyadmin':
    # Inject PMA_USER and PMA_PASSWORD env vars for phpMyAdmin auto-login
    controllers = base_values.get('controllers', {})
    main_controller = controllers.get('main', {})
    containers = main_controller.get('containers', {})
    main_container = containers.get('main', {})
    env = main_container.get('env', {})
    env['PMA_USER'] = 'root'
    env['PMA_PASSWORD'] = password
```

**2. `loko/templates/loko-catalog.yaml`** - phpMyAdmin companion config (minimal):

```yaml
companions:
  - name: phpmyadmin
    description: Web UI for MySQL management
    chart:
      repo: bjw-s
      name: bjw-s/app-template
      version: "4.0.1"
    secrets:
      uses-parent-credentials: true
    presets:
      controllers:
        main:
          containers:
            main:
              image:
                repository: phpmyadmin/phpmyadmin
                tag: latest
              env:
                PMA_HOST: mysql.${LOKO_SYSTEM_WORKLOADS_NAMESPACE}.svc.cluster.local
                PMA_PORT: "3306"
                # PMA_USER and PMA_PASSWORD injected by generator
      service:
        main:
          controller: main
          ports:
            http:
              port: 80
      ingress:
        main:
          enabled: true
          className: traefik
          hosts:
            - host: phpmyadmin.${LOKO_DOMAIN}
```

### Password Flow

```
loko secrets (persisted state)
    ↓
generator._get_or_generate_password('mysql')
    ↓
_inject_companion_credentials() → env['PMA_USER'] = 'root', env['PMA_PASSWORD'] = password
    ↓
helmfile.yaml → phpmyadmin helm values
    ↓
phpMyAdmin container env → auto-login to MySQL
```

### Key Configuration Details

| Setting | Value | Reason |
|---------|-------|--------|
| `PMA_HOST` | `mysql.${LOKO_SYSTEM_WORKLOADS_NAMESPACE}.svc.cluster.local` | MySQL service DNS |
| `PMA_PORT` | `3306` | MySQL default port |
| `PMA_USER` | `root` | Injected by generator |
| `PMA_PASSWORD` | (from secrets) | Injected by generator |

### Testing

```bash
loko env destroy --purge-storage
loko env create
# phpMyAdmin auto-logs in, shows MySQL databases
curl -ks https://phpmyadmin.dev.me/ | grep 'logged_in:true'
```

### Comparison with pgAdmin

phpMyAdmin is **much simpler** than pgAdmin:
- No PVC needed - credentials passed via environment variables
- No complex server import configuration
- Auto-login works out of the box
- No permission issues with mounted secrets

---

## Valkey + redis-commander

**Status:** Working (no auth needed, simplest setup)

### Investigation Summary

**Setup:** Valkey has no authentication by default. redis-commander just needs the `REDIS_HOSTS` environment variable pointing to the valkey service.

**Result:** Works out of the box with zero configuration changes needed.

### Catalog Configuration

```yaml
companions:
  - name: redis-commander
    description: Web UI for Redis/Valkey management
    chart:
      repo: bjw-s
      name: bjw-s/app-template
      version: "4.0.1"
    presets:
      controllers:
        main:
          containers:
            main:
              image:
                repository: ghcr.io/joeferner/redis-commander
                tag: latest
              env:
                REDIS_HOSTS: "valkey:valkey.${LOKO_SYSTEM_WORKLOADS_NAMESPACE}.svc.cluster.local:6379"
      service:
        main:
          controller: main
          ports:
            http:
              port: 8081
      ingress:
        main:
          enabled: true
          className: traefik
          hosts:
            - host: valkey-ui.${LOKO_DOMAIN}
```

### Key Configuration Details

| Setting | Value | Reason |
|---------|-------|--------|
| `REDIS_HOSTS` | `valkey:valkey.${LOKO_SYSTEM_WORKLOADS_NAMESPACE}.svc.cluster.local:6379` | Format: `label:host:port` |
| No auth env vars | N/A | Valkey has no password by default |

### Testing

```bash
loko env destroy --purge-storage
loko env create
# redis-commander connects automatically
curl -ks 'https://valkey-ui.dev.me/connections'
# Shows: {"ok":true,"connections":[{"label":"valkey",...}]}
```

### Notes

- **Simplest companion setup** - no credentials, no PVC, just one env var
- redis-commander API: use `/connections` (not `/apiv2/connections`)
- Keys tree API: `/apiv2/keystree/{connectionId}/`

---

## RabbitMQ

**Status:** Built-in UI (no companion needed)

RabbitMQ includes the management plugin with a web UI. Configured via `includes_ui` in the catalog:

```yaml
includes_ui:
  enabled: true
  port: 15672
  ingress_host: "rmq.{domain}"
```

Access at: https://rmq.dev.me (login with credentials from `loko secrets show`)

---

## Redpanda

**Status:** Built-in UI (no companion needed)

Redpanda chart includes Console as a bundled subchart. Configured via `includes_ui` in the catalog.

### Catalog Configuration

```yaml
includes_ui:
  enabled: true
  port: 8080
  ingress_host: "redpanda-ui.{domain}"

presets:
  statefulset:
    replicas: 1
  tls:
    enabled: false
  console:
    enabled: true
    ingress:
      enabled: true
      className: traefik
      hosts:
        - host: redpanda-ui.${LOKO_DOMAIN}
```

### Key Configuration Details

| Setting | Value | Reason |
|---------|-------|--------|
| `tls.enabled` | `false` | Avoid cert-manager dependency |
| `statefulset.replicas` | `1` | Single-node local cluster |
| `console.enabled` | `true` | Enable bundled Console UI |

Access at: https://redpanda-ui.dev.me

### Enterprise Trial Handling

Redpanda v24.3+ auto-starts a 30-day enterprise trial. To avoid license warnings after expiration, enterprise features are disabled via helm values:

```yaml
config:
  cluster:
    audit_enabled: false
    cloud_storage_enabled: false
    partition_autobalancing_mode: node_add
```

**Verification:**
```bash
kubectl exec redpanda-0 -n loko-workloads -c redpanda -- rpk cluster license info
# Should show: License violation: false
```

**After trial expires:**
- License status changes to `not_present`
- Cluster continues working normally (violation stays `false`)
- No data loss or feature degradation for OSS usage

### Notes

- Bundled console auto-connects to Kafka broker and Schema Registry
- TLS disabled simplifies setup for local dev
- Console shows broker info, topics, schema registry, consumer groups
- No authentication required for Console UI

---

## NATS + nats-dashboard

**Status:** Working (auto-configured, zero manual setup)

### Investigation Summary

**Problem:** nats-dashboard is a browser-based SPA that connects to NATS monitoring HTTP API. The browser cannot reach cluster-internal URLs directly.

**Solution:**
1. NATS presets include an ingress exposing the monitoring endpoint at `https://nats.${LOKO_DOMAIN}`
2. nats-dashboard mounts a `config.json` file that pre-configures the server URL

This provides a zero-touch setup similar to redis-commander.

### Catalog Configuration

**NATS presets** (exposes monitoring via ingress):
```yaml
presets:
  config:
    monitor:
      enabled: true
      port: 8222
  service:
    enabled: true
    ports:
      monitor:
        enabled: true
  # Expose monitoring endpoint via ingress for nats-dashboard access
  ingress:
    main:
      enabled: true
      className: traefik
      hosts:
        - host: nats.${LOKO_DOMAIN}
```

**nats-dashboard companion** (pre-configured server URL):
```yaml
companions:
  - name: nats-dashboard
    description: Web UI for NATS monitoring
    chart:
      repo: bjw-s
      name: bjw-s/app-template
      version: "4.0.1"
    presets:
      controllers:
        main:
          containers:
            main:
              image:
                repository: mdawar/nats-dashboard
                tag: latest
      configMaps:
        config:
          data:
            # Pre-configure NATS server URL (served at /config.json)
            config.json: '{"servers":[{"name":"NATS","url":"https://nats.${LOKO_DOMAIN}"}]}'
      persistence:
        config:
          type: configMap
          identifier: config
          advancedMounts:
            main:
              main:
                - path: /srv/config.json
                  subPath: config.json
                  readOnly: true
      service:
        main:
          controller: main
          ports:
            http:
              port: 80
      ingress:
        main:
          enabled: true
          className: traefik
          hosts:
            - host: nats-ui.${LOKO_DOMAIN}
```

### Key Configuration Details

| Setting | Value | Reason |
|---------|-------|--------|
| NATS `ingress.hosts` | `nats.${LOKO_DOMAIN}` | Exposes monitoring API externally |
| `config.json` | Pre-configured server URL | Dashboard loads server on startup |
| No auth env vars | N/A | NATS has no password by default |

### URLs

| URL | Purpose |
|-----|---------|
| `https://nats.dev.me/` | NATS monitoring endpoint (HTML landing page) |
| `https://nats.dev.me/varz` | Server variables |
| `https://nats.dev.me/connz` | Connections |
| `https://nats.dev.me/subsz` | Subscriptions |
| `https://nats.dev.me/jsz` | JetStream info |
| `https://nats-ui.dev.me/` | nats-dashboard UI |

### Testing

```bash
loko env destroy --purge-storage
loko env create

# Verify monitoring endpoint is accessible
curl -ks https://nats.dev.me/varz | jq '.server_name, .version'
# Returns: "nats-0", "2.12.3"

# Verify dashboard has pre-configured server
curl -ks https://nats-ui.dev.me/config.json
# Returns: {"servers":[{"name":"NATS","url":"https://nats.dev.me"}]}

# Test NATS connectivity via nats-box
kubectl exec -n loko-workloads deploy/nats-box -- nats pub test "hello"
```

Access at: https://nats-ui.dev.me

### Notes

- **Zero manual setup**: Server URL is pre-configured via mounted `config.json`
- Dashboard shows server info, connections, subscriptions, JetStream streams
- Similar pattern to `https://demo.nats.io:8222` but on standard HTTPS port

---

## Garage + garage-webui

**Status:** Working (auto-configured, zero manual setup)

### Investigation Summary

**Problem:** garage-webui requires access to Garage's admin API (port 3903) for cluster management, and an admin token for authentication.

**Challenges Solved:**

1. **Admin token generation**: Garage's admin API requires an `admin_token` in the config or via `GARAGE_ADMIN_TOKEN` env var. The helm chart didn't expose this in the config file, but Garage supports the env var on the server side.

2. **Admin API service exposure**: The garage helm chart only exposes ports 3900 (S3 API) and 3902 (web hosting) by default. Port 3903 (admin API) is only exposed when `monitoring.metrics.enabled=true`.

3. **Namespace references**: Fixed hardcoded "common-services" namespace references that should have been "loko-workloads" (the configurable system namespace).

**Solution:**
- Generator creates and persists a random 32-char admin token in persisted secrets
- Token is injected into garage pod via `GARAGE_ADMIN_TOKEN` env var (chart's `environment` list)
- Token is injected into garage-webui pod via `API_ADMIN_KEY` env var
- Enable `monitoring.metrics.enabled=true` to expose admin API on port 3903
- garage-webui connects via `garage-metrics` headless service

### Code Changes Made

**1. `loko/generator.py`** - Added admin token generation and injection:

```python
def _get_or_generate_admin_token(self, workload_name: str, length: int = 32) -> str:
    """Get existing admin token from persisted secrets or generate and persist a new one."""
    existing = self._existing_secrets.get(workload_name, {})
    if 'admin_token' in existing:
        return existing['admin_token']

    admin_token = self.generate_random_password(length)
    if workload_name not in self._existing_secrets:
        self._existing_secrets[workload_name] = {}
    self._existing_secrets[workload_name]['admin_token'] = admin_token
    self._save_secrets()
    return admin_token
```

Chart auth config for garage:
```python
elif chart_basename == 'garage':
    # Garage helm chart expects environment as a list of {name, value} pairs
    admin_token = self._get_or_generate_admin_token(workload_name)
    return {
        'environment': [
            {'name': 'GARAGE_ADMIN_TOKEN', 'value': admin_token}
        ]
    }
```

Companion credential injection for garage-webui:
```python
elif companion_name == 'garage-webui':
    # Inject API_ADMIN_KEY env var for Garage admin API access
    controllers = base_values.get('controllers', {})
    main_controller = controllers.get('main', {})
    containers = main_controller.get('containers', {})
    main_container = containers.get('main', {})
    env = main_container.get('env', {})
    env['API_ADMIN_KEY'] = password  # 'password' is actually admin_token for garage-webui
```

Special handling in `_process_companions()`:
```python
if catalog_companion.secrets and catalog_companion.secrets.uses_parent_credentials:
    # Garage-webui needs admin token, not password
    if companion_name == 'garage-webui':
        parent_credential = self._get_or_generate_admin_token(workload_name)
    else:
        parent_credential = self._get_or_generate_password(workload_name)
    self._inject_companion_credentials(companion_name, base_values, parent_credential)
```

**2. `loko/templates/loko-catalog.yaml`** - Garage and garage-webui config:

```yaml
garage:
  category: storage
  description: S3-compatible distributed object storage
  defaults:
    ports: [3900, 3902]
    storage:
      size: 20Gi
  presets:
    monitoring:
      metrics:
        enabled: true  # Exposes admin API port 3903 for webui access
    # ... other presets
  # Note: GARAGE_ADMIN_TOKEN env var injected by generator
  companions:
    - name: garage-webui
      description: Web UI for Garage S3 storage management
      secrets:
        uses-parent-credentials: true  # Inject admin token from parent
      presets:
        controllers:
          main:
            containers:
              main:
                image:
                  repository: khairul169/garage-webui
                  tag: latest
                env:
                  S3_ENDPOINT_URL: "http://garage.${LOKO_SYSTEM_WORKLOADS_NAMESPACE}.svc.cluster.local:3900"
                  S3_REGION: "garage"
                  # Admin API exposed via garage-metrics service (headless)
                  API_BASE_URL: "http://garage-metrics.${LOKO_SYSTEM_WORKLOADS_NAMESPACE}.svc.cluster.local:3903"
                  # API_ADMIN_KEY injected by generator from garage admin token
        ingress:
          main:
            enabled: true
            className: traefik
            hosts:
              - host: garage-ui.${LOKO_DOMAIN}
```

### Token/Credential Flow

```
Generator startup
    ↓
_get_or_generate_admin_token('garage')
    ↓
persisted_secrets['garage']['admin_token'] = "lVGnJBx4..."
    ↓
_generate_chart_auth_config() → environment: [{name: GARAGE_ADMIN_TOKEN, value: token}]
    ↓
helmfile.yaml → garage helm values → garage-0 pod env
    ↓
_process_companions() → _inject_companion_credentials('garage-webui', ..., admin_token)
    ↓
helmfile.yaml → garage-webui helm values → API_ADMIN_KEY env var
    ↓
garage-webui connects to garage-metrics:3903 with API_ADMIN_KEY header
```

### Key Configuration Details

| Setting | Value | Reason |
|---------|-------|--------|
| `monitoring.metrics.enabled` | `true` | Exposes admin API (port 3903) via `garage-metrics` service |
| `GARAGE_ADMIN_TOKEN` | (generated) | Server-side admin API authentication |
| `API_BASE_URL` | `http://garage-metrics...svc:3903` | Admin API endpoint (headless service) |
| `API_ADMIN_KEY` | (same token) | Client-side authentication header |
| `S3_ENDPOINT_URL` | `http://garage...svc:3900` | S3 API for bucket operations |

### Services Created

| Service | Type | Ports | Purpose |
|---------|------|-------|---------|
| `garage` | ClusterIP | 3900, 3902 | S3 API + Web hosting |
| `garage-headless` | ClusterIP (None) | 3900, 3902 | StatefulSet DNS |
| `garage-metrics` | ClusterIP (None) | 3903 | Admin API access |
| `garage-webui` | ClusterIP | 3909 | Web UI |

### Testing

```bash
# Deploy garage with webui
loko workloads add garage
loko companion add garage garage-webui
loko workloads enable garage --now
loko companion enable garage garage-webui --now

# Verify admin API works
kubectl run test-curl --rm -it --restart=Never --image=curlimages/curl:8.11.0 -- \
  curl -s http://garage-metrics.loko-workloads.svc.cluster.local:3903/health
# Returns: "Garage is fully operational"

# Verify webui can proxy to admin API
curl -sk https://garage-ui.dev.me/api/health
# Returns: "Garage is fully operational"

# Check cluster health via webui
curl -sk https://garage-ui.dev.me/api/v2/GetClusterHealth | jq
# Returns: {"status":"healthy","knownNodes":1,...}

# Test S3 web hosting
aws s3 cp index.html s3://dev-me-bucket/ --endpoint-url https://garage.dev.me --profile garage-dev-me
curl -sk https://dev-me-bucket.garage.dev.me/
# Returns your uploaded index.html
```

Access at:
- **Web UI**: https://garage-ui.dev.me
- **S3 API**: https://garage.dev.me
- **Bucket web hosting**: https://{bucket-name}.garage.dev.me

### Notes

- **Zero manual setup**: Like NATS dashboard, garage-webui auto-configures with injected credentials
- **S3 credentials**: Created via `garage key create` during post-deploy configuration (stored in persisted secrets)
- **Admin token**: Generated by loko, injected via env var (Garage supports both config file and env var)
- **Bucket web hosting**: Upload `index.html` to any bucket, accessible at `https://{bucket}.garage.dev.me/`

---

## Summary: All Companions

| Workload | Companion | Status | Auth Method | Manual Setup |
|----------|-----------|--------|-------------|--------------|
| MongoDB | mongo-express | ✅ Working | Password injection | None |
| PostgreSQL | pgAdmin | ✅ Working | PVC persistence | One-time password entry |
| MySQL | phpMyAdmin | ✅ Working | Env var injection | None |
| Valkey | redis-commander | ✅ Working | No auth needed | None |
| RabbitMQ | (built-in) | ✅ Working | Default creds | None |
| Redpanda | (built-in Console) | ✅ Working | No auth needed | None |
| NATS | nats-dashboard | ✅ Working | ConfigMap + Ingress | None |
| Garage | garage-webui | ✅ Working | Admin token injection | None |
