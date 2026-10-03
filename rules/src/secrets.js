import { SecurityRule } from '@aegisscan/scanner-sdk';
import { SecretRedactor } from '@aegisscan/common';
export class ExposedSecretsRule extends SecurityRule {
    metadata = {
        id: 'exposed-secrets-in-response',
        name: 'Hardcoded Secret / Credential Leaked in HTTP Response',
        category: 'INFORMATION_DISCLOSURE',
        defaultSeverity: 'HIGH',
        defaultConfidence: 'HIGH',
        description: 'The server response or script payload exposes sensitive credentials, API keys, private keys, or internal access tokens.',
        remediation: 'Remove hardcoded secrets from client-side bundles and public responses. Store credentials in backend environment vaults.',
        references: ['https://cwe.mitre.org/data/definitions/798.html'],
        mode: 'PASSIVE',
        version: '1.0.0'
    };
    static SECRET_PATTERNS = [
        { name: 'AWS Access Key ID', regex: /\b(AKIA[0-9A-Z]{16})\b/, severity: 'HIGH' },
        { name: 'PEM Private Key Block', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, severity: 'CRITICAL' },
        { name: 'Database Connection URI with Password', regex: /postgres:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+@/i, severity: 'CRITICAL' },
        { name: 'Firebase API Key', regex: /AIza[0-9A-Za-z-_]{35}/, severity: 'HIGH' }
    ];
    applicability(context) {
        return Boolean(context.response.bodySnippet);
    }
    async detect(context) {
        const findings = [];
        const rawBody = context.response.bodySnippet || '';
        for (const pattern of ExposedSecretsRule.SECRET_PATTERNS) {
            if (pattern.regex.test(rawBody)) {
                const match = rawBody.match(pattern.regex);
                const secretText = match ? match[0] : '';
                const safeSnippet = SecretRedactor.redact(rawBody.slice(0, 300));
                findings.push(this.createFindingBuilder(context)
                    .setClassification(`Exposed Credential: ${pattern.name}`, 'INFORMATION_DISCLOSURE', pattern.severity, 'HIGH')
                    .setNarrative(`An exposed ${pattern.name} was identified in the response from ${context.request.url}.`, 'Potential credential compromise allowing lateral movement or unauthorized infrastructure access.', this.metadata.remediation, this.metadata.references)
                    .addEvidence({
                    type: 'HTTP_EXCHANGE',
                    payload: {
                        request: { method: context.request.method, url: context.request.url, headers: context.request.headers },
                        response: { statusCode: context.response.statusCode, headers: context.response.headers, bodySnippet: safeSnippet }
                    },
                    highlightedFragment: SecretRedactor.redact(secretText)
                })
                    .build());
            }
        }
        return findings;
    }
}
//# sourceMappingURL=secrets.js.map