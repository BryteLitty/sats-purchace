import type { PaymentError } from "@/types/payment";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// HTTPS enforcement for production
if (import.meta.env.PROD && API_BASE_URL.startsWith("http://")) {
  console.error("⚠️ SECURITY WARNING: Production API URL must use HTTPS");
  throw new Error("Insecure API URL: Production must use HTTPS");
}

// Development warning
if (import.meta.env.DEV && API_BASE_URL.startsWith("http://") && !API_BASE_URL.includes("localhost")) {
  console.warn("⚠️ Development mode: Using HTTP for non-localhost API. Switch to HTTPS for production.");
}

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

export interface BulkClixPaymentRequest {
  email: string;
  amount: string;
  currency: string;
  lightning_address: string;
  phone_number: string;
  network: "MTN" | "TELECEL" | "AIRTELTIGO";
}

export interface BulkClixPaymentResponse {
  success: boolean;
  reference: string;
  bulkclix_transaction_id: string;
  status: string;
  message: string;
  data: {
    amount: number;
    transaction_id: string;
    ext_transaction_id: string;
    phone_number: string;
  };
}

export interface BulkClixStatusResponse {
  success: boolean;
  reference: string;
  status: "pending" | "success" | "failed";
  lightning_payment_status: string | null;
  amount: string;
  satoshis_amount: string;
  bulkclix_data: {
    status: string;
    transaction_id: string;
    ext_transaction_id: string;
    amount: string;
  };
}

export interface WebAppStatusResponse {
  enabled: boolean;
  message: string;
}

class BulkClixService {
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

  async initializePayment(paymentData: BulkClixPaymentRequest): Promise<BulkClixPaymentResponse> {
    return this.request<BulkClixPaymentResponse>("/bulkclix/initialize", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  }

  async checkStatus(reference: string): Promise<BulkClixStatusResponse> {
    return this.request<BulkClixStatusResponse>(`/bulkclix/check-status/${reference}`, {
      method: "GET",
    });
  }

  async checkWebAppStatus(): Promise<WebAppStatusResponse> {
    return this.request<WebAppStatusResponse>("/settings/web/status", {
      method: "GET",
    });
  }
}

export const bulkclixService = new BulkClixService();
