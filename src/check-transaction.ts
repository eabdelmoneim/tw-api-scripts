import * as dotenv from 'dotenv';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Load environment variables
dotenv.config();

interface TransactionStatusResponse {
  result: {
    transactionId: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    chainId: number;
    from?: string;
    to?: string;
    contractAddress?: string;
    blockNumber?: number;
    transactionHash?: string;
    gasUsed?: string;
    effectiveGasPrice?: string;
    createdAt?: string;
    updatedAt?: string;
    error?: string;
  };
  error?: string;
}

interface ApiError {
  error: string;
  message?: string;
  status_code?: number;
}

class TransactionChecker {
  private client: AxiosInstance;

  constructor(apiKey: string, baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': apiKey,
        'x-sdk-name': 'typescript-transaction-checker',
        'x-sdk-version': '1.0.0'
      },
      timeout: 30000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const apiError: ApiError = {
            error: error.response.data?.error || 'API Error',
            message: error.response.data?.message || error.message,
            status_code: error.response.status
          };
          throw apiError;
        }
        throw new Error(error.message || 'Network error');
      }
    );
  }

  /**
   * Check transaction status by transaction ID
   */
  async checkTransactionStatus(transactionId: string): Promise<any> {
    try {
      console.log(`🔍 Checking status for transaction: ${transactionId}`);

      const response: AxiosResponse<any> = await this.client.get(
        `/v1/transactions/${transactionId}`
      );

      // Debug: Log the raw response to understand the actual structure
      console.log('\n🐛 Debug - Raw API Response:');
      console.log(JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw error;
    }
  }
}

/**
 * Format and display transaction status
 */
function displayTransactionStatus(txData: any) {
  console.log('\n📊 Transaction Status');
  console.log('====================');
  
  // Check if we have the expected data structure
  if (!txData) {
    console.log('❌ No transaction data received');
    return;
  }

  // Status with emoji - handle undefined status
  const statusEmoji = {
    pending: '⏳',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫'
  };
  
  const status = txData.status || 'unknown';
  console.log(`${statusEmoji[status as keyof typeof statusEmoji] || '❓'} Status: ${status.toUpperCase()}`);
  
  if (txData.transactionId) {
    console.log(`🆔 Transaction ID: ${txData.transactionId}`);
  }
  
  if (txData.chainId) {
    console.log(`⛓️  Chain ID: ${txData.chainId}`);
  }
  
  if (txData.from) {
    console.log(`📤 From: ${txData.from}`);
  }
  
  if (txData.to) {
    console.log(`📥 To: ${txData.to}`);
  }
  
  if (txData.contractAddress) {
    console.log(`📄 Contract Address: ${txData.contractAddress}`);
  }
  
  if (txData.transactionHash) {
    console.log(`🔗 Transaction Hash: ${txData.transactionHash}`);
  }
  
  if (txData.blockNumber) {
    console.log(`🧱 Block Number: ${txData.blockNumber}`);
  }
  
  if (txData.gasUsed) {
    console.log(`⛽ Gas Used: ${txData.gasUsed}`);
  }
  
  if (txData.effectiveGasPrice) {
    console.log(`💰 Gas Price: ${txData.effectiveGasPrice}`);
  }
  
  if (txData.createdAt) {
    console.log(`🕐 Created At: ${new Date(txData.createdAt).toLocaleString()}`);
  }
  
  if (txData.updatedAt) {
    console.log(`🔄 Updated At: ${new Date(txData.updatedAt).toLocaleString()}`);
  }
  
  if (txData.error) {
    console.log(`❗ Error: ${txData.error}`);
  }
  
  console.log('====================\n');
}

/**
 * Main function to check transaction status
 */
async function main() {
  try {
    // Get transaction ID from command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
🔍 Thirdweb Transaction Status Checker
=====================================

Usage:
  npm run check-tx <transaction-id>
  ts-node src/check-transaction.ts <transaction-id>

Options:
  --help, -h          Show this help message
  --watch, -w         Watch transaction until completion (polls every 5 seconds)
  --debug, -d         Show debug information

Environment Variables:
  THIRDWEB_API_KEY     Your Thirdweb Secret Key (required)
  THIRDWEB_BASE_URL    Base URL for Thirdweb API (optional)

Examples:
  npm run check-tx abc123-def456-ghi789
  npm run check-tx abc123-def456-ghi789 --watch
  npm run check-tx abc123-def456-ghi789 --debug
`);
      process.exit(0);
    }

    const transactionId = args[0];
    const watchMode = args.includes('--watch') || args.includes('-w');
    const debugMode = args.includes('--debug') || args.includes('-d');

    if (!transactionId) {
      console.error('❌ Error: Transaction ID is required');
      console.log('Usage: npm run check-tx <transaction-id>');
      console.log('Example: npm run check-tx abc123-def456-ghi789');
      process.exit(1);
    }

    // Validate required environment variables
    const apiKey = process.env.THIRDWEB_API_KEY;
    const baseUrl = process.env.THIRDWEB_BASE_URL || 'https://api.thirdweb-dev.com';

    if (!apiKey) {
      console.error('❌ Error: THIRDWEB_API_KEY is required in environment variables');
      console.log('Please create a .env file with your Thirdweb Secret Key');
      process.exit(1);
    }

    const checker = new TransactionChecker(apiKey, baseUrl);

    if (watchMode) {
      console.log(`👀 Watching transaction ${transactionId} until completion...`);
      console.log('Press Ctrl+C to stop watching\n');

      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max (5 seconds * 120 = 600 seconds)

      while (attempts < maxAttempts) {
        try {
          const response = await checker.checkTransactionStatus(transactionId);
          
          // Handle different response structures
          const txData = response.result || response;
          
          if (!debugMode) {
            // Clear the debug output for cleaner watch mode
            console.clear();
            console.log(`👀 Watching transaction ${transactionId} (attempt ${attempts + 1}/${maxAttempts})`);
          }

          displayTransactionStatus(txData);

          // Exit if transaction is no longer pending
          if (txData.status && txData.status !== 'pending') {
            console.log(`🎉 Transaction ${txData.status}! Stopping watch mode.`);
            break;
          }

          attempts++;
          console.log(`⏱️  Waiting 5 seconds before next check... (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
          console.error('❌ Error during watch:', error);
          
          if (typeof error === 'object' && error !== null && 'status_code' in error) {
            const apiError = error as ApiError;
            if (apiError.status_code === 404) {
              console.log('Transaction not found. It may not exist or may not be indexed yet.');
            }
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            console.log(`⏱️  Retrying in 5 seconds... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }

      if (attempts >= maxAttempts) {
        console.log('⏰ Reached maximum watch time. Exiting...');
      }

    } else {
      // Single check
      const response = await checker.checkTransactionStatus(transactionId);
      
      // Handle different response structures
      const txData = response.result || response;

      if (!debugMode) {
        // Remove debug output for clean single check
        console.log('\n'); // Just add some space
      }

      displayTransactionStatus(txData);
    }

  } catch (error) {
    console.error('\n❌ Error checking transaction:', error);
    
    if (typeof error === 'object' && error !== null && 'status_code' in error) {
      const apiError = error as ApiError;
      console.error(`Status: ${apiError.status_code}`);
      console.error(`Message: ${apiError.message}`);
      
      if (apiError.status_code === 404) {
        console.log('\n💡 Tip: Make sure the transaction ID is correct and the transaction exists.');
      }
    }
    
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { TransactionChecker }; 