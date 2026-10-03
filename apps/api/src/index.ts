import http from 'node:http';
import { WebSocketServer } from 'ws';
import { createServer } from './server.js';
import { wsBroadcaster } from './ws.js';

const PORT = Number.parseInt(process.env.PORT || '4000', 10);
const app = createServer();
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
wsBroadcaster.init(wss);

server.listen(PORT, () => {
  console.log(`[DontTrust API] Control Plane running on http://localhost:${PORT}`);
  console.log(`[DontTrust WS] Live telemetry listening on ws://localhost:${PORT}/ws`);
});
