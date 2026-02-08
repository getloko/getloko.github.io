---
title: Object Storage Workloads
---

S3-compatible distributed object storage for files and backups.

## Available Workloads

### Garage

Lightweight S3-compatible distributed object storage.

**Garage Features:**

- S3 API compatible
- Distributed and fault-tolerant
- Lightweight (written in Rust)
- No single point of failure
- Automatic data replication

**Garage Use Cases:**

- Application file storage
- Backup and archival
- Static website hosting
- Media storage
- Development and testing S3 workflows

**Garage Deployment:**

```bash
loko workloads add garage --now
loko workloads connect garage
```

**Garage Endpoints:**

- **S3 API**: Port 3900
- **Admin API**: Port 3903

**Garage Configuration:**

Garage requires initial setup to create access keys:

```bash
# Get the garage pod
kubectl get pods -n loko-workloads -l app=garage

# Access garage CLI
kubectl exec -it garage-0 -n loko-workloads -- garage

# Create a key
garage key create my-app-key

# Allow key to access a bucket
garage bucket create my-bucket
garage bucket allow my-bucket --read --write --key my-app-key
```

**Garage S3 Client Configuration:**

```python
# Python with boto3
import boto3

s3 = boto3.client(
    's3',
    endpoint_url='https://garage.${LOKO_DOMAIN}:3900',
    aws_access_key_id='<your-access-key>',
    aws_secret_access_key='<your-secret-key>',
    region_name='garage'
)

# Upload file
s3.upload_file('local-file.txt', 'my-bucket', 'remote-file.txt')
```

**Garage Chart:** groundhog2k/garage

## Next Steps

- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
