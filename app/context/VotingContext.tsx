'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import { stringAsciiCV, uintCV, boolCV, principalCV } from '@stacks/transactions';
import { useWallet } from './WalletContext';

interface VotingContextType {
  createPoll: (title: string, description: string, duration: number) => Promise<void>;
  vote: (pollId: number, voteYes: boolean) => Promise<void>;
  endPoll: (pollId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

const CONTRACT_ADDRESS = 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G';
const CONTRACT_NAME = 'Blackadam-vote-contract';
const NETWORK = STACKS_TESTNET;

export const VotingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const createPoll = useCallback(async (title: string, description: string, duration: number) => {
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
        functionName: 'create-poll',
        functionArgs: [
          stringAsciiCV(title),
          stringAsciiCV(description),
          uintCV(duration),
        ],
        network: NETWORK,
        onFinish: (data) => {
          console.log('Poll created:', data.txId);
          setSuccess(`Poll created successfully! TX ID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction cancelled by user');
          setLoading(false);
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMessage);
      console.error('Create poll error:', err);
      setLoading(false);
    }
  }, [isConnected, address]);

  const vote = useCallback(async (pollId: number, voteYes: boolean) => {
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
        functionName: 'vote',
        functionArgs: [
          uintCV(pollId),
          boolCV(voteYes),
        ],
        network: NETWORK,
        onFinish: (data) => {
          console.log('Vote cast:', data.txId);
          setSuccess(`Vote cast successfully! TX ID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction cancelled by user');
          setLoading(false);
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cast vote';
      setError(errorMessage);
      console.error('Vote error:', err);
      setLoading(false);
    }
  }, [isConnected, address]);

  const endPoll = useCallback(async (pollId: number) => {
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
        functionName: 'end-poll',
        functionArgs: [uintCV(pollId)],
        network: NETWORK,
        onFinish: (data) => {
          console.log('Poll ended:', data.txId);
          setSuccess(`Poll ended successfully! TX ID: ${data.txId}`);
          setLoading(false);
        },
        onCancel: () => {
          setError('Transaction cancelled by user');
          setLoading(false);
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end poll';
      setError(errorMessage);
      console.error('End poll error:', err);
      setLoading(false);
    }
  }, [isConnected, address]);

  return (
    <VotingContext.Provider
      value={{
        createPoll,
        vote,
        endPoll,
        loading,
        error,
        success,
        clearMessages,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
};

export const useVoting = (): VotingContextType => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within VotingProvider');
  }
  return context;
};
