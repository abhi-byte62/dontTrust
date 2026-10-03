import { SecurityRule } from '@aegisscan/scanner-sdk';
export class ReflectedXssDetectionRule extends SecurityRule {
    metadata = {
        id: 'reflected-xss-indicator',
        name: 'Reflected Cross-Site Scripting (XSS) Candidate',
        category: 'XSS',
        defaultSeverity: 'HIGH',
        defaultConfidence: 'HIGH',
        description: 'User-supplied query parameters are reflected verbatim in HTML response body without contextual HTML entity encoding or sanitization.',
        remediation: 'Implement contextual output encoding (e.g. HTML body encoding, attribute encoding, JS string escaping) and configure a strict Content-Security-Policy.',
        references: ['https://owasp.org/www-community/attacks/xss/'],
        mode: 'ACTIVE',
        version: '1.2.0'
    };
    applicability(context) {
        const contentType = (context.response.headers['content-type'] || '').toLowerCase();
        const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml+xml');
        const hasParams = context.request.url.includes('?');
        return isHtml && hasParams;
    }
    async detect(context) {
        const findings = [];
        const url = new URL(context.request.url);
        const body = context.response.bodySnippet || '';
        for (const [paramName, paramVal] of url.searchParams.entries()) {
            if (paramVal && paramVal.length >= 3 && body.includes(paramVal)) {
                // Parameter reflected in response body
                findings.push(this.createFindingBuilder(context)
                    .setClassification(`Reflected Parameter Input (${paramName})`, 'XSS', 'MEDIUM', 'MEDIUM')
                    .setNarrative(`The parameter "${paramName}" value was reflected in the HTML response body without encoding.`, 'May allow execution of malicious scripts if HTML metacharacters are unescaped.', this.metadata.remediation, this.metadata.references)
                    .addEvidence({
                    type: 'HTTP_EXCHANGE',
                    payload: {
                        request: { method: context.request.method, url: context.request.url, headers: context.request.headers },
                        response: { statusCode: context.response.statusCode, headers: context.response.headers }
                    },
                    highlightedFragment: `Reflected param: ${paramName}=${paramVal}`
                })
                    .build());
            }
        }
        return findings;
    }
    async verify(context) {
        const canaryMarker = `aegiscanary${Math.floor(Math.random() * 100000)}`;
        const testProbe = `<${canaryMarker}>`;
        try {
            const url = new URL(context.finding.endpointPath.startsWith('http')
                ? context.finding.endpointPath
                : `http://${context.finding.targetHost}${context.finding.endpointPath}`);
            if (context.finding.parameterName) {
                url.searchParams.set(context.finding.parameterName, testProbe);
                const res = await context.httpRequester({
                    url: url.toString(),
                    method: 'GET'
                });
                if (res.bodySnippet && res.bodySnippet.includes(testProbe)) {
                    return {
                        verified: true,
                        confidence: 'CONFIRMED',
                        evidenceFragment: `Reflected unescaped HTML tag: ${testProbe}`,
                        reproductionProof: `curl "${url.toString()}"`,
                        reason: 'Target reflected unescaped custom HTML canary tag directly in HTML response.'
                    };
                }
            }
        }
        catch (err) {
            return { verified: false, confidence: 'LOW', reason: err.message };
        }
        return { verified: false, confidence: context.finding.confidence, reason: 'Probe was sanitized or stripped' };
    }
}
//# sourceMappingURL=xss.js.map