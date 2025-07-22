# Thirdweb Wallet Creator & ERC-20 Deployer

A comprehensive TypeScript script that uses the Thirdweb API to create wallets using email addresses as identifiers and deploy ERC-20 token contracts.

## Features

- ✅ Create wallets using email authentication
- ✅ Deploy ERC-20 token contracts using [thirdweb's TokenERC20](https://thirdweb.com/thirdweb.eth/TokenERC20)
- ✅ Check transaction status by transaction ID
- ✅ Interactive CLI interface with token configuration
- ✅ Non-interactive mode support
- ✅ Transaction monitoring with watch mode
- ✅ Proper error handling and validation
- ✅ TypeScript support with full type definitions
- ✅ Environment-based configuration
- ✅ Wallet and contract information export
- ✅ Secure token handling
- ✅ Multi-chain support

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Thirdweb API key (Secret Key)

## Installation

1. Clone or download this project
2. Install dependencies:

```bash
npm install
```

3. Create environment configuration:

```bash
cp src/env.example .env
```

4. Edit `.env` file with your Thirdweb API key:

```env
THIRDWEB_API_KEY=your_actual_secret_key_here
THIRDWEB_BASE_URL=https://api.thirdweb-dev.com
DEFAULT_CHAIN_ID=1
```

⚠️ **Important**: Use your **Secret Key** (not Client ID) for the `THIRDWEB_API_KEY`.

## Usage

### Interactive Mode

Run the script in interactive mode where you'll be prompted for all inputs:

```bash
npm run dev
```

This will:
1. Prompt you for an email address
2. Send a login code to the email
3. Prompt you to enter the OTP code
4. Create the wallet and display the results
5. Ask if you want to deploy an ERC-20 contract
6. If yes, prompt for token details (name, symbol, description, etc.)
7. Deploy the contract and display results

### Non-Interactive Mode

You can also provide the email via command line arguments:

```bash
npm run dev -- --email user@example.com
```

### Check Transaction Status

Check the status of any transaction using its transaction ID:

```bash
# Single status check
npm run check-tx abc123-def456-ghi789

# Watch mode (polls every 5 seconds until completion)
npm run check-tx abc123-def456-ghi789 --watch
```

### Build and Run

To build the TypeScript project:

```bash
npm run build
npm start
```

## Token Configuration

When deploying an ERC-20 contract, you'll be prompted for:

- **Token Name**: The full name of your token (e.g., "My Custom Token")
- **Token Symbol**: The symbol/ticker (e.g., "MCT")
- **Token Description**: A description of your token's purpose
- **Decimals**: Number of decimal places (default: 18)
- **Initial Supply**: Starting token supply (default: 0)

## API Reference

### ThirdwebClient

The main client class for interacting with the Thirdweb API.

#### Constructor

```typescript
const client = new ThirdwebClient({
  apiKey: 'your-secret-key',
  baseUrl: 'https://api.thirdweb-dev.com',
  chainId: 1 // optional
});
```

#### Methods

##### `sendLoginCode(email)`

Sends an OTP code to the specified email address.

```typescript
const response = await client.sendLoginCode('user@example.com');
```

##### `verifyLoginCode(email, code)`

Verifies the OTP code and returns wallet information.

```typescript
const response = await client.verifyLoginCode('user@example.com', '123456');
```

##### `createWalletWithEmail(email, getOtpCode)`

Complete wallet creation flow - sends code, gets OTP from user, and verifies.

```typescript
const walletInfo = await client.createWalletWithEmail(
  'user@example.com',
  async () => {
    // Function that returns the OTP code
    return await getUserInput();
  }
);
```

##### `deployERC20Contract(walletAddress, tokenMetadata, chainId?)`

Deploy an ERC-20 token contract using the authenticated wallet.

```typescript
const contractInfo = await client.deployERC20Contract(
  walletAddress,
  {
    name: 'My Token',
    symbol: 'MTK',
    description: 'A custom token',
    decimals: 18,
    initialSupply: '1000000'
  },
  1 // Ethereum mainnet
);
```

### TransactionChecker

A standalone utility for checking transaction status.

#### Constructor

```typescript
const checker = new TransactionChecker(apiKey, baseUrl);
```

#### Methods

##### `checkTransactionStatus(transactionId)`

Check the status of a transaction by its ID.

```typescript
const status = await checker.checkTransactionStatus('abc123-def456-ghi789');
```

## Types

### WalletInfo

```typescript
interface WalletInfo {
  address: string;        // Wallet address
  email: string;          // Associated email
  created_at?: string;    // Creation timestamp
  chain_id?: number;      // Blockchain chain ID
  isNewUser?: boolean;    // Whether this is a new user
  token?: string;         // Authentication token
}
```

### TokenMetadata

```typescript
interface TokenMetadata {
  name: string;           // Token name
  symbol: string;         // Token symbol
  description: string;    // Token description
  decimals?: number;      // Decimal places (default: 18)
  initialSupply?: string; // Initial supply (default: 0)
}
```

### ContractInfo

```typescript
interface ContractInfo {
  contractAddress: string;    // Deployed contract address
  transactionId?: string;     // Deployment transaction ID
  chainId: number;           // Blockchain chain ID
  deployer: string;          // Deployer wallet address
  tokenName: string;         // Token name
  tokenSymbol: string;       // Token symbol
  tokenDescription: string;  // Token description
  deployed_at: string;       // Deployment timestamp
}
```

## Error Handling

The script includes comprehensive error handling:

- **Network errors**: Timeout and connection issues
- **API errors**: Invalid credentials, rate limiting, etc.
- **Validation errors**: Invalid email format, missing OTP, invalid token metadata
- **Authentication errors**: Invalid or expired OTP codes
- **Contract deployment errors**: Gas issues, network problems, invalid parameters
- **Transaction not found**: Invalid transaction IDs or unindexed transactions

Errors are logged with details and appropriate exit codes for automation.

## CLI Options

### Wallet Creator & Deployer

```bash
npm run dev -- [options]

Options:
  --email <email>     Email address for wallet creation
  --help, -h          Show help message
```

### Transaction Checker

```bash
npm run check-tx <transaction-id> [options]

Options:
  --watch, -w         Watch transaction until completion
  --help, -h          Show help message
```

## Examples

### Basic Usage with Contract Deployment

```typescript
import { ThirdwebClient } from './src/thirdweb-client';

const client = new ThirdwebClient({
  apiKey: process.env.THIRDWEB_API_KEY!,
  baseUrl: 'https://api.thirdweb-dev.com'
});

// Create wallet
const wallet = await client.createWalletWithEmail(
  'user@example.com',
  async () => prompt('Enter OTP: ')
);

// Deploy ERC-20 contract
const contract = await client.deployERC20Contract(
  wallet.address,
  {
    name: 'My Custom Token',
    symbol: 'MCT',
    description: 'A token for my project',
    decimals: 18,
    initialSupply: '1000000'
  }
);

console.log('Contract Address:', contract.contractAddress);
```

### Transaction Status Checking

```typescript
import { TransactionChecker } from './src/check-transaction';

const checker = new TransactionChecker(
  process.env.THIRDWEB_API_KEY!,
  'https://api.thirdweb-dev.com'
);

const status = await checker.checkTransactionStatus('your-transaction-id');
console.log('Status:', status.result.status);
```

### Multi-Chain Deployment

```typescript
// Deploy on Polygon
const polygonContract = await client.deployERC20Contract(
  wallet.address,
  tokenMetadata,
  137 // Polygon chain ID
);

// Deploy on Ethereum
const ethereumContract = await client.deployERC20Contract(
  wallet.address,
  tokenMetadata,
  1 // Ethereum mainnet
);
```

## Output

### Successful Wallet Creation and Contract Deployment

```
✅ Wallet created successfully!
================================
📧 Email: user@example.com
🏦 Wallet Address: 0x1234567890123456789012345678901234567890
👤 New User: Yes
🕐 Created At: 2024-01-01T12:00:00.000Z
⛓️  Chain ID: 1
================================

🎉 ERC-20 Contract deployed successfully!
==========================================
🪙 Token Name: My Custom Token
🔤 Token Symbol: MCT
📝 Description: A custom ERC-20 token
📄 Contract Address: 0xabcdef1234567890abcdef1234567890abcdef12
🔗 Transaction ID: abc123-def456-ghi789
⛓️  Chain ID: 1
👤 Deployer: 0x1234567890123456789012345678901234567890
🕐 Deployed At: 2024-01-01T12:05:00.000Z
==========================================
```

### Transaction Status Output

```
📊 Transaction Status
====================
✅ Status: COMPLETED
🆔 Transaction ID: abc123-def456-ghi789
⛓️  Chain ID: 1
📤 From: 0x1234567890123456789012345678901234567890
📄 Contract Address: 0xabcdef1234567890abcdef1234567890abcdef12
🔗 Transaction Hash: 0x987654321098765432109876543210987654321098765432109876543210
🧱 Block Number: 18500000
⛽ Gas Used: 2500000
💰 Gas Price: 25000000000
🕐 Created At: 1/1/2024, 12:05:30 PM
🔄 Updated At: 1/1/2024, 12:06:15 PM
====================
```

## Supported Networks

The script supports deployment on any EVM-compatible network supported by thirdweb:

- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Base** (Chain ID: 8453)
- **Avalanche** (Chain ID: 43114)
- **BSC** (Chain ID: 56)
- And many more...

## Troubleshooting

### Common Issues

1. **`x-secret-key or x-client-id header required`**: 
   - Ensure you're using your **Secret Key** (not Client ID) for `THIRDWEB_API_KEY`
   - Verify the API key is correctly set in your `.env` file

2. **Contract deployment fails**: 
   - Check that the wallet has sufficient funds for gas fees
   - Verify the chain ID is correct
   - Ensure token metadata is valid

3. **Transaction not found**: 
   - Verify the transaction ID is correct
   - The transaction may not be indexed yet (try again in a few seconds)
   - Make sure you're checking the right network

4. **Network Issues**: Check your internet connection and API endpoint

5. **Email Not Received**: Check spam folder, verify email address

6. **Invalid OTP**: Ensure you're entering the correct 6-digit code

### Debug Mode

Set environment variable for verbose logging:

```bash
DEBUG=1 npm run dev
DEBUG=1 npm run check-tx your-transaction-id
```

## API Endpoints Used

- `POST /v1/wallets/login/code` - Send login code
- `POST /v1/wallets/login/code/verify` - Verify login code
- `POST /v1/contracts` - Deploy ERC-20 contract
- `GET /v1/contracts/{address}` - Get contract information
- `GET /v1/transactions/{transactionId}` - Get transaction status

## Smart Contract Details

This script deploys the [thirdweb TokenERC20 contract](https://thirdweb.com/thirdweb.eth/TokenERC20), which is:

- **ERC-20 Compliant**: Fully compatible with the ERC-20 standard
- **Audited**: Security audited and battle-tested
- **Feature Rich**: Includes minting, burning, and governance features
- **Gas Optimized**: Optimized for minimal gas consumption

## Security Notes

- Never commit your `.env` file with real API keys
- Use environment variables in production
- The OTP codes expire after a few minutes
- Each OTP can only be used once
- Authentication tokens are truncated when saved to files
- Contract deployment requires gas fees

## License

MIT License - see LICENSE file for details. 