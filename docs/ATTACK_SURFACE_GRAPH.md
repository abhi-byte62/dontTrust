# Attack-Surface Graph 2.0

## Graph Abstraction

The Attack-Surface Graph represents target topology, software components, API routes, user roles, security findings, and state transitions.

Implemented in:
- Storage & Graph Abstractions: [`AttackSurfaceGraph`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/storage/src/graph.ts)
- Correlation & Chain Synthesis: [`CorrelationEngine`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/correlation-engine/src/correlation.ts)

## Node Types

- `DOMAIN`: Root domain of the target application.
- `SUBDOMAIN`: Discovered target subdomains.
- `PAGE`: Discovered HTML web pages.
- `ROUTE`: Client-side SPA routes.
- `ENDPOINT`: HTTP/WebSocket API endpoints.
- `PARAMETER`: Query, header, body, or path parameters.
- `COOKIE`: Application session and security cookies.
- `JAVASCRIPT`: Referenced or inline JavaScript assets.
- `WEBSOCKET`: Active WebSocket channels.
- `IDENTITY`: Configured user roles and identity contexts.
- `ROLE`: Permissions associated with an identity.
- `RESOURCE`: Data objects managed by endpoints.
- `TECHNOLOGY`: Fingerprinted libraries, frameworks, servers.
- `FINDING`: Verified security vulnerabilities.
- `STATE`: Application state (e.g. `ANONYMOUS`, `AUTHENTICATED`).

## Edge Relationships

- `DISCOVERED_FROM`: Origin tracing and provenance.
- `CALLS`: Page/script invoking an API endpoint.
- `REDIRECTS_TO`: HTTP or client-side navigation redirect.
- `USES`: Endpoint relying on specific technologies.
- `AUTHENTICATES_TO`: State transition to an authenticated context.
- `READS` / `WRITES`: Data operations on resources.
- `DEPENDS_ON`: Dependency relationships across services.
- `TRANSITIONS_TO`: State transitions triggered by user actions.
- `AFFECTS`: Finding mapped to vulnerable endpoint/parameter.
- `CORRELATES_WITH`: Correlated multi-step vulnerability chains.
