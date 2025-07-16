import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'connection',
        data: { message: 'Connected to EmotionalChain network' },
        timestamp: Date.now()
      });
    });
  }

  broadcast(message: WebSocketMessage) {
    const messageString = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      } else {
        this.clients.delete(client);
      }
    });
  }

  sendToClient(client: WebSocket, message: WebSocketMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  // Broadcast network status updates
  broadcastNetworkStats(stats: any) {
    this.broadcast({
      type: 'network_stats',
      data: stats,
      timestamp: Date.now()
    });
  }

  // Broadcast new validator registration
  broadcastValidatorUpdate(validator: any) {
    this.broadcast({
      type: 'validator_update',
      data: validator,
      timestamp: Date.now()
    });
  }

  // Broadcast new consensus result
  broadcastConsensusResult(consensus: any) {
    this.broadcast({
      type: 'consensus_result',
      data: consensus,
      timestamp: Date.now()
    });
  }

  // Broadcast new emotional proof
  broadcastEmotionalProof(proof: any) {
    this.broadcast({
      type: 'emotional_proof',
      data: proof,
      timestamp: Date.now()
    });
  }

  // Broadcast network activity
  broadcastNetworkActivity(activity: any) {
    this.broadcast({
      type: 'network_activity',
      data: activity,
      timestamp: Date.now()
    });
  }

  // Broadcast biometric data update
  broadcastBiometricUpdate(data: any) {
    this.broadcast({
      type: 'biometric_update',
      data: data,
      timestamp: Date.now()
    });
  }
}

export const websocketService = new WebSocketService();
