'use client'

import { createAppKit } from '@reown/appkit/react'
import type { CustomCaipNetwork } from '@reown/appkit-common'

// Project ID from Reown dashboard
export const projectId = '20756fc0c561a6678393ec547de8cf1f'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Define Stacks networks using CustomCaipNetwork format
export const stacksMainnet: CustomCaipNetwork<'stacks'> = {
  id: 1,
  chainNamespace: 'stacks' as const,
  caipNetworkId: 'stacks:mainnet',
  name: 'Stacks',
  nativeCurrency: {
    name: 'STX',
    symbol: 'STX',
    decimals: 6
  },
  rpcUrls: {
    default: { http: ['https://api.hiro.so'] }
  }
}

export const stacksTestnet: CustomCaipNetwork<'stacks'> = {
  id: 2147483648,
  chainNamespace: 'stacks' as const,
  caipNetworkId: 'stacks:testnet',
  name: 'Stacks Testnet',
  nativeCurrency: {
    name: 'STX',
    symbol: 'STX',
    decimals: 6
  },
  rpcUrls: {
    default: { http: ['https://api.testnet.hiro.so'] }
  }
}

// Metadata for AppKit
const metadata = {
  name: 'Stacks Voting DApp',
  description: 'Decentralized voting application on Stacks blockchain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://stacksvote.vercel.app',
  icons: ['https://stacksvote.vercel.app/icon.png']
}

// Create and configure AppKit
createAppKit({
  projectId,
  networks: [stacksMainnet as CustomCaipNetwork, stacksTestnet as CustomCaipNetwork],
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})