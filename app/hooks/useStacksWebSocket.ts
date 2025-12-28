'use client';

import { useEffect, useState, useRef } from 'react';
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
  const isConnectingRef = useRef(false);

  useEffect(() => {
    if (!autoConnect) return;

    let mounted = true;

    const connect = async () => {
      // Prevent multiple simultaneous connections
      if (isConnectingRef.current || clientRef.current) {
        return;
      }

      isConnectingRef.current = true;

      try {
        // Connect to Stacks testnet WebSocket
        const client = await connectWebSocketClient('wss://api.hiro.so/');
        
        if (!mounted) {
          return;
        }

        clientRef.current = client;
        
        setIsConnected(true);
        setError(null);

        // Subscribe to transactions for the contract address
        const contractId = `${contractAddress}.${contractName}`;
        const subscription = await client.subscribeAddressTransactions(contractId, (addressTx: any) => {
          if (!mounted) return;
          
          const tx = addressTx.tx || addressTx;
          const stacksEvent: StacksEvent = {
            event: tx.tx_type || 'transaction',
            txId: tx.tx_id || '',
            data: addressTx
          };
          
          onEvent?.(stacksEvent);
        });

        if (!mounted) {
          await subscription.unsubscribe();
          return;
        }

        subscriptionRef.current = subscription;
        
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to connect');
          setIsConnected(false);
        }
      } finally {
        isConnectingRef.current = false;
      }
    };

    connect();

    // Cleanup function
    return () => {
      mounted = false;
      
      const cleanup = async () => {
        try {
          if (subscriptionRef.current) {
            await subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
          }
          
          clientRef.current = null;
          isConnectingRef.current = false;
          setIsConnected(false);
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      };

      cleanup();
    };
  }, [autoConnect, contractAddress, contractName, onEvent]);

  return {
    isConnected,
    error
  };
}
