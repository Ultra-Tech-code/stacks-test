'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoting } from '../context/VotingContext';
import { useWallet } from '../context/WalletContext';
import { useStacksWebSocket } from '../hooks/useStacksWebSocket';

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

const CONTRACT_ADDRESS = 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G';
const CONTRACT_NAME = 'Blackadam-vote-contract';

export default function VotingDApp() {
  const { isConnected, address } = useWallet();
  const { createPoll, vote, endPoll, loading, error, success, clearMessages } = useVoting();
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollCount, setPollCount] = useState(0);
  const [loadingPolls, setLoadingPolls] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cache duration: 30 seconds
  const CACHE_DURATION = 30000;
  
  // Create poll form
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [pollDurationDays, setPollDurationDays] = useState('1'); // Duration in days

  // WebSocket for real-time updates
  const { isConnected: wsConnected, error: wsError } = useStacksWebSocket({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    onEvent: (event) => {
      console.log('Real-time event:', event);
      
      // Add event to realtime feed
      setRealtimeEvents(prev => [
        `${new Date().toLocaleTimeString()}: ${event.event} - TX: ${event.txId.slice(0, 8)}...`,
        ...prev.slice(0, 9) // Keep last 10 events
      ]);
      
      // Auto-refresh polls when contract events occur
      loadPolls(true);
    },
    autoConnect: isConnected
  });

  // Fetch poll count
  const fetchPollCount = async () => {
    try {
      const response = await fetch('/api/voting/poll-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: address || 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G',
        }),
      });
      
      const data = await response.json();
      if (data.okay && data.result) {
        const count = parseInt(data.result.replace('(ok u', '').replace(')', ''));
        setPollCount(count);
        return count;
      }
    } catch (error) {
      console.error('Failed to fetch poll count:', error);
    }
    return 0;
  };

  // Fetch individual poll
  const fetchPoll = async (pollId: number): Promise<Poll | null> => {
    try {
      const response = await fetch('/api/voting/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: address || 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G',
          pollId,
        }),
      });
      
      const data = await response.json();
      
      if (data.okay && data.result && !data.result.includes('none')) {
        // Parse the Clarity tuple response
        const result = data.result;
        return {
          pollId,
          creator: extractPrincipal(result, 'creator'),
          title: extractString(result, 'title'),
          description: extractString(result, 'description'),
          yesVotes: extractUint(result, 'yes-votes'),
          noVotes: extractUint(result, 'no-votes'),
          endBlock: extractUint(result, 'end-block'),
          isActive: extractBool(result, 'is-active'),
        };
      }
    } catch (error) {
      console.error(`Failed to fetch poll ${pollId}:`, error);
    }
    return null;
  };

  // Helper functions to parse Clarity responses
  const extractString = (str: string, key: string): string => {
    const regex = new RegExp(`${key}: "([^"]*)"`, 'i');
    const match = str.match(regex);
    return match ? match[1] : '';
  };

  const extractUint = (str: string, key: string): number => {
    const regex = new RegExp(`${key}: u(\\d+)`, 'i');
    const match = str.match(regex);
    return match ? parseInt(match[1]) : 0;
  };

  const extractBool = (str: string, key: string): boolean => {
    const regex = new RegExp(`${key}: (true|false)`, 'i');
    const match = str.match(regex);
    return match ? match[1] === 'true' : false;
  };

  const extractPrincipal = (str: string, key: string): string => {
    const regex = new RegExp(`${key}: ([A-Z0-9]+)`, 'i');
    const match = str.match(regex);
    return match ? match[1] : '';
  };

  // Load all polls with caching and debouncing
  const loadPolls = useCallback(async (forceRefresh = false) => {
    // Check if we need to refresh (cache expired or forced)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
      console.log('Using cached poll data');
      return;
    }

    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    setLoadingPolls(true);
    const count = await fetchPollCount();
    
    // Batch fetch polls with delay to avoid rate limit
    const pollPromises = [];
    for (let i = 0; i < count; i++) {
      pollPromises.push(
        new Promise<Poll | null>((resolve) => {
          // Stagger requests by 100ms each to avoid rate limit
          setTimeout(() => {
            fetchPoll(i).then(resolve);
          }, i * 100);
        })
      );
    }
    
    const fetchedPolls = await Promise.all(pollPromises);
    setPolls(fetchedPolls.filter((p): p is Poll => p !== null).reverse());
    setLoadingPolls(false);
    setLastFetchTime(now);
  }, [lastFetchTime, CACHE_DURATION]);

  useEffect(() => {
    if (isConnected) {
      loadPolls();
    }
  }, [isConnected]);

  const handleCreatePoll = async () => {
    if (!newPollTitle || !newPollDescription) {
      alert('Please fill in all fields');
      return;
    }
    
    // Convert days to blocks (144 blocks per day, ~10 min per block)
    const durationInBlocks = Math.floor(parseFloat(pollDurationDays) * 144);
    
    if (durationInBlocks < 1) {
      alert('Duration must be at least 1 block (~10 minutes)');
      return;
    }
    
    await createPoll(newPollTitle, newPollDescription, durationInBlocks);
    setNewPollTitle('');
    setNewPollDescription('');
    
    // WebSocket will auto-refresh when event comes through
  };

  const handleVote = async (pollId: number, voteYes: boolean) => {
    await vote(pollId, voteYes);
    // WebSocket will auto-refresh when event comes through
  };

  const handleEndPoll = async (pollId: number) => {
    if (confirm('Are you sure you want to end this poll?')) {
      await endPoll(pollId);
      // WebSocket will auto-refresh when event comes through
    }
  };

  const getVotePercentage = (yes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((yes / total) * 100);
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          🗳️ Voting DApp
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to create and vote on polls
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* WebSocket Status */}
      <div className={`px-4 py-2 rounded text-sm ${
        wsConnected 
          ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100' 
          : 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
      }`}>
        {wsConnected ? '🟢 Live updates connected' : '🟡 Connecting to live updates...'}
        {wsError && <span className="ml-2 text-xs">({wsError})</span>}
      </div>

      {/* Real-time Events Feed */}
      {realtimeEvents.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📡 Real-time Events
          </h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {realtimeEvents.map((event, i) => (
              <p key={i} className="text-xs text-blue-800 dark:text-blue-200 font-mono">
                {event}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-100 px-4 py-3 rounded relative">
          <button onClick={clearMessages} className="absolute top-2 right-2">✕</button>
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-100 px-4 py-3 rounded relative">
          <button onClick={clearMessages} className="absolute top-2 right-2">✕</button>
          <p className="font-medium">Success! ✓</p>
          <p className="text-sm break-all">{success}</p>
        </div>
      )}

      {/* Create Poll */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          ➕ Create New Poll
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poll Title
            </label>
            <input
              type="text"
              value={newPollTitle}
              onChange={(e) => setNewPollTitle(e.target.value)}
              maxLength={256}
              placeholder="Enter poll title..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={newPollDescription}
              onChange={(e) => setNewPollDescription(e.target.value)}
              maxLength={1024}
              rows={3}
              placeholder="Enter poll description..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (days)
            </label>
            <input
              type="number"
              value={pollDurationDays}
              onChange={(e) => setPollDurationDays(e.target.value)}
              min="0.01"
              step="0.1"
              placeholder="1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              1 day = 144 blocks | 7 days = 1008 blocks | 0.1 days ≈ 14 blocks (~2.4 hours)
            </p>
          </div>
          <button
            onClick={handleCreatePoll}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </div>

      {/* Polls List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            🗳️ Active Polls ({pollCount})
          </h2>
          <div className="flex items-center gap-2">
            {lastFetchTime > 0 && (
              <span className="text-xs text-gray-500">
                Last updated: {new Date(lastFetchTime).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => loadPolls(true)}
              disabled={loadingPolls}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {loadingPolls ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {loadingPolls ? (
          <div className="text-center py-8 text-gray-500">Loading polls...</div>
        ) : polls.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No polls yet. Create the first one!</div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const totalVotes = poll.yesVotes + poll.noVotes;
              const yesPercent = getVotePercentage(poll.yesVotes, totalVotes);
              
              return (
                <div key={poll.pollId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {poll.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {poll.description}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      poll.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                    }`}>
                      {poll.isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>

                  {/* Vote Results */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">👍 Yes</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {poll.yesVotes} ({yesPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${yesPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600 dark:text-gray-400">👎 No</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {poll.noVotes} ({100 - yesPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${100 - yesPercent}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Total votes: {totalVotes} | Ends at block: {poll.endBlock}
                  </p>

                  {/* Vote Buttons */}
                  {poll.isActive && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleVote(poll.pollId, true)}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        👍 Vote Yes
                      </button>
                      <button
                        onClick={() => handleVote(poll.pollId, false)}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        👎 Vote No
                      </button>
                      {poll.creator === address && (
                        <button
                          onClick={() => handleEndPoll(poll.pollId)}
                          disabled={loading}
                          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
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
