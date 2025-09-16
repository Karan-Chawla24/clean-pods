import { safeLog, safeLogError } from "./security/logging";

interface PhonePeOAuthConfig {
  clientId: string;
  clientSecret: string;
  clientVersion: string;
  baseUrl: string;
  callbackUrl: string;
}

interface PhonePeTokenResponse {
  access_token: string;
  encrypted_access_token: string;
  expires_in: number | null;
  issued_at: number;
  expires_at: number;
  session_expires_at: number;
  token_type: string;
}

interface PhonePePaymentRequest {
  merchantOrderId: string;
  amount: number;
  expireAfter?: number;
  metaInfo?: {
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  };
  paymentFlow: {
    type: "PG_CHECKOUT";
    message?: string;
    merchantUrls: {
      redirectUrl: string;
    };
  };
}

interface PhonePePaymentResponse {
  orderId: string;
  state: "PENDING" | "COMPLETED" | "FAILED";
  expireAt: number;
  redirectUrl: string;
}

interface PhonePeOrderStatusResponse {
  orderId: string;
  state: "PENDING" | "COMPLETED" | "FAILED";
  amount: number;
  payableAmount?: number;
  feeAmount?: number;
  expireAt: number;
  metaInfo?: {
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  };
  paymentDetails?: Array<{
    transactionId: string;
    paymentMode: string;
    timestamp: number;
    amount: number;
    payableAmount?: number;
    feeAmount?: number;
    state: "PENDING" | "COMPLETED" | "FAILED";
    rail?: {
      type: string;
      utr?: string;
      upiTransactionId?: string;
      vpa?: string;
    };
    instrument?: {
      type: string;
      maskedAccountNumber?: string;
      accountType?: string;
      accountHolderName?: string;
    };
  }>;
}

class PhonePeOAuthClient {
  private config: PhonePeOAuthConfig;
  private cachedToken: PhonePeTokenResponse | null = null;
  private tokenExpiryBuffer = 300; // 5 minutes buffer before expiry

  constructor(config: PhonePeOAuthConfig) {
    this.config = config;
  }

  /**
   * Get a valid OAuth access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.access_token;
    }

    // Request new token - use different endpoints for sandbox vs production
    const isProduction = this.config.baseUrl.includes('api.phonepe.com');
    const tokenEndpoint = isProduction 
      ? '/apis/identity-manager/v1/oauth/token'
      : '/apis/pg-sandbox/v1/oauth/token';
    const tokenUrl = `${this.config.baseUrl}${tokenEndpoint}`;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_version: this.config.clientVersion,
      client_secret: this.config.clientSecret,
      grant_type: "client_credentials"
    });

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const tokenData: PhonePeTokenResponse = await response.json();
      this.cachedToken = tokenData;
      
      safeLog("info", "PhonePe OAuth token obtained successfully", {
        expires_at: tokenData.expires_at,
        token_type: tokenData.token_type
      });

      return tokenData.access_token;
    } catch (error) {
      safeLogError("Failed to obtain PhonePe OAuth token", error);
      throw error;
    }
  }

  /**
   * Check if the cached token is still valid
   */
  private isTokenValid(token: PhonePeTokenResponse): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return token.expires_at > (currentTime + this.tokenExpiryBuffer);
  }

  /**
   * Create a payment request
   */
  async createPayment(paymentRequest: PhonePePaymentRequest): Promise<PhonePePaymentResponse> {
    const accessToken = await this.getAccessToken();
    const paymentUrl = `${this.config.baseUrl}/apis/pg-sandbox/checkout/v2/pay`;

    try {
      const response = await fetch(paymentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `O-Bearer ${accessToken}`,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        safeLogError("PhonePe payment creation failed", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          merchantOrderId: paymentRequest.merchantOrderId
        });
        throw new Error(`Payment creation failed: ${response.status} - ${errorText}`);
      }

      const paymentData: PhonePePaymentResponse = await response.json();
      
      safeLog("info", "PhonePe payment created successfully", {
        orderId: paymentData.orderId,
        merchantOrderId: paymentRequest.merchantOrderId,
        state: paymentData.state
      });

      return paymentData;
    } catch (error) {
      safeLogError("Failed to create PhonePe payment", {
        error,
        merchantOrderId: paymentRequest.merchantOrderId
      });
      throw error;
    }
  }

  /**
   * Check the status of an order
   */
  async getOrderStatus(merchantOrderId: string, details: boolean = false): Promise<PhonePeOrderStatusResponse> {
    const accessToken = await this.getAccessToken();
    const statusUrl = `${this.config.baseUrl}/apis/pg-sandbox/checkout/v2/order/${merchantOrderId}/status?details=${details}`;

    try {
      const response = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `O-Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        safeLogError("PhonePe order status check failed", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          merchantOrderId
        });
        throw new Error(`Order status check failed: ${response.status} - ${errorText}`);
      }

      const statusData: PhonePeOrderStatusResponse = await response.json();
      
      safeLog("info", "PhonePe order status retrieved", {
        orderId: statusData.orderId,
        merchantOrderId,
        state: statusData.state
      });

      return statusData;
    } catch (error) {
      safeLogError("Failed to get PhonePe order status", {
        error,
        merchantOrderId
      });
      throw error;
    }
  }

  /**
   * Extract transaction ID from order status response
   */
  extractTransactionId(orderStatus: PhonePeOrderStatusResponse): string | null {
    if (orderStatus.paymentDetails && orderStatus.paymentDetails.length > 0) {
      // Get the latest completed payment
      const completedPayment = orderStatus.paymentDetails
        .filter(payment => payment.state === "COMPLETED")
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      return completedPayment?.transactionId || null;
    }
    return null;
  }
}

/**
 * Create a PhonePe OAuth client instance
 */
export function createPhonePeOAuthClient(): PhonePeOAuthClient {
  const config: PhonePeOAuthConfig = {
    clientId: process.env.PHONEPE_CLIENT_ID || "",
    clientSecret: process.env.PHONEPE_CLIENT_SECRET || "",
    clientVersion: process.env.PHONEPE_CLIENT_VERSION || "1",
    baseUrl: process.env.PHONEPE_BASE_URL || "https://api-preprod.phonepe.com",
    callbackUrl: process.env.PHONEPE_CALLBACK_URL || "http://localhost:3000/api/phonepe/callback"
  };

  // Validate required configuration
  if (!config.clientId || !config.clientSecret) {
    throw new Error("PhonePe OAuth configuration is incomplete. Please check PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET environment variables.");
  }

  return new PhonePeOAuthClient(config);
}

export type {
  PhonePeOAuthConfig,
  PhonePeTokenResponse,
  PhonePePaymentRequest,
  PhonePePaymentResponse,
  PhonePeOrderStatusResponse
};

export { PhonePeOAuthClient };