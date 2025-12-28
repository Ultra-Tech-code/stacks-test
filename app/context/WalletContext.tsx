'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { AppConfig, UserSession, showConnect } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'

// Wallet Context type
interface WalletContextType {
  address: string | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  userSession: UserSession | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
    
    // Check if user is already signed in
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData()
      setAddress(userData.profile.stxAddress.mainnet)
      setIsConnected(true)
    }
  }, [])

  const connect = () => {
    showConnect({
      appDetails: {
        name: 'Stacks Voting DApp',
        icon: window.location.origin + '/icon.png',
      },
      redirectTo: '/',
      onFinish: () => {
        const userData = userSession.loadUserData()
        setAddress(userData.profile.stxAddress.mainnet)
        setIsConnected(true)
      },
      userSession,
    })
  }

  const disconnect = async () => {
    userSession.signUserOut()
    setAddress(null)
    setIsConnected(false)
    window.location.reload()
  }

  if (!mounted) {
    return (
      <WalletContext.Provider
        value={{
          address: null,
          isConnected: false,
          connect: () => {},
          disconnect: async () => {},
          userSession: null
        }}
      >
        {children}
      </WalletContext.Provider>
    )
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        connect,
        disconnect,
        userSession
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