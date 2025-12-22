'use client';

import { useState, useEffect } from 'react';

interface PollCountdownProps {
  endBlock: number;
  isActive: boolean;
}

export default function PollCountdown({ endBlock, isActive }: PollCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [currentBlock, setCurrentBlock] = useState<number>(0);

  useEffect(() => {
    const fetchCurrentBlock = async () => {
      try {
        const response = await fetch('https://api.testnet.hiro.so/v2/info');
        const data = await response.json();
        setCurrentBlock(data.stacks_tip_height);
      } catch (error) {
        console.error('Error fetching current block:', error);
      }
    };

    fetchCurrentBlock();
    const interval = setInterval(fetchCurrentBlock, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentBlock === 0) {
      setTimeRemaining('');
      return;
    }

    const blocksRemaining = endBlock - currentBlock;
    
    if (blocksRemaining <= 0 || !isActive) {
      setTimeRemaining('');
      return;
    }

    // Stacks blocks are ~10 minutes on average
    const minutesRemaining = blocksRemaining * 10;
    const days = Math.floor(minutesRemaining / (60 * 24));
    const hours = Math.floor((minutesRemaining % (60 * 24)) / 60);
    const minutes = Math.floor(minutesRemaining % 60);

    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m`);
    } else {
      setTimeRemaining(`${minutes}m`);
    }
  }, [endBlock, currentBlock, isActive]);

  if (!isActive || !timeRemaining) {
    return null;
  }

  const blocksRemaining = endBlock - currentBlock;
  const isUrgent = blocksRemaining <= 14; // Less than ~2.5 hours

  return (
    <span className={`text-xs font-medium ${isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
      {isUrgent && '⏰ '}{timeRemaining} remaining
    </span>
  );
}
