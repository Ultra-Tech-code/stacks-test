'use client'

import { createAppKit } from '@reown/appkit/react'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import { bitcoin, bitcoinTestnet } from '@reown/appkit/networks'

// Project ID from Reown dashboard
const projectId = '20756fc0c561a6678393ec547de8cf1f'

// Set the networks (Bitcoin testnet for Stacks compatibility)
const networks = [bitcoinTestnet, bitcoin]

// Set up Bitcoin Adapter
const bitcoinAdapter = new BitcoinAdapter({
  projectId
})

// Metadata for the app
const metadata = {
  name: 'Stacks Voting DApp',
  description: 'Decentralized voting application on Stacks blockchain',
  url: 'https://stacksvote.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/181229932']
}

// Create AppKit modal
export const modal = createAppKit({
  adapters: [bitcoinAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})
