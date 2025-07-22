import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { ThirdwebClient } from './thirdweb-client';
import { ThirdwebConfig, WalletInfo, TokenMetadata, ContractInfo } from './types';

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Get OTP code from user input
 */
async function getOtpFromUser(): Promise<string> {
  const otp = await askQuestion('Enter the OTP code from your email: ');
  if (!otp || otp.length < 4) {
    console.log('Invalid OTP code. Please try again.');
    return getOtpFromUser();
  }
  return otp;
}

/**
 * Get token metadata from user input
 */
async function getTokenMetadata(): Promise<TokenMetadata> {
  console.log('\n🪙 Token Configuration');
  console.log('======================');
  
  const name = await askQuestion('Enter token name (e.g., "My Token"): ');
  if (!name) {
    console.log('Token name is required.');
    return getTokenMetadata();
  }

  const symbol = await askQuestion('Enter token symbol (e.g., "MTK"): ');
  if (!symbol) {
    console.log('Token symbol is required.');
    return getTokenMetadata();
  }

  const description = await askQuestion('Enter token description: ');
  if (!description) {
    console.log('Token description is required.');
    return getTokenMetadata();
  }

  const decimalsInput = await askQuestion('Enter token decimals (default: 18): ');
  const decimals = decimalsInput ? parseInt(decimalsInput) : 18;

  if (isNaN(decimals) || decimals < 0 || decimals > 18) {
    console.log('Invalid decimals. Using default value of 18.');
  }

  const initialSupplyInput = await askQuestion('Enter initial supply (default: 0): ');
  const initialSupply = initialSupplyInput || '0';

  return {
    name,
    symbol: symbol.toUpperCase(),
    description,
    decimals: isNaN(decimals) ? 18 : decimals,
    initialSupply
  };
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Main function to create wallet and deploy contract
 */
async function main() {
  try {
    console.log('🚀 Thirdweb Wallet Creator & ERC-20 Deployer');
    console.log('============================================\n');

    // Validate required environment variables
    const apiKey = process.env.THIRDWEB_API_KEY;
    const baseUrl = process.env.THIRDWEB_BASE_URL || 'https://api.thirdweb-dev.com';

    if (!apiKey) {
      console.error('❌ Error: THIRDWEB_API_KEY is required in environment variables');
      console.log('Please create a .env file based on src/env.example');
      process.exit(1);
    }

    // Initialize Thirdweb client
    const config: ThirdwebConfig = {
      apiKey,
      baseUrl,
      chainId: process.env.DEFAULT_CHAIN_ID ? parseInt(process.env.DEFAULT_CHAIN_ID) : 1
    };

    const client = new ThirdwebClient(config);

    // Get email from user
    const email = await askQuestion('Enter email address for wallet creation: ');

    if (!isValidEmail(email)) {
      console.error('❌ Invalid email format. Please try again.');
      rl.close();
      return;
    }

    console.log(`\n📧 Creating wallet for: ${email}`);

    // Create wallet
    console.log('\n🔄 Starting wallet creation process...');
    
    const walletInfo: WalletInfo = await client.createWalletWithEmail(
      email,
      getOtpFromUser
    );

    // Display wallet results
    console.log('\n✅ Wallet created successfully!');
    console.log('================================');
    console.log(`📧 Email: ${walletInfo.email}`);
    console.log(`🏦 Wallet Address: ${walletInfo.address}`);
    console.log(`👤 New User: ${walletInfo.isNewUser ? 'Yes' : 'No'}`);
    console.log(`🕐 Created At: ${walletInfo.created_at}`);
    if (walletInfo.chain_id) {
      console.log(`⛓️  Chain ID: ${walletInfo.chain_id}`);
    }
    console.log('================================\n');

    // Ask if user wants to deploy an ERC-20 contract
    const deployContract = await askQuestion('Would you like to deploy an ERC-20 token contract? (y/n): ');
    
    if (deployContract.toLowerCase() === 'y' || deployContract.toLowerCase() === 'yes') {
      // Get token metadata
      const tokenMetadata = await getTokenMetadata();

      // Deploy the contract
      console.log('\n🚀 Starting contract deployment...');
      const contractInfo: ContractInfo = await client.deployERC20Contract(
        walletInfo.address,
        tokenMetadata,
        walletInfo.chain_id
      );

      // Display contract results
      console.log('\n🎉 ERC-20 Contract deployed successfully!');
      console.log('==========================================');
      console.log(`🪙 Token Name: ${contractInfo.tokenName}`);
      console.log(`🔤 Token Symbol: ${contractInfo.tokenSymbol}`);
      console.log(`📝 Description: ${contractInfo.tokenDescription}`);
      console.log(`📄 Contract Address: ${contractInfo.contractAddress}`);
      if (contractInfo.transactionId) {
        console.log(`🔗 Transaction ID: ${contractInfo.transactionId}`);
      }
      console.log(`⛓️  Chain ID: ${contractInfo.chainId}`);
      console.log(`👤 Deployer: ${contractInfo.deployer}`);
      console.log(`🕐 Deployed At: ${contractInfo.deployed_at}`);
      console.log('==========================================\n');

      // Option to save complete info
      const saveToFile = await askQuestion('Save wallet and contract information to file? (y/n): ');
      if (saveToFile.toLowerCase() === 'y' || saveToFile.toLowerCase() === 'yes') {
        await saveCompleteInfo(walletInfo, contractInfo);
      }
    } else {
      // Option to save wallet info only
      const saveToFile = await askQuestion('Save wallet information to file? (y/n): ');
      if (saveToFile.toLowerCase() === 'y' || saveToFile.toLowerCase() === 'yes') {
        await saveWalletInfo(walletInfo);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    
    if (typeof error === 'object' && error !== null && 'status_code' in error) {
      const apiError = error as any;
      console.error(`Status: ${apiError.status_code}`);
      console.error(`Message: ${apiError.message}`);
    }
  } finally {
    rl.close();
  }
}

/**
 * Save wallet information to a JSON file
 */
async function saveWalletInfo(walletInfo: WalletInfo): Promise<void> {
  try {
    const fs = await import('fs/promises');
    // Create a safe copy without the full token for saving
    const safeWalletInfo = {
      ...walletInfo,
      token: walletInfo.token ? `${walletInfo.token.substring(0, 20)}...` : undefined
    };
    const filename = `wallet-${walletInfo.address.slice(0, 8)}-${Date.now()}.json`;
    
    await fs.writeFile(filename, JSON.stringify(safeWalletInfo, null, 2));
    console.log(`💾 Wallet information saved to: ${filename}`);
  } catch (error) {
    console.error('Error saving wallet info:', error);
  }
}

/**
 * Save complete wallet and contract information to a JSON file
 */
async function saveCompleteInfo(walletInfo: WalletInfo, contractInfo: ContractInfo): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const completeInfo = {
      wallet: {
        ...walletInfo,
        token: walletInfo.token ? `${walletInfo.token.substring(0, 20)}...` : undefined
      },
      contract: contractInfo
    };
    const filename = `deployment-${contractInfo.contractAddress.slice(0, 8)}-${Date.now()}.json`;
    
    await fs.writeFile(filename, JSON.stringify(completeInfo, null, 2));
    console.log(`💾 Complete deployment information saved to: ${filename}`);
  } catch (error) {
    console.error('Error saving complete info:', error);
  }
}

/**
 * Handle CLI arguments for non-interactive mode
 */
async function handleCliArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Thirdweb Wallet Creator & ERC-20 Deployer - Help
==================================================

Usage:
  npm run dev                     # Interactive mode
  npm run dev -- --email <email> # Non-interactive mode (you'll still need to enter OTP and token details)

Options:
  --email <email>     Email address for wallet creation
  --help, -h          Show this help message

Environment Variables:
  THIRDWEB_API_KEY     Your Thirdweb Secret Key (required)
  THIRDWEB_BASE_URL    Base URL for Thirdweb API (optional)
  DEFAULT_CHAIN_ID     Default chain ID (optional)

Examples:
  npm run dev
  npm run dev -- --email user@example.com

Features:
  • Create wallets using email authentication
  • Deploy ERC-20 token contracts
  • Interactive prompts for token configuration
  • Export wallet and contract information
`);
    process.exit(0);
  }

  const emailIndex = args.indexOf('--email');
  if (emailIndex !== -1 && emailIndex + 1 < args.length) {
    const email = args[emailIndex + 1];
    
    if (!isValidEmail(email)) {
      console.error('❌ Invalid email format provided');
      process.exit(1);
    }

    await runNonInteractive(email);
    return;
  }

  // Default to interactive mode
  await main();
}

/**
 * Non-interactive mode (still needs OTP input and token details)
 */
async function runNonInteractive(email: string) {
  try {
    const apiKey = process.env.THIRDWEB_API_KEY;
    const baseUrl = process.env.THIRDWEB_BASE_URL || 'https://api.thirdweb-dev.com';

    if (!apiKey) {
      console.error('❌ Error: THIRDWEB_API_KEY is required');
      process.exit(1);
    }

    const config: ThirdwebConfig = {
      apiKey,
      baseUrl,
      chainId: process.env.DEFAULT_CHAIN_ID ? parseInt(process.env.DEFAULT_CHAIN_ID) : 1
    };

    const client = new ThirdwebClient(config);

    console.log(`📧 Creating wallet for: ${email}`);
    
    const walletInfo = await client.createWalletWithEmail(
      email,
      getOtpFromUser
    );

    console.log(`✅ Wallet created: ${walletInfo.address}`);
    console.log(`👤 New User: ${walletInfo.isNewUser ? 'Yes' : 'No'}`);

    // Ask about contract deployment in non-interactive mode too
    const deployContract = await askQuestion('Deploy ERC-20 contract? (y/n): ');
    
    if (deployContract.toLowerCase() === 'y') {
      const tokenMetadata = await getTokenMetadata();
      const contractInfo = await client.deployERC20Contract(
        walletInfo.address,
        tokenMetadata,
        walletInfo.chain_id
      );
      console.log(`🎉 Contract deployed: ${contractInfo.contractAddress}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the application
if (require.main === module) {
  handleCliArgs().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { ThirdwebClient, ThirdwebConfig, WalletInfo, TokenMetadata, ContractInfo }; 