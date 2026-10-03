# DontTrust: Architectural Design Decisions & Trade-Offs

## 1. Security Hypothesis Abstraction vs Immediate Finding Generation
- **Problem**: Generating immediate findings from AST matches or superficial status codes creates rampant false positives.
- **Decision**: Introduce a `SecurityHypothesis` lifecycle (`CANDIDATE` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `VERIFIED` $\rightarrow$ `PROMOTED_TO_FINDING`).
- **Trade-Off**: Introduces an extra verification stage, slightly increasing scan latency by milliseconds.
- **Rationale**: Research-grade accuracy requires empirical proof before an alert is raised to an engineer.

---

## 2. Decoupled Severity vs Confidence
- **Problem**: Many scanners conflate high impact with high certainty, flagging speculative findings as Critical.
- **Decision**: Keep Severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`) and Confidence (`CONFIRMED`, `HIGH`, `MEDIUM`, `LOW`, `TENTATIVE`) strictly decoupled.
- **Trade-Off**: UI and schemas must represent two distinct dimensions.
- **Rationale**: An SQL injection with tentative heuristic evidence is High Severity / Tentative Confidence; a missing security header is Low Severity / Confirmed Confidence.

---

## 3. Deterministic SHA-256 Identifiers
- **Problem**: Repeated scans against the same target often generate drifting UUIDs, preventing regression diffing.
- **Decision**: Compute canonical fingerprints using `sha256(ruleId:host:path:param)`.
- **Trade-Off**: Parameter and path normalization must be strictly canonicalized.
- **Rationale**: Enables deterministic scan diffs, regression tracking, and golden scan comparisons.

---

## 4. In-Memory Graph & File Storage over Heavy External DBs
- **Problem**: Setting up external databases adds friction to local development, automated testing, and CI pipelines.
- **Decision**: Implement a clean file-backed and memory-mapped storage adapter adhering to repository interfaces.
- **Trade-Off**: Multi-gigabyte enterprise asset graphs require database backends.
- **Rationale**: Zero external runtime dependencies ensures instant setup and 100% test reproducibility.
