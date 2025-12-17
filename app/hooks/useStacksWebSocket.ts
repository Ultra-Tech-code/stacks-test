'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { connectWebSocketClient } from '@stacks/blockchain-api-client';

interface StacksEvent {
  event: string;
  txId: string;
  pollId?: number;
  data?: any;
}

interface UseStacksWebSocketProps {
  contractAddress: string;
  contractName: string;
  onEvent?: (event: StacksEvent) => void;
  autoConnect?: boolean;
}

export function useStacksWebSocket({
  contractAddress,
  contractName,
  onEvent,
  autoConnect = true
}: UseStacksWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);

  const connect = useCallback(async () => {
    try {
      console.log('Connecting to Stacks WebSocket...');
      
      // Connect to Stacks testnet WebSocket
      const client = await connectWebSocketClient('wss://api.testnet.hiro.so/');
      clientRef.current = client;
      
      console.log('WebSocket connected, subscribing to address transactions...');
      setIsConnected(true);
      setError(null);

      // Subscribe to transactions for the contract address
      const contractId = `${contractAddress}.${contractName}`;
      const subscription = await client.subscribeAddressTransactions(contractId, (addressTx: any) => {
        console.log('Transaction event received:', addressTx);
        
        const tx = addressTx.tx || addressTx;
        const stacksEvent: StacksEvent = {
          event: tx.tx_type || 'transaction',
          txId: tx.tx_id || '',
          data: addressTx
        };
        
        onEvent?.(stacksEvent);
      });

      subscriptionRef.current = subscription;
      console.log('Successfully subscribed to contract transactions');
      
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnected(false);
    }
  }, [contractAddress, contractName, onEvent]);

  const disconnect = useCallback(async () => {
    try {
      if (subscriptionRef.current) {
        await subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (clientRef.current) {
        // Close the WebSocket connection
        clientRef.current = null;
      }
      
      setIsConnected(false);
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect
  };
}
