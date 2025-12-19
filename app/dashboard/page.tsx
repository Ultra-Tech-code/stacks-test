'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon, ArrowPathIcon, ChartBarIcon, CurrencyDollarIcon, UserGroupIcon, CubeIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { 
    address, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    callGetValue,
    loading,
    error,
    success
  } = useWallet();

  const [stats, setStats] = useState({
    totalTransactions: 0,
    activeUsers: 0,
    totalValue: 0,
    avgBlockTime: 0
  });

  useEffect(() => {
    // Simulate fetching stats
    const fetchStats = async () => {
      // In a real app, you would fetch these from your blockchain or API
      setStats({
        totalTransactions: 1245,
        activeUsers: 342,
        totalValue: 12450.75,
        avgBlockTime: 10.2
      });
    };

    fetchStats();
  }, []);

  interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }: StatCardProps) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/50 text-${color}-600 dark:text-${color}-400`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {typeof value === 'number' && title.includes('Value')
              ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stacks Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Back to App
            </Link>
            {isConnected ? (
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Disconnect Wallet
              </button>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Welcome to Stacks Dashboard</h2>
                <p className="mt-2 text-blue-100 max-w-2xl">
                  Monitor your Stacks blockchain activity, view statistics, and manage your assets in one place.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <Link
                  href="/voting"
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-700 font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
                >
                  Go to Voting DApp
                  <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Transactions" 
            value={stats.totalTransactions} 
            icon={CubeIcon} 
            color="blue" 
          />
          <StatCard 
            title="Active Users" 
            value={stats.activeUsers} 
            icon={UserGroupIcon} 
            color="green" 
          />
          <StatCard 
            title="Total Value Locked" 
            value={stats.totalValue} 
            icon={CurrencyDollarIcon} 
            color="purple" 
          />
          <StatCard 
            title="Avg. Block Time" 
            value={`${stats.avgBlockTime}s`} 
            icon={ClockIcon} 
            color="yellow" 
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                      <CubeIcon className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Transaction #{123456 + item}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">+0.5 STX</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Confirmed</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                View all activity
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <ArrowPathIcon className="h-6 w-6" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Refresh Data</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                <ChartBarIcon className="h-6 w-6" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">View Analytics</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Community</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 mt-12 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Stacks Dashboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
