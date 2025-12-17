'use client';

import { useState } from 'react';
import { useWallet } from './context/WalletContext';
import EventMonitor from './components/EventMonitor';
import Link from 'next/link';

export default function Home() {
  const { address, isConnected, connectWallet, disconnectWallet, callSetValue, callGetValue, callTestEventTypes, callTestEmitEvent, loading, error, success, clearMessages } = useWallet();
  
  const [setKey, setSetKey] = useState('');
  const [setValue, setSetValue] = useState('');
  const [getKey, setGetKey] = useState('');

  const handleSetValue = async () => {
    if (!setKey || !setValue) {
      alert('Please fill in both key and value');
      return;
    }
    await callSetValue(setKey, setValue);
  };

  const handleGetValue = async () => {
    if (!getKey) {
      alert('Please enter a key');
      return;
    }
    await callGetValue(getKey);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <main className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link 
            href="/voting" 
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            🗳️ Go to Voting DApp
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Stacks Contract Interaction</h1>
          <p className="text-gray-600 dark:text-gray-300">Interact with your deployed contract on Stacks Testnet</p>
        </div>

        {/* Wallet Connection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Wallet</h2>
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
              <button
                onClick={disconnectWallet}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={connectWallet}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Make sure you have Leather or Xverse wallet installed
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-100 px-4 py-3 rounded mb-8 relative">
            <button
              onClick={clearMessages}
              className="absolute top-2 right-2 text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100"
            >
              ✕
            </button>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-100 px-4 py-3 rounded mb-8 relative">
            <button
              onClick={clearMessages}
              className="absolute top-2 right-2 text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100"
            >
              ✕
            </button>
            <p className="font-medium">Success! ✓</p>
            <p className="text-sm break-all">{success}</p>
            <a
              href={`https://explorer.hiro.so/txid/${success.split('TX ID: ')[1]}?chain=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 dark:text-green-200 hover:underline mt-1 inline-block"
            >
              View in Explorer →
            </a>
          </div>
        )}

        {/* Contract Interaction Cards */}
        {isConnected ? (
          <div className="grid gap-8">
            {/* Store Value */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Set Value</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key (max 32 bytes)</label>
                  <input
                    type="text"
                    value={setKey}
                    onChange={(e) => setSetKey(e.target.value)}
                    placeholder="Enter key"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value (max 32 bytes)</label>
                  <input
                    type="text"
                    value={setValue}
                    onChange={(e) => setSetValue(e.target.value)}
                    placeholder="Enter value"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSetValue}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  {loading ? 'Processing...' : 'Set Value'}
                </button>
              </div>
            </div>

            {/* Get Value */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Get Value</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key</label>
                  <input
                    type="text"
                    value={getKey}
                    onChange={(e) => setGetKey(e.target.value)}
                    placeholder="Enter key to retrieve"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleGetValue}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  {loading ? 'Processing...' : 'Get Value'}
                </button>
              </div>
            </div>

            {/* Test Event Types */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Test Event Types</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Calls the test-event-types function which:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 list-disc list-inside space-y-1">
                <li>Mints 3 novel tokens to recipient</li>
                <li>Mints an NFT to recipient</li>
                <li>Transfers 60 STX</li>
                <li>Burns 20 STX</li>
              </ul>
              <button
                onClick={callTestEventTypes}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                {loading ? 'Processing...' : 'Execute Test Event Types'}
              </button>
            </div>

            {/* Test Emit Event */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Test Emit Event</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Calls the test-emit-event function which prints "Event! Hello world"
              </p>
              <button
                onClick={callTestEmitEvent}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                {loading ? 'Processing...' : 'Execute Emit Event'}
              </button>
            </div>

            {/* Contract Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contract Info</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Contract Address: </span>
                  <span className="font-mono text-gray-600 dark:text-gray-400">ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Contract Name: </span>
                  <span className="font-mono text-gray-600 dark:text-gray-400">blonde-peach-tern</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Network: </span>
                  <span className="font-mono text-gray-600 dark:text-gray-400">Stacks Testnet</span>
                </p>
              </div>
            </div>

            {/* Event Monitor - Hiro Chainhooks */}
            <EventMonitor />
          </div>
        ) : (
          // <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          //   <p className="text-gray-600 dark:text-gray-400 mb-4">Connect your wallet to start interacting with the contract</p>
          //   <button
          //     onClick={connectWallet}
          //     className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
          //   >
          //     Connect Wallet
          //   </button>
          // </div>
          null
        )}
      </main>
    </div>
  );
}
