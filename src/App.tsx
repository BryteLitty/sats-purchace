import { useState, useEffect, useRef } from "react";
import { PurchaseForm, type PurchaseFormData } from "@/components/purchase-form";
import { OTPVerification } from "@/components/otp-verification";
import { PendingAuthorization } from "@/components/pending-authorization";
import { PaymentProcessing } from "@/components/payment-processing";
import { PaymentSuccess } from "@/components/payment-success";
import { paystackService } from "@/services/paystack";
import type { PaymentError } from "@/types/payment";

type PaymentStep = "purchase" | "otp" | "pending" | "processing" | "success";

interface PaymentState {
  reference: string | null;
  amount: number | null;
  currency: string | null;
  phone: string | null;
  authType: "send_otp" | "pay_offline" | null;
}

function App() {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("purchase");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>({
    reference: null,
    amount: null,
    currency: null,
    phone: null,
    authType: null,
  });

  const pollingIntervalRef = useRef<number | null>(null);

  // Poll transaction status when processing payment - ONLY for payment status, not lightning
  useEffect(() => {
    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (currentStep === "processing" && paymentState.reference) {
      const pollStatus = async () => {
        try {
          const status = await paystackService.getTransactionStatus(paymentState.reference!);

          // Show pending state for authorization statuses
          if (status.status === "send_otp" || status.status === "pay_offline" || status.status === "pending") {
            // Keep polling, payment is still being processed
            return;
          }

          if (status.status === "success") {
            // Payment succeeded, move to success screen
            // PaymentSuccess component will handle lightning payment status polling
            setPaymentState((prev) => ({
              ...prev,
              amount: status.amount,
              currency: status.currency,
            }));

            // Clear interval before changing step
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setCurrentStep("success");
          } else if (status.status === "failed") {
            setError("Payment failed. Please try again.");

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setCurrentStep("purchase");
          }
        } catch (err) {
          console.error("Error polling transaction status:", err);
        }
      };

      // Poll immediately, then every 3 seconds
      pollStatus();
      pollingIntervalRef.current = window.setInterval(pollStatus, 3000);
    }

    // Cleanup on unmount or step change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentStep, paymentState.reference]);

  const handlePurchaseSubmit = async (formData: PurchaseFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        email: formData.email,
        amount: formData.amount,
        currency: "GHS",
        lightning_address: formData.lightning_address,
        mobile_money: {
          phone: formData.phone,
          provider: formData.provider,
        },
      };

      console.log("Payload being sent to backend:", payload);

      const response = await paystackService.createCharge(payload);

      if (response.status) {
        const authType = response.data.status;

        setPaymentState({
          reference: response.data.reference,
          amount: parseFloat(formData.amount) * 100,
          currency: "GHS",
          phone: formData.phone,
          authType: authType as "send_otp" | "pay_offline",
        });

        if (authType === "send_otp") {
          setCurrentStep("otp");
        } else if (authType === "pay_offline") {
          setCurrentStep("processing");
        } else {
          setError("Payment initialization failed. Please try again.");
        }
      } else {
        setError("Payment initialization failed. Please try again.");
      }
    } catch (err) {
      const paymentError = err as PaymentError;
      setError(paymentError.error?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (otp: string) => {
    if (!paymentState.reference) {
      setError("Payment reference not found");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await paystackService.submitOTP({
        otp,
        reference: paymentState.reference,
      });

      if (response.status && (response.data.status === "success" || response.data.status === "pay_offline")) {
        // OTP verified, now wait for payment to complete
        setCurrentStep("processing");
      } else {
        setError("Payment verification failed. Please try again.");
      }
    } catch (err) {
      const paymentError = err as PaymentError;
      setError(paymentError.error?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPCancel = () => {
    setCurrentStep("purchase");
    setPaymentState({
      reference: null,
      amount: null,
      currency: null,
      phone: null,
      authType: null,
    });
    setError(null);
  };

  const handlePendingCancel = () => {
    setCurrentStep("purchase");
    setPaymentState({
      reference: null,
      amount: null,
      currency: null,
      phone: null,
      authType: null,
    });
    setError(null);
  };

  const handleReset = () => {
    // Clear any polling intervals
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setCurrentStep("purchase");
    setPaymentState({
      reference: null,
      amount: null,
      currency: null,
      phone: null,
      authType: null,
    });
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
      {currentStep === "purchase" && (
        <PurchaseForm
          onSubmit={handlePurchaseSubmit}
          isLoading={isLoading}
          error={error}
        />
      )}

      {currentStep === "otp" && (
        <OTPVerification
          onSubmit={handleOTPSubmit}
          onCancel={handleOTPCancel}
          isLoading={isLoading}
          error={error}
          phoneNumber={paymentState.phone || undefined}
        />
      )}

      {currentStep === "pending" && (
        <PendingAuthorization
          onCancel={handlePendingCancel}
          phoneNumber={paymentState.phone || undefined}
        />
      )}

      {currentStep === "processing" && (
        <PaymentProcessing phoneNumber={paymentState.phone || undefined} />
      )}

      {currentStep === "success" && paymentState.amount && paymentState.currency && paymentState.reference && (
        <PaymentSuccess
          amount={paymentState.amount}
          currency={paymentState.currency}
          reference={paymentState.reference}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default App;
