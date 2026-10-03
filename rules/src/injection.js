import { SecurityRule } from '@donttrust/scanner-sdk';
export class SqlInjectionDetectionRule extends SecurityRule {
    metadata = {
        id: 'sql-injection-indicator',
        name: 'SQL Injection Vulnerability / Database Error Disclosure',
        category: 'INJECTION',
        defaultSeverity: 'CRITICAL',
        defaultConfidence: 'HIGH',
        description: 'The endpoint returns diagnostic database error messages (PostgreSQL, MySQL, SQLite, Oracle, MSSQL) or demonstrates syntax error behavioral differentials when processing single quotes or SQL metacharacters.',
        remediation: 'Use parameterized queries (Prepared Statements) or an ORM. Never concatenate unescaped input into SQL query strings.',
        references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
        mode: 'ACTIVE',
        version: '1.2.0'
    };
    static SQL_ERRORS = [
        /SQL syntax.*MySQL/i,
        /Warning.*mysql_.*\(.*\)/i,
        /valid MySQL result/i,
        /PostgreSQL.*ERROR/i,
        /Warning.*\bpg_.*\(.*\)/i,
        /valid PostgreSQL result/i,
        /Driver.*SQL[-_ ]*Server/i,
        /OLE DB.*SQL Server/i,
        /SQLite\/JDBCDriver/i,
        /SQLite.Exception/i,
        /System\.Data\.SQLite\.SQLiteException/i,
        /unrecognized token: "/i,
        /near ".*": syntax error/i,
        /ORA-[0-9]{4,5}/i
    ];
    applicability(context) {
        const body = context.response.bodySnippet || '';
        return SqlInjectionDetectionRule.SQL_ERRORS.some(r => r.test(body));
    }
    async detect(context) {
        const findings = [];
        const body = context.response.bodySnippet || '';
        for (const errorRegex of SqlInjectionDetectionRule.SQL_ERRORS) {
            const match = body.match(errorRegex);
            if (match) {
                const finding = this.createFindingBuilder(context)
                    .setClassification('SQL Injection Indicator: Database Error Disclosure', 'INJECTION', 'HIGH', 'HIGH')
                    .setNarrative(`The application leaked an internal database syntax error: "${match[0]}".`, 'Enables attackers to map query structures and extract arbitrary database tables.', this.metadata.remediation, this.metadata.references)
                    .addEvidence({
                    type: 'HTTP_EXCHANGE',
                    payload: {
                        request: { method: context.request.method, url: context.request.url, headers: context.request.headers },
                        response: { statusCode: context.response.statusCode, headers: context.response.headers, bodySnippet: body }
                    },
                    highlightedFragment: match[0]
                })
                    .build();
                findings.push(finding);
                break;
            }
        }
        return findings;
    }
    async verify(context) {
        // Non-destructive benign single quote test
        try {
            const url = new URL(context.finding.endpointPath.startsWith('http')
                ? context.finding.endpointPath
                : `http://${context.finding.targetHost}${context.finding.endpointPath}`);
            if (context.finding.parameterName) {
                url.searchParams.set(context.finding.parameterName, "1'");
                const res = await context.httpRequester({
                    url: url.toString(),
                    method: 'GET'
                });
                const isStillError = SqlInjectionDetectionRule.SQL_ERRORS.some(r => r.test(res.bodySnippet || ''));
                if (isStillError) {
                    return {
                        verified: true,
                        confidence: 'CONFIRMED',
                        evidenceFragment: 'Triggered database error on single quote probe: ' + res.bodySnippet?.slice(0, 100),
                        reason: 'Database syntax error consistently triggered on benign quote probe.'
                    };
                }
            }
        }
        catch (err) {
            return { verified: false, confidence: 'LOW', reason: err.message };
        }
        return { verified: false, confidence: context.finding.confidence, reason: 'Could not reproduce' };
    }
}
//# sourceMappingURL=injection.js.map