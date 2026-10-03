import express, { Request, Response } from 'express';

const app = express();
const PORT = Number.parseInt(process.env.LAB_PORT || '8080', 10);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. Home Page (Surface Discovery Seed)
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>DontTrust Vulnerable Lab</title></head>
      <body>
        <h1>DontTrust Local Target Application</h1>
        <p>Authorized laboratory environment for scanner rule validation.</p>
        <nav>
          <a href="/api/v1/users">Users API</a> |
          <a href="/search?q=test">Search Query</a> |
          <a href="/cors-endpoint">CORS Endpoint</a> |
          <a href="/safe-endpoint">Secure Endpoint</a>
        </nav>
        <form action="/login" method="POST">
          <input name="username" placeholder="Username" />
          <input type="password" name="password" placeholder="Password" />
          <button type="submit">Log in</button>
        </form>
      </body>
    </html>
  `);
});

// 2. Reflected XSS Endpoint
app.get('/search', (req: Request, res: Response) => {
  const query = req.query.q as string || '';
  res.send(`<html><body><h2>Search Results for: ${query}</h2></body></html>`);
});

// 3. SQL Error / Injection Indicator
app.get('/api/v1/users', (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (id && id.includes("'")) {
    return res.status(500).send('Fatal error: You have an error in your SQL syntax; check MySQL manual near ' + id);
  }
  res.json([
    { id: 1, name: 'Alice Admin', role: 'ADMIN' },
    { id: 2, name: 'Bob User', role: 'USER' }
  ]);
});

// 4. Permissive CORS Origin Reflection with Credentials
app.get('/cors-endpoint', (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.json({ message: 'Sensitive user profile data' });
});

// 5. Insecure Session Cookie Flags
app.post('/login', (_req: Request, res: Response) => {
  res.setHeader('Set-Cookie', 'session=demo_session_token_12345; Path=/');
  res.send('<html><body>Logged in successfully</body></html>');
});

// 6. Exposed .git/HEAD
app.get('/.git/HEAD', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('ref: refs/heads/main\n');
});

// 7. Exposed .env file
app.get('/.env', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('DB_HOST=localhost\nDB_USER=root\nDB_PASSWORD=SuperSecretRootPassword!\nAPI_KEY=AKIAIOSFODNN7EXAMPLE\n');
});

// 8. Insecure Direct Object Reference (IDOR / BOLA)
app.get('/api/v1/orders/:id', (req: Request, res: Response) => {
  const orderId = req.params.id;
  res.json({
    orderId,
    customerId: 'cust_user_a',
    total: 249.99,
    items: ['Item 1', 'Item 2'],
    shippingAddress: '123 Private Road, Confidential City'
  });
});

// 9. SSRF Canary Vector
app.get('/fetch-image', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }
  try {
    const fetchRes = await fetch(targetUrl);
    const body = await fetchRes.text();
    res.setHeader('X-SSRF-Observed', 'true');
    res.send(body.slice(0, 500));
  } catch (err: any) {
    res.status(502).send('Gateway Error fetching target: ' + err.message);
  }
});

// 10. Negative Test Route: Fully Hardened Endpoint
app.get('/safe-endpoint', (_req: Request, res: Response) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.json({ status: 'SECURE', observation: 'No vulnerabilities or missing headers' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Vulnerable Lab] Target listening on http://127.0.0.1:${PORT}`);
  });
}

export { app };
