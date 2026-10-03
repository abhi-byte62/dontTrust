-- ==========================================================
-- AegisScan Relational Database Schema & Migration v1.0.0
-- Standard SQL DDL compatible with PostgreSQL & SQLite
-- ==========================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- 2. Targets Table
CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    url TEXT NOT NULL,
    hostname TEXT NOT NULL,
    default_protocol TEXT NOT NULL,
    default_port INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_targets_project ON targets(project_id);
CREATE INDEX IF NOT EXISTS idx_targets_hostname ON targets(hostname);

-- 3. Scope Rules Table
CREATE TABLE IF NOT EXISTS scope_rules (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE,
    allowed_domains_json TEXT NOT NULL,
    excluded_domains_json TEXT,
    allowed_paths_json TEXT,
    excluded_paths_json TEXT,
    allowed_protocols_json TEXT,
    allowed_ports_json TEXT,
    allow_private_addresses INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 4. Auth Profiles Table
CREATE TABLE IF NOT EXISTS auth_profiles (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    auth_type TEXT NOT NULL,
    headers_json TEXT NOT NULL,
    cookies_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_profiles_project ON auth_profiles(project_id);

-- 5. Scans Table
CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_url TEXT NOT NULL,
    profile_name TEXT NOT NULL,
    status TEXT NOT NULL,
    active_testing_enabled INTEGER NOT NULL DEFAULT 0,
    max_requests_per_second INTEGER NOT NULL DEFAULT 10,
    max_concurrency INTEGER NOT NULL DEFAULT 5,
    started_at TEXT,
    completed_at TEXT,
    duration_ms INTEGER,
    stats_json TEXT NOT NULL,
    error_message TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(target_id) REFERENCES targets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_scans_project ON scans(project_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);

-- 6. Discovered Endpoints Table
CREATE TABLE IF NOT EXISTS discovered_endpoints (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    content_type TEXT,
    parameters_json TEXT NOT NULL,
    discovered_at TEXT NOT NULL,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_endpoints_scan ON discovered_endpoints(scan_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_path ON discovered_endpoints(path);

-- 7. Findings Table
CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    scan_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    rule_version TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    confidence TEXT NOT NULL,
    status TEXT NOT NULL,
    target_host TEXT NOT NULL,
    endpoint_path TEXT NOT NULL,
    http_method TEXT NOT NULL,
    parameter_name TEXT,
    auth_context TEXT,
    description TEXT NOT NULL,
    impact TEXT NOT NULL,
    remediation TEXT NOT NULL,
    references_json TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_fingerprint ON findings(fingerprint);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_confidence ON findings(confidence);

-- 8. Finding Evidence Table
CREATE TABLE IF NOT EXISTS finding_evidence (
    id TEXT PRIMARY KEY,
    finding_id TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    highlighted_fragment TEXT,
    reproduction_instructions TEXT,
    captured_at TEXT NOT NULL,
    FOREIGN KEY(finding_id) REFERENCES findings(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_evidence_finding ON finding_evidence(finding_id);

-- 9. Attack Surface Graph Nodes
CREATE TABLE IF NOT EXISTS attack_surface_nodes (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL,
    node_type TEXT NOT NULL,
    label TEXT NOT NULL,
    data_json TEXT NOT NULL,
    discovered_at TEXT NOT NULL,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_scan ON attack_surface_nodes(scan_id);

-- 10. Attack Surface Graph Edges
CREATE TABLE IF NOT EXISTS attack_surface_edges (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    edge_type TEXT NOT NULL,
    label TEXT,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_graph_edges_scan ON attack_surface_edges(scan_id);

-- 11. Scan Baselines & Regressions Table
CREATE TABLE IF NOT EXISTS scan_baselines (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    scan_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scan_diffs (
    id TEXT PRIMARY KEY,
    current_scan_id TEXT NOT NULL,
    baseline_scan_id TEXT NOT NULL,
    new_findings_count INTEGER NOT NULL,
    resolved_findings_count INTEGER NOT NULL,
    changed_findings_count INTEGER NOT NULL,
    diff_data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(current_scan_id) REFERENCES scans(id) ON DELETE CASCADE,
    FOREIGN KEY(baseline_scan_id) REFERENCES scans(id) ON DELETE CASCADE
);
