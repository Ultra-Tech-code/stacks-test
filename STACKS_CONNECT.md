# Stacks Connect Integration for Stacks Blockchain

This project implements wallet integration for the Stacks blockchain using the native `@stacks/connect` library.

## Features

✅ **Stacks Connect Integration** - Official Stacks wallet connection
✅ **Stacks Blockchain Support** - Full support for Stacks mainnet and testnet
✅ **TypeScript Support** - Full type safety
✅ **Real-time Updates** - WebSocket integration for live blockchain events
✅ **Voting DApp** - Complete decentralized voting application

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Architecture

### Core Files

#### `/app/config/appkit.ts`
- Configures Stacks network settings
- Defines app metadata
- Exports contract constants

#### `/app/context/WalletContext.tsx`
- React Context for wallet state management
- Uses `@stacks/connect` for wallet authentication
- Handles wallet connection/disconnection
- Manages user session

#### `/app/context/VotingContext.tsx`
- Manages voting functionality
- Integrates with `@stacks/connect` for contract calls
- Handles poll creation, voting, and poll ending

### Components

- **WalletConnectButton** - Reusable wallet connection button
- **VotingDApp** - Main voting interface
- **EventMonitor** - Monitors blockchain events via Hiro Chainhooks
- **PollCountdown** - Real-time countdown for polls
- **PollDetailsModal** - Detailed poll information

## Wallet Connection

The app uses Stacks Connect, which supports:
- **Leather Wallet** (Recommended)
- **Xverse Wallet**
- Any Stacks-compatible wallet

## Smart Contract

### Deployed Contract
- **Address**: `ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G`
- **Name**: `Blackadam-vote-contract`
- **Network**: Stacks Testnet

### Contract Functions

1. **create-poll** - Create a new poll
   - Parameters: title (string), description (string), duration (uint)
   
2. **vote** - Vote on a poll
   - Parameters: poll-id (uint), vote-yes (bool)
   
3. **end-poll** - End an active poll
   - Parameters: poll-id (uint)


## Usage Examples

### Connecting Wallet

```typescript
import { useWallet } from './context/WalletContext'

function MyComponent() {
  const { connect, isConnected, address } = useWallet()

  const handleConnect = async () => {
    await connect()
  }

  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

### Calling Smart Contracts

The app uses `@stacks/connect` for contract interactions. See `VotingContext.tsx` for examples:

```typescript
import { openContractCall } from '@stacks/connect'
import { uintCV, boolCV } from '@stacks/transactions'

await openContractCall({
  contractAddress: 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G',
  contractName: 'Blackadam-vote-contract',
  functionName: 'vote',
  functionArgs: [uintCV(pollId), boolCV(voteYes)],
  network: STACKS_TESTNET,
  onFinish: (data) => {
    console.log('Transaction:', data.txId)
  },
})
```

## Network Configuration

Stacks Testnet and Mainnet are configured using the official `@stacks/network` package:

```typescript
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network'

export const stacksTestnet = STACKS_TESTNET
export const stacksMainnet = STACKS_MAINNET
```

## Supported Wallets

- **Leather Wallet** (Recommended)
- **Xverse Wallet**
- Any Stacks-compatible wallet

## WebSocket Integration

Real-time blockchain events are monitored using Hiro Chainhooks:
- Contract events
- Transaction confirmations
- Block updates

## API Routes

- `/api/voting/all-polls` - Fetch all polls
- `/api/voting/poll` - Get specific poll details
- `/api/voting/poll-count` - Get total poll count
- `/api/voting/poll-voters` - Get poll voters
- `/api/voting/user-votes` - Get user's votes
- `/api/chainhooks/webhook` - Chainhook event handler

## Resources

- [Stacks Connect Documentation](https://docs.stacks.co/build-apps/authentication)
- [Stacks Documentation](https://docs.stacks.co)
- [Hiro API Documentation](https://docs.hiro.so)
- [Stacks Transactions](https://docs.stacks.co/build-apps/transactions)

## License

MIT
