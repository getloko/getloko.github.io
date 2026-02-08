---
title: "Tutorial: Your First Cluster"
---


This hands-on tutorial will guide you through creating your first LoKO environment, deploying a database, and connecting to it.

**Time required:** ~15 minutes

**What you'll learn:**
- Install LoKO
- Generate and customize configuration
- Create a Kubernetes cluster
- Deploy a PostgreSQL database
- Connect to the database
- Deploy a web UI (pgAdmin)

## Prerequisites

Before starting, ensure you have:

- Docker Desktop running
- 8GB RAM available
- Internet connection

If you haven't installed prerequisites yet, see the [Installation Guide](../getting-started/installation).

## Step 1: Install LoKO

Install LoKO with Homebrew:

```bash
brew install getloko/tap/loko
```

Verify installation:

```bash
loko --version
```

Check that the tools LoKO drives are all present:

```bash
loko check prerequisites
```

Expected output:
```
  [present] docker (recommended: 20.10+)
  [present] git
  [present] kind (recommended: 0.33.0)
  [present] helm (recommended: 3.17.1)
  [present] helmfile (recommended: 0.171.0)
  [present] cfssl (recommended: 1.6.5)
  [present] kubectl (recommended: 1.35.1)
```
A zero exit code means everything required is present — there is no closing summary banner.

## Step 2: Generate Configuration

Create your configuration file:

```bash
loko config generate
```

This creates `loko.yaml` with auto-detected settings.

Let's review what was generated:

```bash
cat loko.yaml | head -30
```

Key settings:
- **Environment name**: Based on your hostname
- **Domain**: `<hostname>.local`
- **Network IP**: Your local IP address
- **Cluster**: 1 control-plane + 2 workers

## Step 3: Create Environment

Create the complete environment:

```bash
loko env create
```

This process takes ~2-3 minutes. LoKO will:

1. ✅ Generate configuration files
2. ✅ Create TLS certificates with LoKO's `cfssl`-based certificate flow
3. ✅ Start DNS service
4. ✅ Create Kind cluster
5. ✅ Deploy Traefik ingress controller
6. ✅ Deploy Zot container registry
7. ✅ Deploy metrics-server
8. ✅ Validate the environment

Watch the progress bars as LoKO sets everything up!

## Step 4: Verify Environment

Check that everything is running:

```bash
loko status
```

You should see:

```
STATUS
COMPONENT   STATUS    SUMMARY
cluster     healthy   running
registry    healthy   enabled
```

For node-level detail, run `kubectl get nodes`. Your cluster is ready.

## Step 5: Deploy PostgreSQL

Let's deploy a PostgreSQL database.

### Enable PostgreSQL

```bash
loko workloads add postgres
```

This turns PostgreSQL on in `loko.yaml` but doesn't deploy it yet.

### Deploy

```bash
loko workloads deploy postgres
```

### Wait for Deployment

Check readiness:

```bash
loko workloads health
```

Expected output (plain columns: Name / Status / Pods / Chart):
```
postgres             Running      1/1                groundhog2k/postgres
```

## Step 6: Get Connection Details

### View Endpoints

```bash
loko workloads endpoints postgres
```

Output (headers: TYPE, NAME, PROTOCOL, PORT, URL / ADDRESS — one row per internal/external pair):
```
Internal  client  tcp  5432  postgres.loko-workloads.svc.cluster.local:5432
External  client  tcp  5432  postgres.dev.me:5432
```

### Get Connection Strings

```bash
loko workloads connect postgres --show-password
```

Output (headers: TYPE, NAME, CONNECTION STRING):
```
Internal  default  postgresql://postgres:abc123xyz@postgres.loko-workloads.svc.cluster.local:5432/postgres
External  default  postgresql://postgres:abc123xyz@postgres.dev.me:5432/postgres
```

:::tip[Save Credentials]
Credentials are automatically saved to persisted environment secrets.
:::

## Step 7: Connect to PostgreSQL

### Using psql (if installed)

```bash
psql -h postgres.dev.me -U postgres
```

Enter the password from the connection string.

### Using Port Forward

If DNS isn't configured yet:

```bash
# In one terminal
kubectl port-forward svc/postgres 5432:5432 -n common-services

# In another terminal
psql -h localhost -p 5432 -U postgres
```

### Using Docker

```bash
# Get password
PASSWORD=$(loko secrets show --all | jq -r '.postgres.password')

# Connect via Docker
docker run -it --rm postgres:15 \
  psql -h postgres.dev.me -U postgres -W
```

## Step 8: Test the Database

Once connected to psql, try some commands:

```sql
-- Create a test database
CREATE DATABASE testdb;

-- List databases
\l

-- Create a table
\c testdb
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

-- Insert data
INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com');

-- Query data
SELECT * FROM users;
```

Output:
```
 id | name  |       email
----+-------+-------------------
  1 | Alice | alice@example.com
  2 | Bob   | bob@example.com
```

Perfect! Your database is working.

## Step 9: Deploy pgAdmin Web UI

Let's add a web interface for PostgreSQL.

### Enable and deploy the UI

`postgres-ui` (pgAdmin) is a linked child of `postgres` in the catalog — browse it with `loko catalog info`.

```bash
loko workloads add postgres-ui --now
loko workloads deploy postgres-ui
```

### Access pgAdmin

Open your browser and go to:
```
https://postgres-ui.dev.me
```

:::note[Browser Warning]
If trust setup has not completed on your machine yet, you may see a certificate warning on first access. Run `loko certs ca install` to reinstall the global CA trust.
:::

**Login credentials:**
- Email: `admin@pgadmin.org`
- Password: `loko secrets show postgres-ui`

### Add PostgreSQL Server in pgAdmin

1. Click "Add New Server"
2. **General** tab:
   - Name: `Local Postgres`
3. **Connection** tab:
   - Host: `postgres.common-services.svc.cluster.local`
   - Port: `5432`
   - Username: `postgres`
   - Password: (from secrets)
4. Click "Save"

You can now browse your database using the web UI!

## Step 10: View Logs

Check what's happening in PostgreSQL:

```bash
# View recent logs
loko logs workload postgres --tail 50

# Follow logs in real-time
loko logs workload postgres --follow
```

## Step 11: Check Health

Run health checks:

```bash
loko workloads health
```

Output (plain columns: Name / Status / Pods / Chart):
```
postgres             Running      1/1                groundhog2k/postgres
```

## Step 12: Deploy More Workloads

Let's add MySQL and Redis:

```bash
# Enable and deploy MySQL
loko workloads add mysql --now
loko workloads deploy mysql

# Enable and deploy Valkey (Redis-compatible)
loko workloads add valkey --now
loko workloads deploy valkey

# Check them all
loko catalog list
```

## Step 13: Explore the Registry

LoKO includes a container registry. Let's use it:

### View Registry Status

```bash
loko registry status
```

### Build and Push an Image

```bash
# Create a simple Dockerfile
cat > Dockerfile <<EOF
FROM nginx:alpine
RUN echo '<h1>Hello from LoKO!</h1>' > /usr/share/nginx/html/index.html
EOF

# Build image
docker build -t cr.dev.me/hello:latest .

# Push to registry
docker push cr.dev.me/hello:latest

# Verify
loko registry repos
```

## Step 14: Manage Your Environment

### Stop Environment (Preserve Data)

```bash
loko env stop
```

Cluster containers stop but data persists.

### Start Environment

```bash
loko env start
```

Everything resumes where you left off!

### View All Secrets

```bash
loko secrets show
```

## What You've Learned

Congratulations! You've:

- ✅ Installed LoKO and prerequisites
- ✅ Generated and customized configuration
- ✅ Created a local Kubernetes cluster with Kind
- ✅ Deployed PostgreSQL database
- ✅ Connected to the database via psql
- ✅ Deployed pgAdmin web UI
- ✅ Performed health checks and viewed logs
- ✅ Used the local container registry
- ✅ Managed environment lifecycle

## Next Steps

Now that you have a working environment:

### Tutorials
- [Deploy a Custom Application](custom-workload)
- [Multi-Node Cluster Setup](multi-node-setup)
- [Deploy a Database Cluster](deploy-database)

### User Guides
- [Workload Management](../user-guide/workload-management) - Deploy more services
- [Network & DNS](../user-guide/network-dns) - Configure DNS
- [Registry](../user-guide/registry) - Use the local registry
- [Configuration](../user-guide/configuration) - Customize your setup

### Reference
- [CLI Reference](../user-guide/cli-reference) - All commands
- [Workload Catalog](../_catalog/workloads) - Available workloads
- [Troubleshooting](../reference/troubleshooting) - Common issues

## Clean Up

When you're done experimenting:

### Soft Cleanup (Keep Configuration)

```bash
loko env destroy
```

### Full Cleanup (Remove Everything)

```bash
loko env clean
```

### Remove LoKO

```bash
brew uninstall loko
```

---

**Questions or issues?** Check the [Troubleshooting Guide](../reference/troubleshooting) or [open an issue](https://github.com/getloko/loko/issues).
