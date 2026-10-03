import { WebSocketServer, WebSocket } from 'ws';
import { ScanRecord } from './store.js';

export class WsBroadcaster {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public init(wss: WebSocketServer): void {
    this.wss = wss;
    this.wss.on('connection', ws => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
      ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() }));
    });
  }

  public broadcastScanUpdate(scan: ScanRecord): void {
    const payload = JSON.stringify({
      type: 'SCAN_UPDATE',
      scanId: scan.id,
      status: scan.status,
      stats: scan.stats,
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}

export const wsBroadcaster = new WsBroadcaster();
