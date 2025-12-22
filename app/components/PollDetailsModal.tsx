'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Voter {
  address: string;
  vote: 'yes' | 'no';
  timestamp: number;
  txId: string;
}

interface PollDetailsModalProps {
  pollId: number;
  pollTitle: string;
  onClose: () => void;
}

export default function PollDetailsModal({ pollId, pollTitle, onClose }: PollDetailsModalProps) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVoters: 0, yesVotes: 0, noVotes: 0 });

  useEffect(() => {
    const fetchVoters = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/voting/poll-voters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollId }),
        });

        const data = await response.json();
        if (data.voters) {
          setVoters(data.voters);
          setStats({
            totalVoters: data.totalVoters,
            yesVotes: data.yesVotes,
            noVotes: data.noVotes
          });
        }
      } catch (error) {
        console.error('Error fetching voters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoters();
  }, [pollId]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Poll Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{pollTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVoters}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Voters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.yesVotes}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Yes Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.noVotes}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">No Votes</div>
          </div>
        </div>

        {/* Voters List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading voters...</div>
          ) : voters.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No votes yet</div>
          ) : (
            <div className="space-y-3">
              {voters.map((voter, index) => (
                <div 
                  key={`${voter.address}-${voter.timestamp}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      voter.vote === 'yes' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                    }`}>
                      {voter.vote === 'yes' ? '👍 Yes' : '👎 No'}
                    </div>
                    <div className="flex-1">
                      <a
                        href={`https://explorer.hiro.so/address/${voter.address}?chain=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {formatAddress(voter.address)}
                      </a>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(voter.timestamp)}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://explorer.hiro.so/txid/${voter.txId}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    View TX
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
