import { useEffect, useState, useRef } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Debug logging removed - connection working properly
    
    // Replit environment detection - use exact current host
    if (hostname.includes('replit.dev')) {
      return `${protocol}//${window.location.host}/ws`;
    }
    
    // Local development environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:5000/ws';
    }
    
    // Production environment
    return `${protocol}//${window.location.host}/ws`;
  };

  const connect = () => {
    try {
      const wsUrl = getWebSocketUrl();
      
      // Validate URL before attempting connection
      if (!wsUrl || wsUrl.includes('undefined')) {
        console.error('Invalid WebSocket URL:', wsUrl);
        setIsConnected(false);
        return;
      }
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connected to:', wsUrl);
        setIsConnected(true);
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      socketRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 3000);
      };
      
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('Failed to connect to WebSocket URL:', wsUrl);
        setIsConnected(false);
        
        // Close the socket if it's in a bad state
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
      
      // Attempt to reconnect after 5 seconds on connection failure
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Retrying WebSocket connection after failure...');
        connect();
      }, 5000);
    }
  };

  // Add connection validation
  const validateConnection = () => {
    if (socketRef.current) {
      const state = socketRef.current.readyState;
      if (state === WebSocket.CLOSING || state === WebSocket.CLOSED) {
        setIsConnected(false);
        connect();
      }
    }
  };

  // Periodic connection health check
  useEffect(() => {
    const healthCheck = setInterval(validateConnection, 30000); // Check every 30 seconds
    return () => clearInterval(healthCheck);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const sendMessage = (message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now()
      }));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}
