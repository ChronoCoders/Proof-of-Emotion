// EmotionalChain Network Layer - P2P Communication & Consensus Distribution
// File: emotional-chain/SRC/network/EmotionalNetwork.ts

import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import { EmotionalChain, PoEBlock, EmotionalValidator, BiometricData, Transaction } from '../blockchain/EmotionalChain.js';

// Network Message Types
interface NetworkMessage {
  type: MessageType;
  data: any;
  from: string;
  timestamp: number;
  signature?: string;
}

enum MessageType {
  BLOCK_PROPOSAL = 'block_proposal',
  EMOTIONAL_PROPOSAL = 'emotional_proposal',
  TRANSACTION_BROADCAST = 'transaction_broadcast',
  VALIDATOR_REGISTRATION = 'validator_registration',
  CONSENSUS_VOTE = 'consensus_vote',
  BIOMETRIC_VALIDATION = 'biometric_validation',
  NETWORK_DISCOVERY = 'network_discovery',
  HEARTBEAT = 'heartbeat',
  CHAIN_SYNC = 'chain_sync'
}

// Peer Node Information
interface PeerNode {
  id: string;
  address: string;
  port: number;
  publicKey: string;
  isValidator: boolean;
  emotionalReliability: number;
  lastSeen: number;
  connection?: WebSocket;
}

// Network Statistics
interface NetworkStats {
  connectedPeers: number;
  activeValidators: number;
  networkLatency: number;
  consensusParticipation: number;
  emotionalSyncRate: number;
}

// EmotionalChain Network Class
class EmotionalNetwork extends EventEmitter {
  private peers: Map<string, PeerNode> = new Map();
  private blockchain: EmotionalChain;
  private nodeId: string;
  private port: number;
  private server?: WebSocketServer;
  private isValidator: boolean;
  private validator?: EmotionalValidator;
  private networkStats: NetworkStats;

  constructor(blockchain: EmotionalChain, nodeId: string, port: number) {
    super();
    this.blockchain = blockchain;
    this.nodeId = nodeId;
    this.port = port;
    this.isValidator = false;
    this.networkStats = {
      connectedPeers: 0,
      activeValidators: 0,
      networkLatency: 0,
      consensusParticipation: 0,
      emotionalSyncRate: 0
    };
    this.initializeNetwork();
  }

  // Initialize network server and event handlers
  private initializeNetwork(): void {
    this.server = new WebSocketServer({ port: this.port });
    console.log(`[NETWORK] EmotionalChain node ${this.nodeId} listening on port ${this.port}`);

    this.server.on('connection', (ws: WebSocket, req) => {
      this.handleNewConnection(ws, req);
    });

    // Set up blockchain event handlers
    this.blockchain.on('blockMined', (block: PoEBlock) => {
      this.broadcastBlockProposal(block);
    });

    this.blockchain.on('transactionAdded', (transaction: Transaction) => {
      this.broadcastTransaction(transaction);
    });

    // Start periodic network maintenance
    this.startNetworkMaintenance();
  }

  // Handle new peer connection
  private handleNewConnection(ws: WebSocket, req: any): void {
    const peerId = this.generatePeerId();
    console.log(`[CONNECT] New peer connection: ${peerId}`);

    ws.on('message', (data: string) => {
      try {
        const message: NetworkMessage = JSON.parse(data);
        this.handleNetworkMessage(message, peerId, ws);
      } catch (error) {
        console.error('[ERROR] Failed to parse network message:', error);
      }
    });

    ws.on('close', () => {
      this.handlePeerDisconnection(peerId);
    });

    ws.on('error', (error) => {
      console.error(`[ERROR] WebSocket error with peer ${peerId}:`, error);
    });

    // Send discovery message
    this.sendMessage(ws, {
      type: MessageType.NETWORK_DISCOVERY,
      data: {
        nodeId: this.nodeId,
        isValidator: this.isValidator,
        chainLength: this.blockchain.getChain().length
      },
      from: this.nodeId,
      timestamp: Date.now()
    });
  }

  // Handle network messages from peers
  private async handleNetworkMessage(
    message: NetworkMessage, 
    peerId: string, 
    ws: WebSocket
  ): Promise<void> {
    switch (message.type) {
      case MessageType.NETWORK_DISCOVERY:
        await this.handleNetworkDiscovery(message, peerId, ws);
        break;

      case MessageType.BLOCK_PROPOSAL:
        await this.handleBlockProposal(message);
        break;

      case MessageType.EMOTIONAL_PROPOSAL:
        await this.handleEmotionalProposal(message);
        break;

      case MessageType.TRANSACTION_BROADCAST:
        await this.handleTransactionBroadcast(message);
        break;

      case MessageType.VALIDATOR_REGISTRATION:
        await this.handleValidatorRegistration(message);
        break;

      case MessageType.CONSENSUS_VOTE:
        await this.handleConsensusVote(message);
        break;

      case MessageType.BIOMETRIC_VALIDATION:
        await this.handleBiometricValidation(message);
        break;

      case MessageType.CHAIN_SYNC:
        await this.handleChainSync(message, ws);
        break;

      case MessageType.HEARTBEAT:
        this.handleHeartbeat(message, peerId);
        break;

      default:
        console.log(`[WARNING] Unknown message type: ${message.type}`);
    }
  }

  // Handle network discovery
  private async handleNetworkDiscovery(
    message: NetworkMessage, 
    peerId: string, 
    ws: WebSocket
  ): Promise<void> {
    const peerData = message.data;
    
    const peer: PeerNode = {
      id: peerId,
      address: 'unknown', // Would be extracted from connection
      port: 0,
      publicKey: peerData.publicKey || '',
      isValidator: peerData.isValidator,
      emotionalReliability: 1.0, // Initial trust score
      lastSeen: Date.now(),
      connection: ws
    };

    this.peers.set(peerId, peer);
    this.updateNetworkStats();

    console.log(`[SUCCESS] Peer registered: ${peerId} (Validator: ${peer.isValidator})`);

    // Check if we need to sync chain
    if (peerData.chainLength > this.blockchain.getChain().length) {
      this.requestChainSync(ws);
    }
  }

  // Handle block proposal from network
  private async handleBlockProposal(message: NetworkMessage): Promise<void> {
    const block: PoEBlock = message.data;
    
    // Validate block before accepting
    if (await this.validateProposedBlock(block)) {
      console.log(`[BLOCK] Valid block proposal received: ${block.index}`);
      
      // Add to blockchain if valid
      // Note: In real implementation, this would be more complex
      this.emit('blockProposal', block);
    } else {
      console.log(`[ERROR] Invalid block proposal rejected: ${block.index}`);
    }
  }

  // Handle emotional proposal from validators
  private async handleEmotionalProposal(message: NetworkMessage): Promise<void> {
    const proposal = message.data;
    
    // Validate emotional proposal
    if (this.validateEmotionalProposal(proposal)) {
      console.log(`[EMOTION] Emotional proposal received from ${proposal.validatorId}`);
      
      // Forward to consensus engine
      this.emit('emotionalProposal', proposal);
    }
  }

  // Handle transaction broadcast
  private async handleTransactionBroadcast(message: NetworkMessage): Promise<void> {
    const transaction: Transaction = message.data;
    
    // Add transaction to blockchain
    if (this.blockchain.addTransaction(transaction)) {
      console.log(`[TRANSACTION] Transaction added: ${transaction.id}`);
    }
  }

  // Handle validator registration
  private async handleValidatorRegistration(message: NetworkMessage): Promise<void> {
    const validator: EmotionalValidator = message.data;
    
    if (this.blockchain.registerValidator(validator)) {
      console.log(`[VALIDATOR] Validator registered: ${validator.id}`);
      this.updateValidatorCount();
    }
  }

  // Handle consensus vote
  private async handleConsensusVote(message: NetworkMessage): Promise<void> {
    const vote = message.data;
    console.log(`[VOTE] Consensus vote received from ${message.from}`);
    this.emit('consensusVote', vote);
  }

  // Handle biometric validation request
  private async handleBiometricValidation(message: NetworkMessage): Promise<void> {
    const biometricData: BiometricData = message.data;
    
    // Process biometric validation
    console.log(`[BIOMETRIC] Biometric validation request from ${message.from}`);
    this.emit('biometricValidation', biometricData);
  }

  // Handle chain synchronization
  private async handleChainSync(message: NetworkMessage, ws: WebSocket): Promise<void> {
    if (message.data.request) {
      // Send our chain
      this.sendMessage(ws, {
        type: MessageType.CHAIN_SYNC,
        data: {
          request: false,
          chain: this.blockchain.getChain(),
          stats: this.blockchain.getChainStats()
        },
        from: this.nodeId,
        timestamp: Date.now()
      });
    } else {
      // Received chain data
      const receivedChain: PoEBlock[] = message.data.chain;
      
      if (this.validateReceivedChain(receivedChain)) {
        console.log(`[SYNC] Chain sync completed, updated to length: ${receivedChain.length}`);
        // In real implementation, would carefully merge chains
      }
    }
  }

  // Handle heartbeat messages
  private handleHeartbeat(message: NetworkMessage, peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.lastSeen = Date.now();
      this.peers.set(peerId, peer);
    }
  }

  // Broadcast block proposal to network
  private broadcastBlockProposal(block: PoEBlock): void {
    const message: NetworkMessage = {
      type: MessageType.BLOCK_PROPOSAL,
      data: block,
      from: this.nodeId,
      timestamp: Date.now()
    };

    this.broadcastToAll(message);
    console.log(`[BROADCAST] Block proposal broadcasted: ${block.index}`);
  }

  // Broadcast transaction to network
  private broadcastTransaction(transaction: Transaction): void {
    const message: NetworkMessage = {
      type: MessageType.TRANSACTION_BROADCAST,
      data: transaction,
      from: this.nodeId,
      timestamp: Date.now()
    };

    this.broadcastToAll(message);
  }

  // Broadcast emotional proposal to validators
  public broadcastEmotionalProposal(proposal: any): void {
    const message: NetworkMessage = {
      type: MessageType.EMOTIONAL_PROPOSAL,
      data: proposal,
      from: this.nodeId,
      timestamp: Date.now()
    };

    this.broadcastToValidators(message);
    console.log(`[BRAIN] Emotional proposal broadcasted from ${this.nodeId}`);
  }

  // Broadcast biometric validation request
  public broadcastBiometricValidation(biometricData: BiometricData): void {
    const message: NetworkMessage = {
      type: MessageType.BIOMETRIC_VALIDATION,
      data: biometricData,
      from: this.nodeId,
      timestamp: Date.now()
    };

    this.broadcastToValidators(message);
  }

  // Connect to a peer
  public async connectToPeer(address: string, port: number): Promise<boolean> {
    try {
      const ws = new WebSocket(`ws://${address}:${port}`);
      
      return new Promise((resolve) => {
        ws.on('open', () => {
          console.log(`[CONNECT] Connected to peer: ${address}:${port}`);
          
          // Send discovery message
          this.sendMessage(ws, {
            type: MessageType.NETWORK_DISCOVERY,
            data: {
              nodeId: this.nodeId,
              isValidator: this.isValidator,
              chainLength: this.blockchain.getChain().length
            },
            from: this.nodeId,
            timestamp: Date.now()
          });
          
          resolve(true);
        });

        ws.on('error', (error) => {
          console.error(`[ERROR] Failed to connect to ${address}:${port}:`, error);
          resolve(false);
        });
      });
    } catch (error) {
      console.error(`[ERROR] Connection error:`, error);
      return false;
    }
  }

  // Register as validator
  public registerAsValidator(validator: EmotionalValidator): void {
    this.isValidator = true;
    this.validator = validator;
    
    // Register with blockchain
    this.blockchain.registerValidator(validator);
    
    // Broadcast validator registration
    const message: NetworkMessage = {
      type: MessageType.VALIDATOR_REGISTRATION,
      data: validator,
      from: this.nodeId,
      timestamp: Date.now()
    };

    this.broadcastToAll(message);
    console.log(`[VALIDATOR] Registered as validator: ${validator.id}`);
  }

  // Start mining process (for validators)
  public async startMining(biometricData: BiometricData): Promise<void> {
    if (!this.isValidator || !this.validator) {
      console.log('[ERROR] Node is not a validator');
      return;
    }

    try {
      const block = await this.blockchain.mineBlock(this.validator.id, biometricData);
      if (block) {
        console.log(`[MINING] Successfully mined block: ${block.index}`);
      }
    } catch (error) {
      console.error('[ERROR] Mining error:', error);
    }
  }

  // Broadcast message to all peers
  private broadcastToAll(message: NetworkMessage): void {
    this.peers.forEach((peer) => {
      if (peer.connection && peer.connection.readyState === WebSocket.OPEN) {
        this.sendMessage(peer.connection, message);
      }
    });
  }

  // Broadcast message to validators only
  private broadcastToValidators(message: NetworkMessage): void {
    this.peers.forEach((peer) => {
      if (peer.isValidator && peer.connection && peer.connection.readyState === WebSocket.OPEN) {
        this.sendMessage(peer.connection, message);
      }
    });
  }

  // Send message to specific connection
  private sendMessage(ws: WebSocket, message: NetworkMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[ERROR] Failed to send message:', error);
    }
  }

  // Request chain sync from peer
  private requestChainSync(ws: WebSocket): void {
    this.sendMessage(ws, {
      type: MessageType.CHAIN_SYNC,
      data: { request: true },
      from: this.nodeId,
      timestamp: Date.now()
    });
  }

  // Validate proposed block
  private async validateProposedBlock(block: PoEBlock): Promise<boolean> {
    // Basic validation
    if (!block.hash || !block.previousHash || block.index < 0) {
      return false;
    }

    // Validate emotional consensus
    if (block.emotionalConsensus.consensusScore < 0.67) {
      return false;
    }

    // Validate authenticity
    if (block.emotionalConsensus.authenticity < 0.5) {
      return false;
    }

    return true;
  }

  // Validate emotional proposal
  private validateEmotionalProposal(proposal: any): boolean {
    return proposal.validatorId && 
           proposal.emotionalState && 
           proposal.confidence >= 0.6 &&
           proposal.timestamp &&
           (Date.now() - proposal.timestamp) < 60000; // 1 minute max age
  }

  // Validate received chain
  private validateReceivedChain(chain: PoEBlock[]): boolean {
    if (chain.length <= this.blockchain.getChain().length) {
      return false;
    }

    // Validate chain structure
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i];
      const previous = chain[i - 1];
      
      if (current.previousHash !== previous.hash) {
        return false;
      }
      
      if (current.emotionalConsensus.consensusScore < 0.67) {
        return false;
      }
    }

    return true;
  }

  // Handle peer disconnection
  private handlePeerDisconnection(peerId: string): void {
    this.peers.delete(peerId);
    this.updateNetworkStats();
    console.log(`[DISCONNECT] Peer disconnected: ${peerId}`);
  }

  // Start periodic network maintenance
  private startNetworkMaintenance(): void {
    setInterval(() => {
      this.sendHeartbeats();
      this.cleanupStalePeers();
      this.updateNetworkStats();
    }, 30000); // Every 30 seconds
  }

  // Send heartbeat to all peers
  private sendHeartbeats(): void {
    const heartbeat: NetworkMessage = {
      type: MessageType.HEARTBEAT,
      data: { timestamp: Date.now() },
      from: this.nodeId,
      timestamp: Date.now()
    };

    this.broadcastToAll(heartbeat);
  }

  // Remove stale peer connections
  private cleanupStalePeers(): void {
    const now = Date.now();
    const timeout = 120000; // 2 minutes

    this.peers.forEach((peer, peerId) => {
      if (now - peer.lastSeen > timeout) {
        console.log(`[CLEANUP] Removing stale peer: ${peerId}`);
        this.peers.delete(peerId);
      }
    });
  }

  // Update network statistics
  private updateNetworkStats(): void {
    this.networkStats.connectedPeers = this.peers.size;
    this.networkStats.activeValidators = Array.from(this.peers.values())
      .filter(peer => peer.isValidator).length;
    
    // Calculate average emotional reliability
    const totalReliability = Array.from(this.peers.values())
      .reduce((sum, peer) => sum + peer.emotionalReliability, 0);
    
    this.networkStats.emotionalSyncRate = this.peers.size > 0 ? 
           totalReliability / this.peers.size : 0;
  }

  // Update validator count
  private updateValidatorCount(): void {
    this.networkStats.activeValidators = Array.from(this.peers.values())
      .filter(peer => peer.isValidator).length;
  }

  // Generate unique peer ID
  private generatePeerId(): string {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get network statistics
  public getNetworkStats(): NetworkStats {
    return { ...this.networkStats };
  }

  // Get connected peers
  public getPeers(): PeerNode[] {
    return Array.from(this.peers.values());
  }

  // Get validator peers
  public getValidatorPeers(): PeerNode[] {
    return Array.from(this.peers.values()).filter(peer => peer.isValidator);
  }

  // Shutdown network
  public shutdown(): void {
    if (this.server) {
      this.server.close();
    }
    
    this.peers.forEach(peer => {
      if (peer.connection) {
        peer.connection.close();
      }
    });
    
    console.log(`[SHUTDOWN] EmotionalChain node ${this.nodeId} shutdown complete`);
  }
}

// Export network classes and interfaces
export {
  EmotionalNetwork,
  type NetworkMessage,
  type PeerNode,
  type NetworkStats,
  MessageType
};