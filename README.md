# Stacks Voting DApp

A decentralized voting application built with Next.js that interacts with a Clarity smart contract on the Stacks Testnet. This DApp enables users to create polls, cast votes, and view results in real-time using WebSocket updates.

🚀 **Live Demo**: [https://stacksvote.vercel.app](https://stacksvote.vercel.app)

## 🌟 Features

- **Wallet Integration**: Connect with Leather or Xverse wallet extensions
- **Poll Creation**: Create on-chain polls with customizable duration
- **Voting System**: Cast Yes/No votes on active polls
- **Real-time Updates**: WebSocket integration for live poll updates
- **Vote Tracking**: Automatic detection of user's voting history from on-chain data
- **Poll Management**: Poll creators can end their polls early
- **Vote Analytics**: Visual progress bars and percentage breakdowns
- **Responsive Design**: Modern, mobile-friendly interface with dark mode support
- **Smart Caching**: Server-side caching to prevent API rate limits

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Stacks wallet extension:
  - [Leather Wallet](https://leather.io/) (recommended)
  - [Xverse Wallet](https://www.xverse.app/)
- Some testnet STX for transaction fees (get from [Stacks Testnet Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet))

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ultra-Tech-code/stacks-test.git
cd stacks-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Configuration

### Contract Details

The voting contract is deployed on Stacks Testnet:
- **Contract Address**: `ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G`
- **Contract Name**: `Blackadam-vote-contract`

Configuration is located in `app/context/VotingContext.tsx`:

```typescript
const CONTRACT_ADDRESS = 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G';
const CONTRACT_NAME = 'Blackadam-vote-contract';
const NETWORK = STACKS_TESTNET;
```

## 📖 Usage

### Creating a Poll

1. Connect your wallet using the "Connect Wallet" button
2. Fill in the poll details:
   - **Title**: Poll question (max 256 characters)
   - **Description**: Additional context (max 1024 characters)
   - **Duration**: Length in days (automatically converts to blocks: 1 day = 144 blocks)
3. Click "Create" and approve the transaction in your wallet

### Voting on a Poll

1. Browse active polls in the "Polls" section
2. Click "👍 Yes" or "👎 No" on any active poll
3. Approve the transaction in your wallet
4. The poll updates automatically via WebSocket when your vote is confirmed

### Ending a Poll

Poll creators can end their polls before the duration expires:
1. Find your poll (shows "End" button only for your polls)
2. Click "End" and confirm
3. The poll status changes to "Ended"

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 with dark mode support
- **Blockchain**: Stacks SDK (@stacks/connect, @stacks/transactions)
- **Real-time**: WebSocket (@stacks/blockchain-api-client)
- **API**: Next.js API Routes with server-side caching

### Key Components

- **`app/components/VotingDApp.tsx`**: Main voting interface
- **`app/context/VotingContext.tsx`**: Contract interaction logic
- **`app/context/WalletContext.tsx`**: Wallet connection management
- **`app/hooks/useStacksWebSocket.ts`**: WebSocket integration for live updates
- **`app/api/voting/`**: API routes for fetching polls and vote history

### API Endpoints

- **`POST /api/voting/all-polls`**: Fetch all polls (batched, server-side)
- **`POST /api/voting/user-votes`**: Get user's voting history
- **`POST /api/voting/clear-cache`**: Cache invalidation

### Smart Contract Functions

- **`create-poll`**: Create a new poll with title, description, and duration
- **`vote`**: Cast a vote (Yes/No) on a poll
- **`end-poll`**: End an active poll (creator only)
- **`get-poll`**: Read poll data by ID
- **`get-poll-count`**: Get total number of polls

## 🔄 Real-time Updates

The app uses WebSocket to listen for contract events:
- Automatically refreshes polls when transactions occur
- Updates vote counts in real-time
- No polling required - fully event-driven

## 💾 Data Persistence

- **Vote History**: Fetched from on-chain transaction history
- **Poll Data**: Retrieved from contract storage
- **Caching**: 30-second server-side cache to prevent rate limits

## 🎨 UI Features

- Live WebSocket connection indicator
- Visual vote progress bars with percentages
- Disabled state for already-voted polls
- Transaction status notifications
- Loading states for all async operations
- Responsive layout for mobile/desktop

## 🛠️ Development

### Project Structure

```
app/
├── components/
│   └── VotingDApp.tsx          # Main voting UI
├── context/
│   ├── VotingContext.tsx       # Contract interactions
│   └── WalletContext.tsx       # Wallet connection
├── hooks/
│   └── useStacksWebSocket.ts   # WebSocket hook
├── api/
│   └── voting/
│       ├── all-polls/          # Batch poll fetcher
│       ├── user-votes/         # Vote history
│       └── clear-cache/        # Cache management
├── voting/
│   └── page.tsx                # Voting page route
└── page.tsx                    # Homepage
```

### Build for Production

```bash
npm run build
npm start
```

## 🔍 Troubleshooting

### Wallet Connection Issues
- Ensure you have a Stacks wallet extension installed
- Check that you're on Testnet mode in your wallet
- Clear browser cache and reconnect

### Transaction Failures
- Verify you have enough testnet STX for fees
- Check that the poll hasn't already ended
- Make sure you haven't already voted on the poll

### Polls Not Loading
- Refresh the page
- Click the "🔄 Load Polls" button
- Check browser console for errors

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- **Live Demo**: [https://stacksvote.vercel.app](https://stacksvote.vercel.app)
- **GitHub Repository**: [https://github.com/Ultra-Tech-code/stacks-test](https://github.com/Ultra-Tech-code/stacks-test)
- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language](https://book.clarity-lang.org/)
- [Hiro Platform](https://platform.hiro.so/)
- [Testnet Explorer](https://explorer.hiro.so/?chain=testnet)
- **Network**: @stacks/network
- **Transactions**: @stacks/transactions
- **Event Monitoring**: @hirosystems/chainhooks-client
- **HTTP Client**: undici

## 📡 Hiro Chainhooks Integration

This project integrates **Hiro Chainhooks** for real-time blockchain event monitoring:

### Features:
- **Live Event Feed**: Real-time display of contract events (FT mints, NFT transfers, contract calls, etc.)
- **Automatic Polling**: Fetches latest transactions every 15 seconds when monitoring is active
- **Event History**: Shows last 50 contract events with detailed information
- **Hiro API Integration**: Connects to Hiro's testnet API for reliable data
- **Webhook Support**: API endpoint ready to receive chainhook notifications

### Event Monitor:
The EventMonitor component displays:
- 🪙 Fungible token events (mint/transfer)
- 🎨 NFT events (mint/transfer)
- 💰 STX transfer operations
- 📞 Contract function calls
- Transaction details with explorer links

### Chainhook Manager (Advanced):
Optional component (`app/components/ChainhookManager.tsx`) for managing chainhooks:
- Register new chainhooks for specific events
- Monitor FT, NFT, and print events
- Enable/disable/delete registered chainhooks
- Check Hiro API status

## 📁 Project Structure

```
stacks-frontend/
├── app/
│   ├── api/
│   │   └── chainhooks/
│   │       └── webhook/
│   │           └── route.ts        # Webhook endpoint for chainhook events
│   ├── components/
│   │   ├── EventMonitor.tsx        # Real-time event monitor UI
│   │   └── ChainhookManager.tsx    # Chainhook management interface
│   ├── context/
│   │   └── WalletContext.tsx       # Wallet provider & contract functions
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout with providers
│   └── page.tsx                    # Main UI page
├── lib/
│   └── chainhooks.ts               # Chainhook utilities & Hiro API client
├── public/                         # Static assets
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🔐 Wallet Connection

1. Click "Connect Wallet" button
2. Select your wallet extension (Leather/Xverse)
3. Approve the connection request
4. Your address will be displayed once connected

The wallet connection persists across page refreshes.

## 🧪 Testing Contract Functions

1. **Connect your wallet** first
2. **Ensure you have testnet STX** for gas fees
3. **Fill in required inputs** (for set-value and get-value functions)
4. **Click the function button** to initiate the transaction
5. **Approve the transaction** in your wallet popup
6. **Wait for confirmation** on the blockchain

## 🌐 Network Information

- **Network**: Stacks Testnet
- **Contract Address**: `ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G`
- **Contract Name**: `blonde-peach-tern`
- **Explorer**: [Stacks Testnet Explorer](https://explorer.hiro.so/?chain=testnet)

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 📚 Learn More

- [Stacks Documentation](https://docs.stacks.co/)
- [Stacks.js Documentation](https://stacks.js.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clarity Language Reference](https://docs.stacks.co/clarity)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.
