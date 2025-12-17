'use client';

import { useWallet } from '../context/WalletContext';
import VotingDApp from '../components/VotingDApp';
import Link from 'next/link';

export default function VotingPage() {
  const { isConnected, address, connectWallet, disconnectWallet } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <div className="mb-8">
          <nav className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
            <div className="flex gap-4">
              <Link 
                href="/" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                ← Back to Main
              </Link>
            </div>
            
            {isConnected ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {address?.slice(0, 8)}...{address?.slice(-8)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center">
            🗳️ Decentralized Voting Platform
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            Create polls and vote on the Stacks blockchain
          </p>
        </div>

        {/* Main Content */}
        <VotingDApp />
      </div>
    </div>
  );
}
