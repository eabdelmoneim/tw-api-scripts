import { ThirdwebClient } from './src/thirdweb-client';
import { ThirdwebConfig, TokenMetadata } from './src/types';

// Example usage of the ThirdwebClient for wallet creation and contract deployment
async function createWalletAndDeployContractExample() {
  // Configure the client
  const config: ThirdwebConfig = {
    apiKey: 'your-secret-key-here', // Replace with your actual API key
    baseUrl: 'https://api.thirdweb.com',
    chainId: 1 // Ethereum mainnet
  };

  const client = new ThirdwebClient(config);

  try {
    // Step 1: Create wallet using email authentication
    console.log('Creating wallet...');
    
    // Option 1: Regular wallet creation (no ecosystem)
    const walletInfo = await client.createWalletWithEmail(
      'user@example.com',
      async () => {
        // In a real application, you would get this from user input
        // For this example, we're returning a placeholder
        return '123456'; // This would be the OTP code from email
      }
      // No ecosystem parameters = regular wallet
    );

    // Option 2: Ecosystem wallet creation
    // const walletInfo = await client.createWalletWithEmail(
    //   'user@example.com',
    //   async () => {
    //     return '123456'; // OTP code from email
    //   },
    //   'my-ecosystem-id', // Ecosystem ID for ecosystem wallet
    //   'my-ecosystem-partner-id' // Optional ecosystem partner ID
    // );

    console.log('Wallet created successfully!');
    console.log('Address:', walletInfo.address);
    console.log('Email:', walletInfo.email);
    console.log('Is New User:', walletInfo.isNewUser);
    if (walletInfo.ecosystemId) {
      console.log('Ecosystem ID:', walletInfo.ecosystemId);
    }
    if (walletInfo.ecosystemPartnerId) {
      console.log('Ecosystem Partner ID:', walletInfo.ecosystemPartnerId);
    }

    // Step 2: Deploy ERC-20 token contract
    const tokenMetadata: TokenMetadata = {
      name: 'My Custom Token',
      symbol: 'MCT',
      description: 'A custom ERC-20 token deployed via thirdweb API',
      decimals: 18,
      initialSupply: '1000000' // 1 million tokens
    };

    console.log('Deploying ERC-20 contract...');
    const contractInfo = await client.deployERC20Contract(
      walletInfo.address,
      tokenMetadata,
      1 // Ethereum mainnet
    );

    console.log('Contract deployed successfully!');
    console.log('Contract Address:', contractInfo.contractAddress);
    console.log('Transaction ID:', contractInfo.transactionId);
    console.log('Token Name:', contractInfo.tokenName);
    console.log('Token Symbol:', contractInfo.tokenSymbol);

  } catch (error) {
    console.error('Failed to create wallet or deploy contract:', error);
  }
}

// Example of just deploying a contract with an existing wallet
async function deployContractOnlyExample() {
  const config: ThirdwebConfig = {
    apiKey: 'your-secret-key-here',
    baseUrl: 'https://api.thirdweb.com',
    chainId: 137 // Polygon
  };

  const client = new ThirdwebClient(config);

  try {
    const tokenMetadata: TokenMetadata = {
      name: 'Polygon Token',
      symbol: 'POLY',
      description: 'A token deployed on Polygon network',
      decimals: 18
    };

    // Assuming you already have a wallet address and token
    const walletAddress = '0x1234567890123456789012345678901234567890';
    
    // You would need to set the auth token first in a real scenario
    // client.updateAuthHeaders('your-auth-token');

    const contractInfo = await client.deployERC20Contract(
      walletAddress,
      tokenMetadata,
      137 // Polygon chain ID
    );

    console.log('Contract deployed on Polygon:', contractInfo.contractAddress);
  } catch (error) {
    console.error('Failed to deploy contract:', error);
  }
}

// Uncomment to run the examples
// createWalletAndDeployContractExample();
// deployContractOnlyExample();

export { createWalletAndDeployContractExample, deployContractOnlyExample }; 