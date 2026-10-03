# Getting Started with DontTrust

## Quickstart

### 1. Installation

Clone the repository and install all dependencies:

```bash
git clone <repo-url>
cd donttrust
npm install
npm run build
```

### 2. Start the Local Benchmark Lab

Start the intentionally vulnerable target lab:

```bash
npm run start -w @donttrust/vulnerable-lab
# Runs on http://127.0.0.1:8080
```

### 3. Launch the API and Web Dashboard

In a new terminal:

```bash
npm run dev -w @donttrust/api
npm run dev -w @donttrust/web
```

Open your browser at `http://localhost:5173` to explore the attack surface graph and scan controls.

### 4. Run Scans via CLI

Execute a scan from the command line:

```bash
npm run cli -- scan http://127.0.0.1:8080 --active
```

Verify scope configuration:

```bash
npm run cli -- scope:check http://127.0.0.1:8080/api/v1/search
```

Redact sensitive log payloads:

```bash
npm run cli -- redact "Authorization: Bearer my-secret-token"
```
