import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { 
  Validator, 
  EmotionalProof, 
  ConsensusBlock, 
  NetworkActivity 
} from '../../shared/schema';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection',
        data: { 
          message: 'Connected to EmotionalChain WebSocket',
          platform: 'AI-Enhanced PoE v2.0',
          features: ['Real-time consensus', 'ML emotion tracking', 'Biometric updates']
        },
        timestamp: new Date().toISOString()
      });

      // Handle client messages
      ws.on('message', (message: Buffer) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          this.handleClientMessage(ws, parsedMessage);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Handle connection errors
      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('✅ EmotionalChain WebSocket service initialized on /ws');
  }

  private handleClientMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });
        break;

      case 'subscribe':
        // Handle subscription to specific events
        this.sendToClient(ws, {
          type: 'subscribed',
          data: { events: message.events || ['all'] },
          timestamp: new Date().toISOString()
        });
        break;

      case 'get_status':
        this.sendToClient(ws, {
          type: 'status',
          data: {
            connectedClients: this.clients.size,
            serverTime: new Date().toISOString(),
            version: '2.0.0',
            mlEnabled: true
          },
          timestamp: new Date().toISOString()
        });
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: WebSocketMessage) {
    const messageString = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }

  // Public methods for broadcasting events
  broadcastValidatorUpdate(validator: Validator) {
    this.broadcast({
      type: 'validator_update',
      data: {
        validator,
        action: 'registered',
        mlEnabled: true
      },
      timestamp: new Date().toISOString()
    });
  }

  broadcastEmotionalProof(proof: EmotionalProof) {
    this.broadcast({
      type: 'emotional_proof',
      data: {
        proof,
        mlProcessed: proof.rawBiometricData?.mlProcessed || false,
        emotionCategory: proof.rawBiometricData?.emotionCategory || 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  }

  broadcastConsensusResult(consensus: ConsensusBlock) {
    const mlProcessedCount = consensus.validatorProofs
      ? consensus.validatorProofs.filter((p: any) => p.mlProcessed).length
      : 0;

    this.broadcast({
      type: 'consensus_result',
      data: {
        consensus,
        mlEnhanced: mlProcessedCount > 0,
        mlProcessedValidators: mlProcessedCount,
        totalValidators: consensus.participatingValidators
      },
      timestamp: new Date().toISOString()
    });
  }

  broadcastNetworkActivity(activity: NetworkActivity) {
    this.broadcast({
      type: 'network_activity',
      data: activity,
      timestamp: new Date().toISOString()
    });
  }

  broadcastBiometricUpdate(update: { validatorAddress: string; data: any }) {
    this.broadcast({
      type: 'biometric_update',
      data: {
        validatorAddress: update.validatorAddress,
        biometricData: update.data,
        processed: true
      },
      timestamp: new Date().toISOString()
    });
  }

  // Network statistics broadcast
  broadcastNetworkStats(stats: any) {
    this.broadcast({
      type: 'network_stats',
      data: {
        stats,
        mlEnabled: true,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  // ML-specific broadcasts
  broadcastMLStatus(status: any) {
    this.broadcast({
      type: 'ml_status',
      data: status,
      timestamp: new Date().toISOString()
    });
  }

  broadcastMLPrediction(prediction: any) {
    this.broadcast({
      type: 'ml_prediction',
      data: prediction,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection count
  getConnectionCount(): number {
    return this.clients.size;
  }

  // Broadcast system message
  broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.broadcast({
      type: 'system_message',
      data: {
        message,
        level: type,
        source: 'EmotionalChain AI'
      },
      timestamp: new Date().toISOString()
    });
  }
}

export const websocketService = new WebSocketService();