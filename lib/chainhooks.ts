// Browser-safe utilities for chainhooks
// Note: ChainhooksClient is server-side only, moved to API routes

const CONTRACT_ADDRESS = 'SP33Y8RCP74098JCSPW5QHHCD6QN4H3XS9DM3QXXX';
const CONTRACT_NAME = 'blonde-peach-tern';

/**
 * Contract event types we want to monitor
 */
export type ContractEventType = 
  | 'ft-mint'
  | 'ft-transfer'
  | 'nft-mint'
  | 'nft-transfer'
  | 'stx-transfer'
  | 'contract-call';

export interface ContractEvent {
  id: string;
  type: ContractEventType;
  timestamp: number;
  txId: string;
  sender: string;
  data: any;
}

// Remove all chainhook client functions - these are now in API routes
// The client uses Node.js modules and can't run in the browser

/**
 * Fetch recent contract transactions from Hiro API (browser-safe)
 */
export async function fetchContractTransactions(limit: number = 20): Promise<ContractEvent[]> {
  try {
    const response = await fetch(
      `https://api.hiro.so/extended/v1/address/${CONTRACT_ADDRESS}/transactions?limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform transactions into events
    const events: ContractEvent[] = data.results
      .filter((tx: any) => 
        tx.tx_status === 'success' && 
        (tx.tx_type === 'contract_call' || tx.tx_type === 'smart_contract')
      )
      .map((tx: any) => ({
        id: tx.tx_id,
        type: tx.tx_type === 'smart_contract' ? 'contract-call' : determineEventType(tx),
        timestamp: tx.burn_block_time,
        txId: tx.tx_id,
        sender: tx.sender_address,
        data: {
          functionName: tx.contract_call?.function_name,
          contractId: tx.smart_contract?.contract_id || tx.contract_call?.contract_id,
          blockHeight: tx.block_height,
          fee: tx.fee_rate,
        },
      }));
    
    return events;
  } catch (error) {
    console.error('Failed to fetch contract transactions:', error);
    return [];
  }
}

/**
 * Determine event type from transaction data
 */
function determineEventType(tx: any): ContractEventType {
  const functionName = tx.contract_call?.function_name?.toLowerCase();
  
  if (functionName?.includes('mint') && functionName.includes('ft')) return 'ft-mint';
  if (functionName?.includes('transfer') && functionName.includes('ft')) return 'ft-transfer';
  if (functionName?.includes('mint') && functionName.includes('nft')) return 'nft-mint';
  if (functionName?.includes('transfer') && functionName.includes('nft')) return 'nft-transfer';
  if (functionName?.includes('stx-transfer')) return 'stx-transfer';
  
  return 'contract-call';
}

/**
 * Stream contract events using polling (fallback when webhooks aren't available)
 */
export function createEventStream(
  onEvent: (event: ContractEvent) => void,
  intervalMs: number = 10000
): () => void {
  let lastTxId: string | null = null;
  
  const pollEvents = async () => {
    try {
      const events = await fetchContractTransactions(10);
      
      for (const event of events) {
        if (lastTxId && event.id === lastTxId) break;
        onEvent(event);
      }
      
      if (events.length > 0) {
        lastTxId = events[0].id;
      }
    } catch (error) {
      console.error('Error polling events:', error);
    }
  };
  
  // Initial poll
  pollEvents();
  
  // Set up interval
  const intervalId = setInterval(pollEvents, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}
