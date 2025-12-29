'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  stringAsciiCV, 
  uintCV, 
  boolCV, 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode,
  PostConditionMode
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
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

const CONTRACT_ADDRESS = 'SP33Y8RCP74098JCSPW5QHHCD6QN4H3XS9DM3QXXX';
const CONTRACT_NAME = 'Blackadam-Voting-Contract';

export const VotingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected, userSession } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const signAndBroadcast = useCallback(async (functionName: string, functionArgs: any[]) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    return new Promise<string>((resolve, reject) => {
      openContractCall({
        network: STACKS_MAINNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          resolve(data.txId);
        },
        onCancel: () => {
          reject(new Error('Transaction canceled by user'));
        },
      });
    });
  }, [isConnected, address]);

  const createPoll = useCallback(async (title: string, description: string, duration: number) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('📤 Sending to contract - create-poll:', {
        title,
        description,
        duration,
        durationInDays: (duration / 144).toFixed(1)
      });
      
      const txId = await signAndBroadcast('create-poll', [
        stringAsciiCV(title),
        stringAsciiCV(description),
        uintCV(duration),
      ]);
      
      setSuccess(`Poll created successfully! TX ID: ${txId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMessage);
      console.error('Create poll error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, signAndBroadcast]);

  const vote = useCallback(async (pollId: number, voteYes: boolean) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const txId = await signAndBroadcast('vote', [
        uintCV(pollId),
        boolCV(voteYes),
      ]);
      
      setSuccess(`Vote cast successfully! TX ID: ${txId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cast vote';
      setError(errorMessage);
      console.error('Vote error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, signAndBroadcast]);

  const endPoll = useCallback(async (pollId: number) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const txId = await signAndBroadcast('end-poll', [
        uintCV(pollId)
      ]);
      
      setSuccess(`Poll ended successfully! TX ID: ${txId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end poll';
      setError(errorMessage);
      console.error('End poll error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, signAndBroadcast]);

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