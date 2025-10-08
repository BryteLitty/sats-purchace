import type { ChargeRequest, ChargeResponse, OTPRequest, OTPResponse, PaymentError, TransactionStatus } from "@/types/payment";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

  async createCharge(chargeData: ChargeRequest): Promise<ChargeResponse> {
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
    return this.request<TransactionStatus>(`/transactions/status/${reference}`, {
      method: "GET",
    });
  }
}

export const paystackService = new PaystackService();
