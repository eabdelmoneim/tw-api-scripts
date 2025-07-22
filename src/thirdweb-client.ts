import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ThirdwebConfig,
  SendLoginCodeRequest,
  SendLoginCodeResponse,
  VerifyLoginCodeRequest,
  VerifyLoginCodeResponse,
  WalletInfo,
  ApiError,
  TokenMetadata,
  DeployContractRequest,
  DeployContractResponse,
  ContractInfo
} from './types';

export class ThirdwebClient {
  private client: AxiosInstance;
  private config: ThirdwebConfig;

  constructor(config: ThirdwebConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': config.apiKey, // Use x-secret-key header instead of Authorization
        'x-sdk-name': 'typescript-wallet-creator',
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
   * Update client headers for authenticated requests
   */
  private updateAuthHeaders(token: string) {
    this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Send a login code to the specified email address
   */
  async sendLoginCode(email: string): Promise<SendLoginCodeResponse> {
    try {
      const payload: SendLoginCodeRequest = {
        email,
        type: 'email'
      };

      const response: AxiosResponse<SendLoginCodeResponse> = await this.client.post(
        '/v1/wallets/login/code',
        payload
      );

      return response.data;
    } catch (error) {
      console.error('Error sending login code:', error);
      throw error;
    }
  }

  /**
   * Verify the login code and create/access wallet
   */
  async verifyLoginCode(email: string, code: string): Promise<VerifyLoginCodeResponse> {
    try {
      const payload: VerifyLoginCodeRequest = {
        email,
        code,
        type: 'email'
      };

      const response: AxiosResponse<VerifyLoginCodeResponse> = await this.client.post(
        '/v1/wallets/login/code/verify',
        payload
      );

      return response.data;
    } catch (error) {
      console.error('Error verifying login code:', error);
      throw error;
    }
  }

  /**
   * Create a wallet using email authentication flow
   * This method combines sending the code and verification
   */
  async createWalletWithEmail(
    email: string, 
    getOtpCode: () => Promise<string>
  ): Promise<WalletInfo> {
    try {
      console.log(`Starting wallet creation process for email: ${email}`);

      // Step 1: Send login code
      console.log('Sending login code...');
      const codeResponse = await this.sendLoginCode(email);
      
      if (!codeResponse.success) {
        throw new Error(`Failed to send login code: ${codeResponse.error || 'Unknown error'}`);
      }

      console.log('Login code sent successfully. Please check your email.');

      // Step 2: Get OTP code from user
      const otpCode = await getOtpCode();

      // Step 3: Verify code and create/access wallet
      console.log('Verifying login code...');
      const verifyResponse = await this.verifyLoginCode(email, otpCode);

      if (!verifyResponse.walletAddress) {
        throw new Error(`Failed to verify login code: ${verifyResponse.error || 'No wallet address returned'}`);
      }

      console.log(`Wallet created/accessed successfully: ${verifyResponse.walletAddress}`);

      // Update client headers with the auth token for subsequent requests
      this.updateAuthHeaders(verifyResponse.token);

      return {
        address: verifyResponse.walletAddress,
        email: email,
        created_at: new Date().toISOString(),
        chain_id: this.config.chainId,
        isNewUser: verifyResponse.isNewUser,
        token: verifyResponse.token
      };

    } catch (error) {
      console.error('Error in wallet creation process:', error);
      throw error;
    }
  }

  /**
   * Deploy an ERC-20 token contract using the correct thirdweb API
   */
  async deployERC20Contract(
    walletAddress: string,
    tokenMetadata: TokenMetadata,
    chainId?: number
  ): Promise<ContractInfo> {
    try {
      console.log(`Deploying ERC-20 contract: ${tokenMetadata.name} (${tokenMetadata.symbol})`);

      const deployChainId = chainId || this.config.chainId || 1;
      
      // Prepare constructor parameters for TokenERC20
      const constructorParams: { [key: string]: any } = {
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        primarySaleRecipient: walletAddress
      };

      // If initial supply is specified, include it
      if (tokenMetadata.initialSupply && tokenMetadata.initialSupply !== '0') {
        constructorParams.initialSupply = tokenMetadata.initialSupply;
      }

      // Using the correct thirdweb API structure
      const payload: DeployContractRequest = {
        chainId: deployChainId,
        contractUrl: "https://thirdweb.com/thirdweb.eth/TokenERC20",
        from: walletAddress,
        constructorParams
      };

      const response: AxiosResponse<DeployContractResponse> = await this.client.post(
        '/v1/contracts',  // Correct endpoint
        payload
      );

      if (!response.data.result) {
        throw new Error(`Failed to deploy contract: ${response.data.error || 'Unknown error'}`);
      }

      console.log(`Contract deployed successfully at: ${response.data.result.address}`);

      return {
        contractAddress: response.data.result.address,
        transactionId: response.data.result.transactionId,
        chainId: deployChainId,
        deployer: walletAddress,
        tokenName: tokenMetadata.name,
        tokenSymbol: tokenMetadata.symbol,
        tokenDescription: tokenMetadata.description,
        deployed_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error deploying ERC-20 contract:', error);
      throw error;
    }
  }

  /**
   * Get wallet information using the wallet address
   */
  async getWalletInfo(walletAddress: string): Promise<WalletInfo | null> {
    try {
      const response = await this.client.get(`/v1/wallets/${walletAddress}`);
      return response.data.result;
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return null;
    }
  }

  /**
   * Get contract information
   */
  async getContractInfo(contractAddress: string, chainId?: number): Promise<any> {
    try {
      const queryChainId = chainId || this.config.chainId || 1;
      const response = await this.client.get(`/v1/contracts/${contractAddress}?chainId=${queryChainId}`);
      return response.data.result;
    } catch (error) {
      console.error('Error getting contract info:', error);
      return null;
    }
  }
} 