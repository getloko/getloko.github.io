---
title: Database Workloads
---

Production-ready databases with web management UIs.

## Available Workloads

### PostgreSQL

Industry-standard relational database with pgAdmin web UI.

**Features:**

- Full ACID compliance
- Advanced indexing and query optimization
- JSON/JSONB support
- Replication and high availability

**Deployment:**

```bash
# Add and deploy
loko workloads add postgres --now

# Get connection details
loko workloads connect postgres
```

**Endpoints:**

- **Database**: Port 5432
- **Web UI (pgAdmin)**: `https://postgres-ui.${LOKO_DOMAIN}`

**Connection String:**

```
postgresql://postgres:${PASSWORD}@postgres.${LOKO_DOMAIN}:5432/${DATABASE}
```

**Code Example:**

```python
# Python with psycopg2
import psycopg2

conn = psycopg2.connect(
    host='postgres.${LOKO_DOMAIN}',
    port=5432,
    user='postgres',
    password='<your-password>',
    database='mydb'
)

cursor = conn.cursor()
cursor.execute('SELECT version()')
print(cursor.fetchone())
conn.close()
```

**Chart:** groundhog2k/postgres

---

### MySQL

Popular open-source relational database with phpMyAdmin web UI.

**Features:**

- Fast and reliable
- Wide compatibility
- Stored procedures and triggers
- Full-text search

**Deployment:**

```bash
loko workloads add mysql --now
loko workloads connect mysql
```

**Endpoints:**

- **Database**: Port 3306
- **Web UI (phpMyAdmin)**: `https://mysql-ui.${LOKO_DOMAIN}`

**Connection String:**

```
mysql://root:${PASSWORD}@mysql.${LOKO_DOMAIN}:3306/${DATABASE}
```

**Code Example:**

```python
# Python with mysql-connector
import mysql.connector

conn = mysql.connector.connect(
    host='mysql.${LOKO_DOMAIN}',
    port=3306,
    user='root',
    password='<your-password>',
    database='mydb'
)

cursor = conn.cursor()
cursor.execute('SELECT VERSION()')
print(cursor.fetchone())
conn.close()
```

**Chart:** groundhog2k/mysql

---

### MongoDB

NoSQL document database with mongo-express web UI.

**Features:**

- Flexible schema design
- Horizontal scaling
- Rich query language
- Aggregation framework

**Deployment:**

```bash
loko workloads add mongodb --now
loko workloads connect mongodb
```

**Endpoints:**

- **Database**: Port 27017
- **Web UI (mongo-express)**: `https://mongodb-ui.${LOKO_DOMAIN}`

**Connection String:**

```
mongodb://root:${PASSWORD}@mongodb.${LOKO_DOMAIN}:27017/${DATABASE}?authSource=admin
```

**Code Example:**

```python
# Python with pymongo
from pymongo import MongoClient

client = MongoClient(
    host='mongodb.${LOKO_DOMAIN}',
    port=27017,
    username='root',
    password='<your-password>',
    authSource='admin'
)

db = client['mydb']
collection = db['mycollection']
collection.insert_one({'name': 'test', 'value': 123})
print(collection.find_one({'name': 'test'}))
```

**Chart:** groundhog2k/mongodb

---

### DynamoDB Local

Local DynamoDB for development and testing with AWS-compatible NoSQL interface and web UI.

**Features:**

- AWS DynamoDB API compatible
- No AWS account required
- Local development and testing
- Persistent storage option
- Fast iteration cycles

**Use Cases:**

- Local development for DynamoDB applications
- Integration testing
- Offline development
- Learning DynamoDB without AWS costs

**Deployment:**

```bash
loko workloads add dynamodb-local --now
loko workloads connect dynamodb-local
```

**Endpoints:**

- **DynamoDB API**: Port 8000
- **Web UI (dynamodb-admin)**: `https://dynamodb-admin.${LOKO_DOMAIN}`

**Connection String:**

```
http://dynamodb-local.${LOKO_DOMAIN}:8000
```

**Code Example:**

```python
# Python with boto3
import boto3

# Configure DynamoDB client for local endpoint
dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url='http://dynamodb-local.${LOKO_DOMAIN}:8000',
    region_name='us-east-1',
    aws_access_key_id='local',
    aws_secret_access_key='local'
)

# Create table
table = dynamodb.create_table(
    TableName='Users',
    KeySchema=[
        {'AttributeName': 'id', 'KeyType': 'HASH'}
    ],
    AttributeDefinitions=[
        {'AttributeName': 'id', 'AttributeType': 'S'}
    ],
    BillingMode='PAY_PER_REQUEST'
)

# Put item
table.put_item(Item={'id': '1', 'name': 'John Doe'})

# Get item
response = table.get_item(Key={'id': '1'})
print(response['Item'])
```

**AWS CLI Example:**

```bash
aws dynamodb list-tables \
  --endpoint-url http://dynamodb-local.${LOKO_DOMAIN}:8000 \
  --region us-east-1
```

**Chart:** bjw-s/app-template (amazon/dynamodb-local image)

---

## Database Web UIs

Each database workload includes an optional web-based management interface that can be deployed as a companion workload.

### mysql-ui (phpMyAdmin)

Web-based administration tool for MySQL.

**Access:** `https://mysql-ui.${LOKO_DOMAIN}`

**Features:**
- Database browsing and management
- SQL query execution
- Import/export functionality
- User and permissions management

**Deployment:**
```bash
loko workloads add mysql-ui --now
```

Auto-connects to the MySQL workload when deployed together.

---

### postgres-ui (pgAdmin)

Feature-rich web interface for PostgreSQL administration.

**Access:** `https://postgres-ui.${LOKO_DOMAIN}`

**Features:**
- Visual query builder
- Database schema management
- Query execution and analysis
- Server connection management

**Deployment:**
```bash
loko workloads add postgres-ui --now
```

Auto-connects to the PostgreSQL workload when deployed together.

---

### mongodb-ui (mongo-express)

Web-based MongoDB admin interface built with Node.js and Express.

**Access:** `https://mongodb-ui.${LOKO_DOMAIN}`

**Features:**
- Collection and document management
- JSON document editing
- Database statistics
- Index management

**Deployment:**
```bash
loko workloads add mongodb-ui --now
```

Auto-connects to the MongoDB workload when deployed together.

---

### dynamodb-admin

Web UI for DynamoDB Local management.

**Access:** `https://dynamodb-admin.${LOKO_DOMAIN}`

**Features:**
- Table browsing and creation
- Item viewing and editing
- Query and scan operations
- JSON/CSV export

**Deployment:**
```bash
loko workloads add dynamodb-admin --now
```

Auto-connects to the DynamoDB Local workload when deployed together.

## Next Steps

- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
