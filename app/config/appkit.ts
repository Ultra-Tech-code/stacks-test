'use client'

import type { CustomCaipNetwork } from '@reown/appkit-common'
import { UniversalConnector } from '@reown/appkit-universal-connector'

// Project ID from Reown dashboard
export const projectId = '20756fc0c561a6678393ec547de8cf1f'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Configure Stacks Testnet network
const stacksTestnet: CustomCaipNetwork<'stacks'> = {
  id: 2147483648, // Stacks testnet chain ID
  chainNamespace: 'stacks' as const,
  caipNetworkId: 'stacks:testnet',
  name: 'Stacks Testnet',
  nativeCurrency: { name: 'STX', symbol: 'STX', decimals: 6 },
  rpcUrls: { default: { http: ['https://api.testnet.hiro.so'] } }
}

// Configure Stacks Mainnet network
const stacksMainnet: CustomCaipNetwork<'stacks'> = {
  id: 1, // Stacks mainnet chain ID
  chainNamespace: 'stacks' as const,
  caipNetworkId: 'stacks:mainnet',
  name: 'Stacks',
  nativeCurrency: { name: 'STX', symbol: 'STX', decimals: 6 },
  rpcUrls: { default: { http: ['https://api.hiro.so'] } }
}

let universalConnectorInstance: Awaited<ReturnType<typeof UniversalConnector.init>> | null = null

export async function getUniversalConnector() {
  if (universalConnectorInstance) {
    return universalConnectorInstance
  }

  universalConnectorInstance = await UniversalConnector.init({
    projectId,
    metadata: {
      name: 'Stacks Voting DApp',
      description: 'Decentralized voting application on Stacks blockchain',
      url: 'https://stacksvote.vercel.app',
      icons: ['https://stacksvote.vercel.app/icon.png']
    },
    networks: [
      {
        methods: [
          'stx_getAddresses',
          'stx_transferStx',
          'stx_signTransaction',
          'stx_signMessage',
          'stx_callContract'
        ],
        chains: [stacksTestnet as CustomCaipNetwork, stacksMainnet as CustomCaipNetwork],
        events: [],
        namespace: 'stacks'
      }
    ]
  })

  return universalConnectorInstance
}
