---
title: Development & Testing Tools
---

Tools for testing and development workflows.

## Available Workloads

### httpbin

HTTP request & response testing service — inspect headers, auth, status codes, delays, and more.

**httpbin Features:**

- Full HTTP method support (GET, POST, PUT, DELETE, PATCH, etc.)
- Inspect request headers, body, query params
- Simulate delays, status codes, redirects
- Test auth flows (Basic, Bearer, Digest)
- JSON, XML, HTML, and binary responses

**httpbin Use Cases:**

- Debug HTTP clients and SDKs
- Test webhook integrations
- Verify API request formatting

**httpbin Deployment:**

```bash
loko workloads add httpbin --now
loko workloads connect httpbin
```

**httpbin Endpoints:**

- **Web UI**: `https://httpbin.${LOKO_DOMAIN}`

**httpbin Chart:**

- Repository: bjw-s (app-template)
- Image: mccutchen/go-httpbin

---

### IT Tools

Collection of handy online tools for developers — converters, encoders, formatters, and more.

**IT Tools Features:**

- Base64, URL, and JWT encode/decode
- Hash generators (MD5, SHA, bcrypt)
- JSON/YAML/TOML formatters and converters
- UUID, password, and token generators
- Date/time utilities, color pickers, regex testers
- Works entirely offline (no data leaves your cluster)

**IT Tools Use Cases:**

- Quick data encoding/decoding without external sites
- Convert between data formats locally
- Generate test credentials and tokens

**IT Tools Deployment:**

```bash
loko workloads add it-tools --now
loko workloads connect it-tools
```

**IT Tools Endpoints:**

- **Web UI**: `https://it-tools.${LOKO_DOMAIN}`

**IT Tools Chart:**

- Repository: bjw-s (app-template)
- Image: corentinth/it-tools

---

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
loko workloads add mock-smtp-sms --now

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
