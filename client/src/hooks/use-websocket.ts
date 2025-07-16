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

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Handle different environments properly
      let wsUrl: string;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Development environment
        wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;
      } else {
        // Production environment (Replit)
        wsUrl = `${protocol}//${window.location.host}/ws`;
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
