# DontTrust: Configuration Specification

## Configuration Schema

DontTrust is configured via environment variables and project policy JSON files.

### Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | API Server Port | `4000` |
| `STORAGE_DIR` | Directory for graph and scan JSON records | `./data` |
| `LOG_LEVEL` | Structured log verbosity (`DEBUG`, `INFO`, `WARN`, `ERROR`) | `INFO` |
| `MAX_RPS` | Maximum requests per second per target | `50` |
| `MAX_CONCURRENCY` | Maximum concurrent asynchronous worker tasks | `10` |
| `ALLOW_LOCAL_TARGETS` | Enable local loopback scanning for lab benchmarks | `true` |

### Scope Policy Schema

```json
{
  "projectId": "proj-default",
  "allowedDomains": ["127.0.0.1", "app.target.local"],
  "allowedProtocols": ["http:", "https:", "ws:", "wss:"],
  "excludedPaths": ["/logout", "/delete-account", "/internal/admin"],
  "allowPrivateIps": false
}
```
