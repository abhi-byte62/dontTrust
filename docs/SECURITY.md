# DontTrust Security Policy & Authorized Assessment Guidelines

## 1. Authorized Testing Only
DontTrust is exclusively built for authorized security testing, defense assessment, and vulnerability research. Users and operators must only scan targets they own or have explicit written permission to assess.

## 2. Safe Scanner Defaults
- **Passive Analysis**: Enabled by default (no payload modification or injection).
- **Active Analysis**: Disabled by default; requires explicit project authorization flag.
- **SSRF Defense**: Active by default. Blocks all loopback (127.0.0.1, ::1), RFC 1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), and cloud metadata services (169.254.169.254).
- **Credential Protection**: Automatic redaction of JWTs, Bearer tokens, passwords, and private keys in all logs and stored evidence.
- **Destructive Actions Blocked**: Scanner rules must not execute data-destructive SQL (e.g. `DROP`, `DELETE`), system crashes, or denial-of-service payloads.

## 3. Reporting Vulnerabilities in DontTrust
If you discover a security vulnerability within DontTrust itself, please submit a responsible disclosure report to the security team.
