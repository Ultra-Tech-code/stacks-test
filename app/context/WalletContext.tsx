'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react'
import '../config/appkit'

// Wallet Context type
interface WalletContextType {
  address: string | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect: appKitDisconnect } = useDisconnect()

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  const connect = () => {
    open()
  }

  const disconnect = async () => {
    try {
      await appKitDisconnect()
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  }

  if (!mounted) {
    return (
      <WalletContext.Provider
        value={{
          address: null,
          isConnected: false,
          connect: () => {},
          disconnect: async () => {}
        }}
      >
        {children}
      </WalletContext.Provider>
    )
  }

  return (
    <WalletContext.Provider
      value={{
        address: address || null,
        isConnected: isConnected || false,
        connect,
        disconnect
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

// Hook to use the wallet context
export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}