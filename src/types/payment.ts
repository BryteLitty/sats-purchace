export interface MobileMoneyProvider {
  id: string;
  name: string;
  value: "mtn" | "vodafone" | "tigo";
}

export interface ChargeRequest {
  email: string;
  amount: string;
  currency: string;
  lightning_address: string;
  mobile_money: {
    phone: string;
    provider: string;
  };
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
  };
}

export interface ChargeResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    display_text: string;
  };
}

export interface OTPRequest {
  otp: string;
  reference: string;
}

export interface OTPResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
  };
}

export interface PaymentError {
  error: {
    message: string;
    code?: string;
  };
}

export interface TransactionStatus {
  reference: string;
  status: "pending" | "success" | "failed" | "send_otp" | "pay_offline";
  amount: number;
  currency: string;
  email: string;
  payment_channel: string;
  lightning_address?: string;
  lightning_payment_status?: "pending" | "SUCCESS" | "FAILED";
  satoshis_amount?: number;
  created_at: string;
  updated_at: string;
}
