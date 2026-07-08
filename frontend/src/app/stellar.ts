import { Contract, Horizon, rpc, TransactionBuilder, Networks } from '@stellar/stellar-sdk';

// Testnet RPC and Horizon server endpoints configuration
const RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const CONTRACT_ID = 'C...'; // Place your deployed contract ID later here

const server = new rpc.Server(RPC_URL);

// Function to check if Freighter Wallet is installed in browser profile
export async function connectWallet(): Promise<string> {
  const { wallet } = window as any;
  if (!wallet) {
    throw new Error('Freighter Wallet extension not detected.');
  }
  
  try {
    // Requests user public address key profile
    const allowed = await wallet.isAllowed();
    if (!allowed) {
      await wallet.setAllowed();
    }
    const { address } = await wallet.getAddress();
    return address;
  } catch (err) {
    throw new Error('User rejected wallet configuration connection.');
  }
}

// Build transaction payload wrapper for Soroban registry invocation
export async function submitAuditToRegistry(
  devAddress: str,
  contractHash: str,
  score: number,
  bugs: number
): Promise<any> {
  const { wallet } = window as any;
  if (!wallet) throw new Error('Freighter wallet required.');

  // Create contract interface mapping pointer instance
  const contract = new Contract(CONTRACT_ID);

  // Convert hex string hash representation to raw byte buffers parameters arrays
  const cleanHash = contractHash.startsWith('0x') ? contractHash.slice(2) : contractHash;
  const hashBytes = Buffer.from(cleanHash, 'hex');

  // Format contract arguments array matches Rust Soroban expected structures types
  const txContext = contract.call(
    'register_audit',
    ...[
      // Maps to: developer, contract_hash, score, bugs, auditor string
      rpc.Parser.addressToVal(devAddress),
      rpc.Parser.bytesToVal(hashBytes),
      rpc.Parser.u32ToVal(score),
      rpc.Parser.u32ToVal(bugs),
      rpc.Parser.stringToVal("StellarShield_AI_v1")
    ]
  );

  // Retrieve current account sequence state metadata logs using Horizon backend APIs
  const accountResponse = await fetch(`${HORIZON_URL}/accounts/${devAddress}`);
  const accountData = await accountResponse.json();
  const sourceAccount = new Horizon.AccountResponse(accountData);

  // Package standard ledger execution transaction matrix arrays blocks framework
  const tx = new TransactionBuilder(sourceAccount, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(txContext)
    .setTimeout(30)
    .build();

  // Route transaction payload to browser extension window to prompt signature keys
  const signedXDR = await wallet.signTransaction({
    xdr: tx.toXDR(),
    network: 'TESTNET',
  });

  // Submit compiled signed sequence straight into Stellar network ledger streams
  const sendResponse = await server.sendTransaction(new rpc.Transaction(signedXDR));
  return sendResponse;
}