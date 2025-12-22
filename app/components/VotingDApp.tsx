'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVoting } from '../context/VotingContext';
import { useWallet } from '../context/WalletContext';
import { useStacksWebSocket } from '../hooks/useStacksWebSocket';
import PollCountdown from './PollCountdown';

interface Poll {
  pollId: number;
  creator: string;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  endBlock: number;
  isActive: boolean;
}

export default function VotingDApp() {
  const { isConnected, address } = useWallet();
  const { createPoll, vote, endPoll, loading, error, success, clearMessages } = useVoting();
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollCount, setPollCount] = useState(0);
  const [loadingPolls, setLoadingPolls] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set());
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState('1');

  // WebSocket event handler
  const handleWebSocketEvent = useCallback((event: any) => {
    fetchPolls();
    fetchUserVotes();
  }, []);

  // Connect to WebSocket
  const { isConnected: wsConnected, error: wsError } = useStacksWebSocket({
    contractAddress: 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G',
    contractName: 'Blackadam-vote-contract',
    onEvent: handleWebSocketEvent,
    autoConnect: true
  });

  const parseHexString = (hex: string): string => {
    // Clarity string format: 0x0d + 4 bytes length + actual string bytes
    // Remove 0x0d prefix
    let cleaned = hex.replace(/^0x0d/, '');
    
    // Read the length (first 8 hex chars = 4 bytes)
    const lengthHex = cleaned.substring(0, 8);
    const length = parseInt(lengthHex, 16);
    
    // Get the actual string bytes (skip length bytes)
    const stringHex = cleaned.substring(8, 8 + (length * 2));
    
    let result = '';
    for (let i = 0; i < stringHex.length; i += 2) {
      const byte = stringHex.substr(i, 2);
      if (byte) {
        result += String.fromCharCode(parseInt(byte, 16));
      }
    }
    return result;
  };

  const parseHexUint = (hex: string): number => {
    // Remove 0x01 prefix (uint type) and parse
    const cleaned = hex.replace(/^0x01/, '');
    return parseInt(cleaned, 16);
  };

  const parseHexBool = (hex: string): boolean => {
    // 0x03 = true, 0x04 = false
    return hex === '0x03';
  };

  const parseHexPrincipal = (hex: string): string => {
    // Remove 0x05 prefix (standard principal) + version byte
    const cleaned = hex.replace(/^0x05/, '');
    // For now, just return a shortened version
    return cleaned.substring(0, 20);
  };

  const parseClarityTuple = (hexResult: string) => {
    // This is a simplified parser for the tuple structure
    // Format: 0x0a0c (tuple marker) + count + field data
    const parts = hexResult.match(/0763726561746f7205([0-9a-f]+?)0b6465736372697074696f6e0d([0-9a-f]+?)09656e642d626c6f636b01([0-9a-f]{32})0969732d616374697665([0-9a-f]{2})086e6f2d766f74657301([0-9a-f]{32})057469746c650d([0-9a-f]+?)097965732d766f74657301([0-9a-f]{32})/);
    
    if (!parts) {
      console.error('Failed to parse tuple:', hexResult);
      return null;
    }

    const titleHex = parts[6];
    const descHex = parts[2];
    
    return {
      creator: parts[1].substring(0, 42), // First 42 chars of principal
      title: parseHexString('0x0d' + titleHex),
      description: parseHexString('0x0d' + descHex),
      endBlock: parseInt(parts[3], 16),
      isActive: parts[4] === '03',
      noVotes: parseInt(parts[5], 16),
      yesVotes: parseInt(parts[7], 16),
    };
  };

  const extractValue = (str: string, key: string, type: string): string => {
    if (type === 'string') {
      const match = str.match(new RegExp(`${key}: "([^"]*)"`, 'i'));
      return match ? match[1] : '';
    }
    if (type === 'uint') {
      const match = str.match(new RegExp(`${key}: u(\\d+)`, 'i'));
      return match ? match[1] : '0';
    }
    if (type === 'bool') {
      const match = str.match(new RegExp(`${key}: (true|false)`, 'i'));
      return match ? match[1] : 'false';
    }
    if (type === 'principal') {
      const match = str.match(new RegExp(`${key}: ([A-Z0-9]+)`, 'i'));
      return match ? match[1] : '';
    }
    return '';
  };

  const fetchUserVotes = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      const response = await fetch('/api/voting/user-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      
      const data = await response.json();
      
      if (data.votedPolls) {
        setVotedPolls(new Set(data.votedPolls));
      }
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  }, [isConnected, address]);

  const fetchPolls = useCallback(async () => {
    if (!isConnected) return;
    
    setLoadingPolls(true);
    try {
      const response = await fetch('/api/voting/all-polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: address }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching polls:', data.error);
        setPollCount(0);
        setPolls([]);
        setLoadingPolls(false);
        return;
      }
      
      setPollCount(data.count || 0);
      
      if (!data.polls || data.polls.length === 0) {
        setPolls([]);
        setLoadingPolls(false);
        return;
      }

      const pollData: Poll[] = data.polls
        .map((pollResponse: any, index: number) => {
          if (!pollResponse.okay || !pollResponse.result) {
            return null;
          }
          
          const parsed = parseClarityTuple(pollResponse.result);
          if (!parsed) {
            return null;
          }

          return {
            pollId: index,
            creator: parsed.creator,
            title: parsed.title,
            description: parsed.description,
            yesVotes: parsed.yesVotes,
            noVotes: parsed.noVotes,
            endBlock: parsed.endBlock,
            isActive: parsed.isActive,
          };
        })
        .filter((poll: Poll | null): poll is Poll => poll !== null)
        .reverse();
      
      setPolls(pollData);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setPollCount(0);
      setPolls([]);
    } finally {
      setLoadingPolls(false);
    }
  }, [isConnected, address]);

  // Fetch polls and user votes on initial load
  useEffect(() => {
    if (isConnected) {
      fetchPolls();
      fetchUserVotes();
    }
  }, [isConnected, fetchPolls, fetchUserVotes]);

  const handleCreate = async () => {
    if (!title || !description) {
      alert('Please fill in all fields');
      return;
    }
    
    const blocks = Math.floor(parseFloat(days) * 144);
    await createPoll(title, description, blocks);
    setTitle('');
    setDescription('');
  };

  const handleVote = async (pollId: number, voteYes: boolean) => {
    await vote(pollId, voteYes);
    // Refetch user votes after voting to update the UI
    setTimeout(() => fetchUserVotes(), 3000);
  };

  const handleEnd = async (pollId: number) => {
    if (confirm('End this poll?')) {
      await endPoll(pollId);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">🗳️ Voting DApp</h2>
        <p className="text-gray-600 dark:text-gray-400">Connect your wallet to use the voting app</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* WebSocket Status */}
      <div className={`px-4 py-2 rounded-lg text-sm ${wsConnected ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
        {wsConnected ? '🟢 Live updates active' : '🟡 Connecting to live updates...'}
        {wsError && <span className="ml-2 text-red-600">({wsError})</span>}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 text-red-800 dark:text-red-100 px-4 py-3 rounded relative">
          <button onClick={clearMessages} className="absolute top-2 right-2">✕</button>
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 text-green-800 dark:text-green-100 px-4 py-3 rounded relative">
          <button onClick={clearMessages} className="absolute top-2 right-2">✕</button>
          <p className="font-medium">Success! ✓</p>
          <p className="text-sm break-all">{success}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">➕ Create Poll</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={256}
              className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1024}
              rows={3}
              className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min="0.01"
              step="0.1"
              className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold">🗳️ Polls ({pollCount})</h2>
          <button 
            onClick={() => fetchPolls()} 
            disabled={loadingPolls} 
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            title="Load polls"
          >
            {loadingPolls ? '⏳ Loading' : '🔄 Load Polls'}
          </button>
        </div>

        {loadingPolls ? (
          <div className="text-center py-8">Loading polls...</div>
        ) : polls.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No polls loaded yet</p>
            <p className="text-sm">Click "🔄 Load Polls" button above or create a new poll</p>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const total = poll.yesVotes + poll.noVotes;
              const yesPercent = total > 0 ? Math.round((poll.yesVotes / total) * 100) : 0;
              
              return (
                <div key={poll.pollId} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{poll.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{poll.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded text-xs h-fit ${poll.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {poll.isActive ? 'Active' : 'Ended'}
                      </span>
                      <PollCountdown endBlock={poll.endBlock} isActive={poll.isActive} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>👍 Yes</span>
                      <span>{poll.yesVotes} ({yesPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${yesPercent}%` }} />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>👎 No</span>
                      <span>{poll.noVotes} ({100 - yesPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: `${100 - yesPercent}%` }} />
                    </div>
                  </div>

                  {poll.isActive && (
                    <div className="flex gap-2 mt-4">
                      {votedPolls.has(poll.pollId) ? (
                        <div className="w-full text-center py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                          ✓ You voted on this poll
                        </div>
                      ) : (
                        <>
                          <button onClick={() => handleVote(poll.pollId, true)} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded">
                            👍 Yes
                          </button>
                          <button onClick={() => handleVote(poll.pollId, false)} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded">
                            👎 No
                          </button>
                        </>
                      )}
                      {poll.creator === address && (
                        <button onClick={() => handleEnd(poll.pollId)} disabled={loading} className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded">
                          End
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
