'use client';

import { useState, useEffect } from 'react';
import { useVoting } from '../context/VotingContext';
import { useWallet } from '../context/WalletContext';

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
  
  // Create poll form
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [pollDurationDays, setPollDurationDays] = useState('1'); // Duration in days

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

  // Load all polls
  const loadPolls = async () => {
    setLoadingPolls(true);
    const count = await fetchPollCount();
    const pollPromises = [];
    
    for (let i = 0; i < count; i++) {
      pollPromises.push(fetchPoll(i));
    }
    
    const fetchedPolls = await Promise.all(pollPromises);
    setPolls(fetchedPolls.filter((p): p is Poll => p !== null).reverse());
    setLoadingPolls(false);
  };

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
    
    // Refresh polls after creation
    setTimeout(() => loadPolls(), 3000);
  };

  const handleVote = async (pollId: number, voteYes: boolean) => {
    await vote(pollId, voteYes);
    
    // Refresh polls after voting
    setTimeout(() => loadPolls(), 3000);
  };

  const handleEndPoll = async (pollId: number) => {
    if (confirm('Are you sure you want to end this poll?')) {
      await endPoll(pollId);
      setTimeout(() => loadPolls(), 3000);
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
          </div>Change={(e) => setPollDuration(e.target.value)}
              min="1"
              placeholder="144"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              144 blocks ≈ 1 day | 1008 blocks ≈ 1 week
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
          <button
            onClick={loadPolls}
            disabled={loadingPolls}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            🔄 Refresh
          </button>
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
