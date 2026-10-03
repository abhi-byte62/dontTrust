# Application Model Specification

## Overview

The **Application Intelligence Model** (`@donttrust/application-model`) provides a canonical, serializable, deterministic representation of a target web application's structure, semantics, and observed states.

Implemented in:
- Model Manager: [`ApplicationModel`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/application-model/src/application-model.ts)
- Type Definitions: [`packages/application-model/src/types.ts`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/application-model/src/types.ts)

## Architecture

The model is organized into core attack-surface entities:

```text
ApplicationModelSnapshot
 ├── target: TargetModel
 ├── technologies: TechnologyFingerprint[]
 ├── domains: DomainModel[]
 ├── subdomains: SubdomainModel[]
 ├── pages: PageModel[]
 ├── routes: RouteModel[]
 ├── endpoints: EndpointModel[]
 ├── parameters: ParameterModel[]
 ├── forms: FormModel[]
 ├── jsAssets: JavaScriptAssetModel[]
 ├── webSockets: WebSocketModel[]
 ├── cookies: CookieModel[]
 ├── headers: HeaderModel[]
 ├── authContexts: IdentityContextModel[]
 ├── roles: RoleModel[]
 ├── resources: ResourceModel[]
 ├── stateTransitions: StateTransitionModel[]
 ├── hypotheses: SecurityHypothesis[]
 └── relationships: ModelRelationship[]
```

## Key Properties

1. **Deterministic Identifiers**:
   - Endpoints: `sha256(method:normalizedPath)`
   - Parameters: `sha256(endpointId:name:location)`
   - Forms: `sha256(actionUrl:method:fieldNames)`
   - Technologies: `sha256(name:category:version)`
   - Hypotheses: `sha256(type:endpointId:title)`

2. **Provenance & Evidence**:
   - Every entity maintains a `provenance` record tracking:
     - `discoveredFrom`: Source URL, file, or transaction
     - `discoveryType`: `STATIC_CRAWL`, `BROWSER_DOM`, `JS_AST`, `OPENAPI_SPEC`, `GRAPHQL_INTROSPECTION`, `HTTP_TRAFFIC`
     - `discoveredAt`: Timestamp of discovery
     - `confidence`: Calibrated confidence level (0.0 - 1.0)
     - `evidenceSummary`: Descriptive rationale for entity existence

3. **Incremental Serialization**:
   - `toJSON()` and `exportSnapshot()` serialize the entire intelligence state.
   - `loadSnapshot()` loads previously saved state.
   - Differential updates preserve entity identity across scan phases.
