'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AppConfig, showConnect, UserSession } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import { principalCV, uintCV, bufferCV } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';

interface BlockchainStats {
  totalTransactions: number;
  activeUsers: number;
  totalValue: number;
  avgBlockTime: number;
  currentStxPrice: number;
  totalStxSupply: number;
}

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
  callSetValue: (key: string, value: string) => Promise<void>;
  callGetValue: (key: string) => Promise<void>;
  callTestEventTypes: () => Promise<void>;
  callTestEmitEvent: () => Promise<void>;
  fetchBlockchainStats: () => Promise<BlockchainStats>;
  fetchAccountBalance: (address: string) => Promise<number>;
  loading: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const CONTRACT_ADDRESS = 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G';
const CONTRACT_NAME = 'blonde-peach-tern';
const NETWORK = STACKS_TESTNET;

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkConnection = () => {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        const userAddress = userData.profile.stxAddress.testnet;
        console.log('User already signed in:', userAddress);
        if (userAddress) {
          setAddress(userAddress);
          setIsConnected(true);
        }
      }
    };

    checkConnection();
  }, []);

  const connectWallet = useCallback(() => {
    showConnect({
      appDetails: {
        name: 'Stacks DApp',
        icon: window.location.origin + '/next.svg',
      },
      redirectTo: '/',
      userSession,
      onFinish: () => {
        console.log('Connection finished!');
        
        // Get user data after connection
        if (userSession.isUserSignedIn()) {
          const userData = userSession.loadUserData();
          const userAddress = userData.profile.stxAddress.testnet;
          console.log('User address:', userAddress);
          
          if (userAddress) {
            setAddress(userAddress);
            setIsConnected(true);
            setError(null);
          } else {
            setError('Failed to retrieve wallet address');
          }
        }
      },
      onCancel: () => {
        console.log('Connection cancelled');
        setError('Wallet connection cancelled');
      },
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    userSession.signUserOut();
  }, []);

  const callSetValue = useCallback(async (key: string, value: string) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert string to buffer (max 32 bytes)
      const keyBuffer = bufferCV(Buffer.from(key.padEnd(32, '\0')));
      const valueBuffer = bufferCV(Buffer.from(value.padEnd(32, '\0')));

      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'set-value',
        functionArgs: [keyBuffer, valueBuffer],
        network: NETWORK,
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          setSuccess(`Transaction submitted! TX ID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction cancelled by user');
          setLoading(false);
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to call set-value';
      setError(errorMessage);
      console.error('Contract call error:', err);
      setLoading(false);
    }
  }, [isConnected, address]);

  const callGetValue = useCallback(async (key: string) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const keyBuffer = bufferCV(Buffer.from(key.padEnd(32, '\0')));

      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-value',
        functionArgs: [keyBuffer],
        network: NETWORK,
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          setSuccess(`Transaction submitted! TX ID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction cancelled by user');
          setLoading(false);
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to call get-value';
      setError(errorMessage);
      console.error('Contract call error:', err);
      setLoading(false);
    }
  }, [isConnected, address]);

  const callTestEventTypes = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'test-event-types',
        functionArgs: [],
        network: NETWORK,
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          setSuccess(`Transaction submitted! TX ID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction cancelled by user');
          setLoading(false);
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to call test-event-types';
      setError(errorMessage);
      console.error('Contract call error:', err);
      setLoading(false);
    }
  }, [isConnected, address]);

  const callTestEmitEvent = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'test-emit-event',
        functionArgs: [],
        network: NETWORK,
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          setSuccess(`Transaction submitted! TX ID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction cancelled by user');
          setLoading(false);
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to call test-emit-event';
      setError(errorMessage);
      console.error('Contract call error:', err);
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchBlockchainStats = useCallback(async (): Promise<BlockchainStats> => {
    try {
      setLoading(true);
      
      // Fetch blockchain stats from Stacks API
      const [networkStatusRes, stxPriceRes, totalSupplyRes] = await Promise.all([
        fetch('https://stacks-node-api.testnet.stacks.co/v2/info/network_status'),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd'),
        fetch('https://stacks-node-api.testnet.stacks.co/v2/info/total')
      ]);

      if (!networkStatusRes.ok || !stxPriceRes.ok || !totalSupplyRes.ok) {
        throw new Error('Failed to fetch blockchain data');
      }

      const networkStatus = await networkStatusRes.json();
      const priceData = await stxPriceRes.json();
      const totalSupply = await totalSupplyRes.json();

      // Calculate some stats
      const stats: BlockchainStats = {
        totalTransactions: networkStatus.tx_count || 0,
        activeUsers: Math.floor(Math.random() * 1000), // This would come from your contract or an indexer
        totalValue: (parseInt(totalSupply.total_stx) / 1000000) * (priceData.blockstack?.usd || 0.5),
        avgBlockTime: networkStatus.avg_block_time || 10.2,
        currentStxPrice: priceData.blockstack?.usd || 0.5,
        totalStxSupply: parseInt(totalSupply.total_stx) / 1000000 // Convert to STX (6 decimal places)
      };

      setBlockchainStats(stats);
      return stats;
    } catch (err) {
      console.error('Error fetching blockchain stats:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccountBalance = useCallback(async (address: string): Promise<number> => {
    try {
      const response = await fetch(`https://stacks-node-api.testnet.stacks.co/v2/accounts/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch account balance');
      }
      const data = await response.json();
      return parseInt(data.balance) / 1000000; // Convert to STX (6 decimal places)
    } catch (err) {
      console.error('Error fetching account balance:', err);
      throw err;
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        connectWallet,
        disconnectWallet,
        callSetValue,
        callGetValue,
        callTestEventTypes,
        callTestEmitEvent,
        fetchBlockchainStats,
        fetchAccountBalance,
        loading,
        error,
        success,
        clearMessages,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
