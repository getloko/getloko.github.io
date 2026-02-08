---
title: Cache & Key-Value Workloads
---

In-memory caching solutions for high-performance applications.

## Available Workloads

### Valkey

Redis-compatible in-memory data store with phpCacheAdmin web UI.

**Features:**

- Redis protocol compatible
- High performance (100k+ ops/sec)
- Data persistence options
- Pub/Sub messaging
- Multiple data structures (strings, hashes, lists, sets, sorted sets)

**Use Cases:**

- Session storage
- Cache layer
- Real-time analytics
- Message broker
- Rate limiting

**Deployment:**

```bash
# Add and deploy
loko workloads add valkey --now

# Get connection details
loko workloads connect valkey
```

**Endpoints:**

- **Cache Server**: Port 6379
- **Web UI (phpCacheAdmin/cache-ui)**: `https://cache-ui.${LOKO_DOMAIN}`

**Connection String:**

```
redis://:${PASSWORD}@valkey.${LOKO_DOMAIN}:6379
```

**Configuration Example:**

```python
# Python with redis-py
import redis

r = redis.Redis(
    host='valkey.${LOKO_DOMAIN}',
    port=6379,
    password='<your-password>',
    decode_responses=True
)

r.set('key', 'value')
print(r.get('key'))
```

**Chart:** groundhog2k/redis (Valkey is Redis fork-compatible)

### Memcached

High-performance distributed memory caching system with phpCacheAdmin web UI.

**Features:**

- Simple key-value storage
- High performance (50k+ ops/sec)
- Multi-threaded architecture
- LRU eviction policy
- Binary and text protocols

**Use Cases:**

- Database query caching
- Session storage
- Full page caching
- API response caching
- Object caching

**Deployment:**

```bash
# Add and deploy
loko workloads add memcached --now

# Get connection details
loko workloads connect memcached
```

**Endpoints:**

- **Cache Server**: Port 11211
- **Web UI (phpCacheAdmin)**: `https://cache-ui.${LOKO_DOMAIN}`

**Connection String:**

```
memcached.${LOKO_DOMAIN}:11211
```

**Configuration Example:**

```python
# Python with pymemcache
from pymemcache.client import base

client = base.Client(('memcached.${LOKO_DOMAIN}', 11211))
client.set('key', 'value')
print(client.get('key'))
```

**Chart:** cloudpirates/memcached

### Cache UI

Unified web interface for managing Redis, Memcached, and other cache backends using phpCacheAdmin.

**Features:**

- Multi-backend support (Redis, Memcached, APCu)
- Real-time statistics and monitoring
- Key/value browsing and editing
- Server switching in single interface
- Redis cluster and ACL support

**Access:**

```
https://cache-ui.${LOKO_DOMAIN}
```

The cache-ui workload automatically connects to both Valkey and Memcached instances when deployed.

## Next Steps

- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
