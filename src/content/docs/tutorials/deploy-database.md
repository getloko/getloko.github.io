---
title: "Deploy a Database"
---


Step-by-step tutorial for deploying a PostgreSQL database with LoKO.

## Overview

This tutorial covers:

- Adding PostgreSQL to your environment
- Accessing the database
- Connecting from applications
- Managing data persistence
- Deploying additional tools (pgAdmin)

**Time**: 10 minutes

**Prerequisites**:
- LoKO installed
- Environment created ([First Cluster](first-cluster))

---

## Step 1: Add PostgreSQL

Add PostgreSQL to your configuration:

```bash
loko workloads add postgres
```

**Output**:
```
✓ Added postgres to loko.yaml
  State: enabled (not deployed)

Next steps:
  Deploy:  loko workloads deploy postgres
  Disable: loko workloads disable postgres
```

This adds PostgreSQL to `loko.yaml`:

```yaml
workloads:
  postgres:
    enabled: true
    namespace: loko-workloads
    storage:
      enabled: true
      size: 10Gi
    ports:
      - 5432
```

---

## Step 2: Deploy PostgreSQL

Deploy the workload:

```bash
loko workloads deploy postgres
```

**Output**:
```
Deploying workloads: postgres

Generated credentials:
  postgres:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: 8x9YzA2bC3dE4fG
    POSTGRES_DB: postgres

Credentials saved to: .loko-secrets.txt

Deploying via helmfile...
✓ postgres deployed successfully

Status:
  postgres: Running (1/1 pods ready)
  Endpoint: postgres.dev.me:5432
```

**What happened**:

1. Generated random password
2. Created Kubernetes namespace
3. Deployed PostgreSQL via Helm
4. Created PersistentVolumeClaim (10Gi)
5. Configured TCP routing through Traefik
6. Updated DNS for `postgres.dev.me`

---

## Step 3: Verify Deployment

Check status:

```bash
loko status
```

**Output**:
```
Environment: loko-dev-me
Cluster: Running

Workloads:
  postgres (loko-workloads)
    Status: Running
    Pods: 1/1
    Endpoint: postgres.dev.me:5432
    Storage: 10Gi (PVC: postgres-data)
```

Check credentials:

```bash
cat .loko-secrets.txt
```

**Output**:
```
=== postgres ===
POSTGRES_USER: postgres
POSTGRES_PASSWORD: 8x9YzA2bC3dE4fG
POSTGRES_DB: postgres
```

---

## Step 4: Connect to Database

### Using psql CLI

```bash
# Get password from .loko-secrets.txt
export PGPASSWORD="8x9YzA2bC3dE4fG"

# Connect
psql -h postgres.dev.me -U postgres -d postgres
```

**Interactive session**:
```sql
postgres=# SELECT version();
postgres=# \l  -- List databases
postgres=# \q  -- Quit
```

### Using DBeaver / DataGrip

**Connection Details**:
- Host: `postgres.dev.me`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: (from `.loko-secrets.txt`)

### Using GUI Tool

Deploy pgAdmin:

```bash
loko workloads add pgadmin --now
```

Access at: http://pgadmin.dev.me

**Add Server**:
1. Right-click "Servers" → "Create" → "Server"
2. **General** tab:
   - Name: "LoKO PostgreSQL"
3. **Connection** tab:
   - Host: `postgres.dev.me`
   - Port: `5432`
   - Username: `postgres`
   - Password: (from `.loko-secrets.txt`)
4. Click "Save"

---

## Step 5: Create Database and Tables

Connect and create a sample database:

```sql
-- Create database
CREATE DATABASE myapp;

-- Connect to it
\c myapp

-- Create table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com');

-- Query
SELECT * FROM users;
```

---

## Step 6: Connect from Application

### Python Application

**install psycopg2**:
```bash
pip install psycopg2-binary
```

**connect.py**:
```python
import psycopg2
import os

# Read password from file
with open('.loko-secrets.txt') as f:
    for line in f:
        if 'POSTGRES_PASSWORD' in line:
            password = line.split(': ')[1].strip()

# Connect
conn = psycopg2.connect(
    host="postgres.dev.me",
    port=5432,
    database="myapp",
    user="postgres",
    password=password
)

# Query
cur = conn.cursor()
cur.execute("SELECT * FROM users")
rows = cur.fetchall()

for row in rows:
    print(row)

cur.close()
conn.close()
```

**Run**:
```bash
python connect.py
```

### Go Application

**main.go**:
```go
package main

import (
    "database/sql"
    "fmt"
    _ "github.com/lib/pq"
)

func main() {
    connStr := "host=postgres.dev.me port=5432 user=postgres password=8x9YzA2bC3dE4fG dbname=myapp sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        panic(err)
    }
    defer db.Close()

    rows, err := db.Query("SELECT * FROM users")
    if err != nil {
        panic(err)
    }
    defer rows.Close()

    for rows.Next() {
        var id int
        var name, email string
        var createdAt string
        rows.Scan(&id, &name, &email, &createdAt)
        fmt.Printf("%d: %s <%s>\n", id, name, email)
    }
}
```

### Node.js Application

**install pg**:
```bash
npm install pg
```

**app.js**:
```javascript
const { Client } = require('pg')

const client = new Client({
  host: 'postgres.dev.me',
  port: 5432,
  user: 'postgres',
  password: '8x9YzA2bC3dE4fG',  // From .loko-secrets.txt
  database: 'myapp'
})

client.connect()

client.query('SELECT * FROM users', (err, res) => {
  console.log(res.rows)
  client.end()
})
```

---

## Step 7: Configure Custom Settings

Customize PostgreSQL settings in `loko.yaml`:

```yaml
workloads:
  postgres:
    enabled: true
    storage:
      size: 20Gi  # Increase storage
    values:
      settings:
        max_connections: "200"       # Increase connections
        shared_buffers: "512MB"      # Increase buffer
        work_mem: "4MB"
        maintenance_work_mem: "64MB"
```

Apply changes:

```bash
loko workloads deploy postgres --force
```

---

## Step 8: Data Persistence

### Verify Persistent Storage

Check PVC:

```bash
kubectl get pvc -n loko-workloads
```

**Output**:
```
NAME            STATUS   VOLUME     CAPACITY   STORAGE CLASS
postgres-data   Bound    pvc-xxx    10Gi       standard
```

### Test Persistence

1. **Insert data**:
```sql
INSERT INTO users (name, email) VALUES ('Charlie', 'charlie@example.com');
SELECT COUNT(*) FROM users;  -- Should be 3
```

2. **Recreate cluster**:
```bash
loko env recreate
```

3. **Deploy again**:
```bash
loko workloads deploy postgres
```

4. **Check data** (should still exist):
```sql
SELECT COUNT(*) FROM users;  -- Still 3
```

**Note**: Data persists across cluster recreations because it's stored in Docker volumes.

---

## Step 9: Backup and Restore

### Manual Backup

```bash
# Backup database
pg_dump -h postgres.dev.me -U postgres myapp > backup.sql

# Restore to new database
psql -h postgres.dev.me -U postgres -d postgres -c "CREATE DATABASE myapp_restore"
psql -h postgres.dev.me -U postgres myapp_restore < backup.sql
```

### Automated Backups

Use Kubernetes CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: loko-workloads
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - sh
            - -c
            - pg_dump -h postgres -U postgres myapp > /backup/backup-$(date +%Y%m%d).sql
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            hostPath:
              path: /tmp/postgres-backups
```

---

## Step 10: Clean Up

### Remove workload (keep data):

```bash
loko workloads disable postgres --now
```

### Remove workload and data:

```bash
loko workloads remove postgres --undeploy
```

This deletes:
- Deployment
- Service
- PersistentVolumeClaim
- Secrets

---

## Next Steps

Try deploying other databases:

```bash
# MySQL
loko workloads add mysql --now

# MongoDB
loko workloads add mongodb --now

# Redis-compatible cache
loko workloads add valkey --now
```

See [Workload Catalog](../catalog/workloads) for all available workloads.

---

## Troubleshooting

### Can't connect to database

**Check DNS**:
```bash
ping postgres.dev.me  # Should resolve
```

**Check pod status**:
```bash
kubectl get pods -n loko-workloads
kubectl logs -n loko-workloads postgres-xxx
```

**Check service**:
```bash
kubectl get svc -n loko-workloads
```

### Password doesn't work

**Regenerate secrets**:
```bash
loko workloads remove postgres --undeploy
rm .loko-secrets.txt
loko workloads add postgres --now
```

### Storage full

**Increase size**:
```yaml
workloads:
  postgres:
    storage:
      size: 50Gi  # Increase from 10Gi
```

**Redeploy**:
```bash
loko workloads deploy postgres --force
```

---

## See Also

- [Workload Management](../user-guide/workload-management) - Complete workload guide
- [Workload Catalog](../catalog/workloads) - All available workloads
- [Custom Workload Tutorial](custom-workload) - Deploy custom applications
- [First Cluster Tutorial](first-cluster) - Getting started
