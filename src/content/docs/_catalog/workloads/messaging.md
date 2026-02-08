---
title: Message Queue Workloads
---

Message brokers and streaming platforms for asynchronous communication.

## Available Workloads

### RabbitMQ

Popular message broker with management UI.

**RabbitMQ Features:**

- AMQP protocol support
- Multiple messaging patterns (pub/sub, routing, topics, RPC)
- Message persistence and delivery guarantees
- Plugin ecosystem
- Built-in management UI

**RabbitMQ Use Cases:**

- Microservices communication
- Task queues
- Event-driven architectures
- Load balancing

**RabbitMQ Deployment:**

```bash
loko workloads add rabbitmq --deploy
loko workloads connect rabbitmq
```

**RabbitMQ Endpoints:**

- **AMQP**: Port 5672
- **Management UI**: `https://rabbitmq.${LOKO_DOMAIN}`

**RabbitMQ Connection String:**

```
amqp://${USER}:${PASSWORD}@rabbitmq.${LOKO_DOMAIN}:5672/
```

**RabbitMQ Code Example:**

```python
# Python with pika
import pika

credentials = pika.PlainCredentials('admin', '<your-password>')
connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='rabbitmq.${LOKO_DOMAIN}',
        port=5672,
        credentials=credentials
    )
)

channel = connection.channel()
channel.queue_declare(queue='hello')
channel.basic_publish(exchange='', routing_key='hello', body='Hello World!')
print(" [x] Sent 'Hello World!'")
connection.close()
```

**RabbitMQ Chart:** groundhog2k/rabbitmq

---

### NATS

High-performance cloud-native messaging system with web dashboard.

**NATS Features:**

- Lightweight and fast
- At-most-once and at-least-once delivery
- JetStream for persistence
- Request-reply pattern
- Subject-based addressing

**NATS Use Cases:**

- Cloud-native applications
- IoT messaging
- Real-time data streaming
- Service mesh communication

**NATS Deployment:**

```bash
loko workloads add nats --deploy
loko workloads connect nats
```

**NATS Endpoints:**

- **NATS Server**: Port 4222
- **Web Dashboard**: `https://nats-ui.${LOKO_DOMAIN}`

**NATS Connection String:**

```
nats://${USER}:${PASSWORD}@nats.${LOKO_DOMAIN}:4222
```

**NATS Code Example:**

```python
# Python with nats-py
import asyncio
from nats.aio.client import Client as NATS

async def main():
    nc = NATS()
    await nc.connect(
        servers=['nats://${USER}:${PASSWORD}@nats.${LOKO_DOMAIN}:4222']
    )

    # Publish a message
    await nc.publish('hello', b'Hello NATS!')

    # Subscribe and receive messages
    async def message_handler(msg):
        print(f"Received: {msg.data.decode()}")

    await nc.subscribe('hello', cb=message_handler)
    await asyncio.sleep(1)
    await nc.close()

asyncio.run(main())
```

**NATS Chart:** nats/nats

---

### Redpanda

Kafka-compatible streaming platform.

**Redpanda Features:**

- Kafka API compatible
- No ZooKeeper dependency
- Lower latency than Kafka
- Built-in schema registry
- Tiered storage support

**Redpanda Use Cases:**

- Event streaming
- Log aggregation
- Change data capture (CDC)
- Real-time analytics

**Redpanda Deployment:**

```bash
loko workloads add redpanda --deploy
loko workloads connect redpanda
```

**Redpanda Endpoints:**

- **Kafka API**: Port 9092
- **Admin API**: Port 9644

**Redpanda Connection String:**

```
redpanda.${LOKO_DOMAIN}:9092
```

**Redpanda Code Example:**

```python
# Python with kafka-python (Kafka-compatible)
from kafka import KafkaProducer, KafkaConsumer

# Producer
producer = KafkaProducer(
    bootstrap_servers=['redpanda.${LOKO_DOMAIN}:9092']
)
producer.send('my-topic', b'Hello Redpanda!')
producer.flush()

# Consumer
consumer = KafkaConsumer(
    'my-topic',
    bootstrap_servers=['redpanda.${LOKO_DOMAIN}:9092'],
    auto_offset_reset='earliest'
)

for message in consumer:
    print(f"Received: {message.value.decode()}")
    break
```

**Redpanda Chart:** redpanda/redpanda

---

### ElasticMQ

In-memory message queue with Amazon SQS-compatible interface and built-in web UI.

**ElasticMQ Features:**

- AWS SQS API compatible
- In-memory and persistent modes
- REST interface
- Built-in web UI for monitoring
- No AWS account required

**ElasticMQ Use Cases:**

- Local development for SQS applications
- Integration testing
- Lightweight message queuing
- Learning SQS without AWS costs

**ElasticMQ Deployment:**

```bash
loko workloads add elasticmq --deploy
loko workloads connect elasticmq
```

**ElasticMQ Endpoints:**

- **SQS API**: Port 9324
- **Web UI**: `https://elasticmq.${LOKO_DOMAIN}`

**ElasticMQ Connection String:**

```
http://elasticmq.${LOKO_DOMAIN}:9324
```

**ElasticMQ Code Example:**

```python
# Python with boto3
import boto3

# Configure SQS client for ElasticMQ endpoint
sqs = boto3.client(
    'sqs',
    endpoint_url='http://elasticmq.${LOKO_DOMAIN}:9324',
    region_name='us-east-1',
    aws_access_key_id='local',
    aws_secret_access_key='local'
)

# Create queue
response = sqs.create_queue(QueueName='my-queue')
queue_url = response['QueueUrl']

# Send message
sqs.send_message(
    QueueUrl=queue_url,
    MessageBody='Hello ElasticMQ!'
)

# Receive message
messages = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=1
)
print(messages['Messages'][0]['Body'])
```

**ElasticMQ AWS CLI Example:**

```bash
aws sqs list-queues \
  --endpoint-url http://elasticmq.${LOKO_DOMAIN}:9324 \
  --region us-east-1
```

**ElasticMQ Chart:** bjw-s/app-template (softwaremill/elasticmq-native image)

---

## Message Queue Web UIs

Optional web-based management interfaces for message queue workloads.

### nats-ui (nats-dashboard)

Web-based monitoring dashboard for NATS.

**Access:** `https://nats-ui.${LOKO_DOMAIN}`

**Features:**
- Real-time server statistics
- Connection monitoring
- JetStream metrics
- Subject subscriptions tracking

**Deployment:**
```bash
loko workloads add nats-ui --deploy
```

Auto-connects to the NATS workload when deployed together.

**Note:** RabbitMQ includes a built-in management UI (accessible at `https://rabbitmq.${LOKO_DOMAIN}`), Redpanda includes Console UI (at `https://redpanda-ui.${LOKO_DOMAIN}`), and ElasticMQ includes a built-in web UI (at `https://elasticmq.${LOKO_DOMAIN}`).

## Next Steps

- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
