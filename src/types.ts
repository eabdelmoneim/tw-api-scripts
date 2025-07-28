export interface ThirdwebConfig {
  apiKey: string;
  baseUrl: string;
  chainId?: number;
  ecosystemId?: string;
  ecosystemPartnerId?: string;
}

export interface SendLoginCodeRequest {
  email: string;
  type: 'email';
}

export interface SendLoginCodeResponse {
  success: boolean;
  error?: string;
}

export interface VerifyLoginCodeRequest {
  email: string;
  code: string;
  type: 'email';
}

export interface VerifyLoginCodeResponse {
  isNewUser: boolean;
  token: string;
  type: string;
  walletAddress: string;
  error?: string;
}

export interface WalletInfo {
  address: string;
  email: string;
  created_at?: string;
  chain_id?: number;
  isNewUser?: boolean;
  token?: string;
  ecosystemId?: string;
  ecosystemPartnerId?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  status_code?: number;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  decimals?: number;
  initialSupply?: string;
}

export interface DeployContractRequest {
  chainId: number;
  contractUrl: string;
  from: string;
  constructorParams?: {
    [key: string]: any;
  };
  salt?: string;
}

export interface DeployContractResponse {
  result: {
    address: string;
    chainId: number;
    transactionId?: string;
  };
  error?: string;
}

export interface ContractInfo {
  contractAddress: string;
  transactionId?: string;
  chainId: number;
  deployer: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  deployed_at: string;
} 