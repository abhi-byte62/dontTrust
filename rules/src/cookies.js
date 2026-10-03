import { SecurityRule } from '@donttrust/scanner-sdk';
export class InsecureCookieFlagsRule extends SecurityRule {
    metadata = {
        id: 'insecure-cookie-flags',
        name: 'Session Cookie Missing Security Flags (HttpOnly/Secure/SameSite)',
        category: 'AUTHENTICATION',
        defaultSeverity: 'MEDIUM',
        defaultConfidence: 'CONFIRMED',
        description: 'A session or authentication cookie is transmitted without critical security attributes such as HttpOnly, Secure, or SameSite=Lax/Strict.',
        remediation: 'Always set HttpOnly to mitigate XSS session hijacking, Secure to prevent plaintext transmission, and SameSite=Lax/Strict to prevent CSRF.',
        references: ['https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html'],
        mode: 'PASSIVE',
        version: '1.0.0'
    };
    applicability(context) {
        return Boolean(context.response.headers['set-cookie']);
    }
    async detect(context) {
        const findings = [];
        const setCookie = context.response.headers['set-cookie'];
        const cookies = Array.isArray(setCookie) ? setCookie : [setCookie || ''];
        for (const cookieStr of cookies) {
            if (!cookieStr)
                continue;
            const lower = cookieStr.toLowerCase();
            const isSessionCookie = /(session|sid|token|jwt|auth|connect\.sid|phpsessid|jsessionid)/i.test(cookieStr);
            if (isSessionCookie) {
                const issues = [];
                if (!lower.includes('httponly'))
                    issues.push('Missing HttpOnly');
                if (!lower.includes('secure') && context.request.url.startsWith('https://'))
                    issues.push('Missing Secure');
                if (!lower.includes('samesite'))
                    issues.push('Missing SameSite');
                if (issues.length > 0) {
                    const cookieName = cookieStr.split('=')[0].trim();
                    findings.push(this.createFindingBuilder(context)
                        .setClassification(`Insecure Session Cookie: ${cookieName} (${issues.join(', ')})`, 'AUTHENTICATION', 'MEDIUM', 'CONFIRMED')
                        .setNarrative(`The session cookie "${cookieName}" was issued without recommended flags: ${issues.join(', ')}.`, 'Without HttpOnly, JavaScript can read session tokens during XSS. Without SameSite, requests are vulnerable to CSRF.', this.metadata.remediation, this.metadata.references)
                        .addEvidence({
                        type: 'HTTP_EXCHANGE',
                        payload: {
                            request: {
                                method: context.request.method,
                                url: context.request.url,
                                headers: context.request.headers
                            },
                            response: {
                                statusCode: context.response.statusCode,
                                headers: { 'Set-Cookie': cookieStr }
                            }
                        },
                        highlightedFragment: cookieStr
                    })
                        .build());
                }
            }
        }
        return findings;
    }
}
//# sourceMappingURL=cookies.js.map