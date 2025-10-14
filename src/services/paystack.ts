import type { ChargeRequest, ChargeResponse, OTPRequest, OTPResponse, PaymentError, TransactionStatus } from "@/types/payment";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface ExchangeRates {
  rates: {
    btcToUsd: number;
    btcToGhs: number;
    ghsToUsd: number;
  };
  explanation: {
    btcToUsd: string;
    btcToGhs: string;
    ghsToUsd: string;
  };
}

export interface ConversionRequest {
  amount: number;
  currency: string;
}

export interface ConversionResponse {
  input: {
    amountInMainUnit: number;
  };
  output: {
    satoshis: number;
    btcAmount: number;
    usdEquivalent: number;
    formattedUsd: string;
  };
}

class PaystackService {
  private async request<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw data as PaymentError;
      }

      return data as T;
    } catch (error) {
      if ((error as PaymentError).error) {
        throw error;
      }
      throw {
        error: {
          message: "Network error. Please check your connection and try again.",
          code: "network_error",
        },
      } as PaymentError;
    }
  }

  async getRates(): Promise<ExchangeRates> {
    return this.request<ExchangeRates>("/lightning/rates", {
      method: "GET",
    });
  }

  async convertAmount(conversionData: ConversionRequest): Promise<ConversionResponse> {
    return this.request<ConversionResponse>("/lightning/convert", {
      method: "POST",
      body: JSON.stringify(conversionData),
    });
  }

  async createCharge(chargeData: ChargeRequest): Promise<ChargeResponse> {
    console.log("Creating charge with data:", chargeData);
    console.log("Request URL:", `${API_BASE_URL}/paystack/charge`);
    return this.request<ChargeResponse>("/paystack/charge", {
      method: "POST",
      body: JSON.stringify(chargeData),
    });
  }

  async submitOTP(otpData: OTPRequest): Promise<OTPResponse> {
    return this.request<OTPResponse>("/paystack/submit-otp", {
      method: "POST",
      body: JSON.stringify(otpData),
    });
  }

  async getTransactionStatus(reference: string): Promise<TransactionStatus> {
    console.log(`[${new Date().toISOString()}] Polling transaction status for:`, reference);
    const result = await this.request<TransactionStatus>(`/transactions/${reference}`, {
      method: "GET",
    });
    console.log(`[${new Date().toISOString()}] Transaction status:`, result.status, 'Lightning:', result.lightning_payment_status);
    return result;
  }
}

export const paystackService = new PaystackService();
