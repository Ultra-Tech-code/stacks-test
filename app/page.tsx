'use client';

import { useState } from 'react';
import { useWallet } from './context/WalletContext';
import WalletConnectButton from './components/WalletConnectButton';
import EventMonitor from './components/EventMonitor';
import Link from 'next/link';

export default function Home() {
  const { address, isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <main className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex justify-between items-center">
          <Link 
            href="/voting" 
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            🗳️ Go to Voting DApp
          </Link>
          
          <WalletConnectButton />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Stacks Voting DApp</h1>
          <p className="text-gray-600 dark:text-gray-300">Decentralized voting application on Stacks blockchain</p>
        </div>

        {/* Wallet Connection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Wallet Status</h2>
            {isConnected && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium dark:bg-green-900 dark:text-green-100">
                Connected
              </span>
            )}
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Connected Address</p>
                <p className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded break-all text-gray-900 dark:text-gray-100">
                  {address}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ✅ Your wallet is connected and ready to interact with smart contracts
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Connect your Stacks wallet to start creating and voting on polls.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Make sure you have Leather, Xverse, or another Stacks-compatible wallet installed
              </p>
            </div>
          )}
        </div>

        {/* Features Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Features</h2>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Create polls with custom titles, descriptions, and duration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Vote Yes or No on active polls</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Real-time updates via WebSocket connection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>End polls when they reach their expiration block</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>View detailed poll results and voter information</span>
            </li>
          </ul>
        </div>

        {/* Contract Info */}
        {isConnected && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contract Information</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Contract Address: </span>
                <span className="font-mono text-gray-600 dark:text-gray-400">SP33Y8RCP74098JCSPW5QHHCD6QN4H3XS9DM3QXXX</span>
              </p>
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Contract Name: </span>
                <span className="font-mono text-gray-600 dark:text-gray-400">Blackadam-Voting-Contract</span>
              </p>
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Network: </span>
                <span className="font-mono text-gray-600 dark:text-gray-400">Stacks Testnet</span>
              </p>
            </div>
          </div>
        )}

        {/* Event Monitor - Hiro Chainhooks */}
        {isConnected && <EventMonitor />}
      </main>
    </div>
  );
}
