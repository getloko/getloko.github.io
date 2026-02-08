---
title: Development & Testing Tools
---

Tools for testing and development workflows.

## Available Workloads

### Mock SMTP/SMS

Email and SMS testing service with web UI.

**Mock SMTP/SMS Features:**

- SMTP server that captures all emails (never sends)
- SMS API for testing SMS workflows
- Real-time web UI with WebSocket updates
- No external dependencies

**Mock SMTP/SMS Use Cases:**

- Test email functionality without sending real emails
- Debug SMS integrations locally
- Verify notification templates

**Mock SMTP/SMS Deployment:**

```bash
# Add and deploy
loko workloads add mock-smtp-sms --deploy

# Get connection details
loko workloads connect mock-smtp-sms
```

**Mock SMTP/SMS Endpoints:**

- **Web UI**: `https://mock-smtp-sms.${LOKO_DOMAIN}`
- **SMTP Server**: Port 8025
- **SMS API**: `https://mock-smtp-sms.${LOKO_DOMAIN}/sendsms`

**Mock SMTP/SMS SMTP Configuration:**

```yaml
smtp:
  host: mock-smtp-sms.loko-workloads.svc.cluster.local
  port: 8025
  # No authentication required
```

**Mock SMTP/SMS SMS Testing:**

```bash
# Send test SMS
curl "https://mock-smtp-sms.${LOKO_DOMAIN}/sendsms?mobiles=+15551234567&sender=MyApp&message=Hello"
```

**Mock SMTP/SMS Chart:**

- Repository: bjw-s (app-template)
- Image: mosipdev/mock-smtp

## Next Steps

- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
