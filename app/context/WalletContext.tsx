'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { STACKS_TESTNET } from '@stacks/network';
import { principalCV, uintCV, bufferCV } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';

// Import AppKit configuration
import '../config/appkit';

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

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { open } = useAppKit()
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('bip122')
  
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Get Stacks address when wallet connects
  useEffect(() => {
    const getStacksAddress = async () => {
      if (appKitConnected && walletProvider) {
        try {
          // Get account addresses from Bitcoin wallet (includes STX address)
          const accounts = await (walletProvider as any).getAccountAddresses()
          
          // Find the Stacks address (purpose: 'stx')
          const stxAccount = accounts.find((acc: any) => acc.purpose === 'stx')
          
          if (stxAccount) {
            setStacksAddress(stxAccount.address)
          } else {
            // If no STX address, try to use the payment address as fallback
            const paymentAccount = accounts.find((acc: any) => acc.purpose === 'payment')
            setStacksAddress(paymentAccount?.address || null)
          }
        } catch (err) {
          console.error('Error getting Stacks address:', err)
          setError('Failed to retrieve Stacks address from wallet')
        }
      } else {
        setStacksAddress(null)
      }
    }

    getStacksAddress()
  }, [appKitConnected, walletProvider])

  const connectWallet = useCallback(() => {
    open()
  }, [open]);

  const disconnectWallet = useCallback(async () => {
    try {
      const { open } = useAppKit()
      // Open modal to disconnect
      open({ view: 'Account' })
    } catch (err) {
      console.error('Disconnect error:', err)
    }
    setStacksAddress(null)
    setError(null)
    setSuccess(null)
  }, []);

  const callSetValue = useCallback(async (key: string, value: string) => {
    if (!stacksAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'set-value',
        functionArgs: [bufferCV(Buffer.from(key)), bufferCV(Buffer.from(value))],
        network: NETWORK,
        onFinish: (data) => {
          setSuccess(`Transaction broadcasted! TxID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction canceled');
          setLoading(false);
        },
      });
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [stacksAddress]);

  const callGetValue = useCallback(async (key: string) => {
    if (!stacksAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('https://api.testnet.hiro.so/v2/contracts/call-read/ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G/blonde-peach-tern/get-value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: stacksAddress,
          arguments: [`0x${Buffer.from(key).toString('hex')}`],
        }),
      });

      const data = await response.json();
      setSuccess(`Value: ${data.result || 'Not found'}`);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [stacksAddress]);

  const callTestEventTypes = useCallback(async () => {
    if (!stacksAddress) {
      setError('Please connect your wallet first');
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
          setSuccess(`Test event transaction broadcasted! TxID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction canceled');
          setLoading(false);
        },
      });
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [stacksAddress]);

  const callTestEmitEvent = useCallback(async () => {
    if (!stacksAddress) {
      setError('Please connect your wallet first');
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
          setSuccess(`Emit event transaction broadcasted! TxID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction canceled');
          setLoading(false);
        },
      });
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [stacksAddress]);

  const fetchBlockchainStats = useCallback(async (): Promise<BlockchainStats> => {
    try {
      const response = await fetch('https://api.testnet.hiro.so/v2/info');
      const data = await response.json();
      
      return {
        totalTransactions: data.tx_count || 0,
        activeUsers: 342, // Simulated
        totalValue: 12450.75, // Simulated
        avgBlockTime: 10.2,
        currentStxPrice: 0.50, // Simulated
        totalStxSupply: data.stacks_tip_height * 1000 || 0 // Rough estimation
      };
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      return {
        totalTransactions: 0,
        activeUsers: 0,
        totalValue: 0,
        avgBlockTime: 0,
        currentStxPrice: 0,
        totalStxSupply: 0
      };
    }
  }, []);

  const fetchAccountBalance = useCallback(async (address: string): Promise<number> => {
    try {
      const response = await fetch(`https://api.testnet.hiro.so/extended/v1/address/${address}/stx`);
      const data = await response.json();
      return parseInt(data.balance) / 1000000; // Convert from micro-STX to STX
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return 0;
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address: stacksAddress,
        isConnected: appKitConnected && !!stacksAddress,
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

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
