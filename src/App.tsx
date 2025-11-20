import { useState, useEffect, useRef } from "react";
import {
  PurchaseForm,
  type PurchaseFormData,
} from "@/components/purchase-form";
import { PaymentProcessing } from "@/components/payment-processing";
import { PaymentSuccess } from "@/components/payment-success";
import { Maintenance } from "@/components/maintenance";
import { bulkclixService } from "@/services/bulkclix";
import type { PaymentError } from "@/types/payment";
import brandIcon from "@/assets/icon.png";

// Toggle maintenance mode - set to false to disable
const MAINTENANCE_MODE = true;

type PaymentStep = "purchase" | "processing" | "success";

interface PaymentState {
  reference: string | null;
  amount: string | null;
  satoshis: string | null;
  phone: string | null;
}

function App() {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("purchase");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>({
    reference: null,
    amount: null,
    satoshis: null,
    phone: null,
  });

  const pollingIntervalRef = useRef<number | null>(null);

  // Poll BulkClix payment status
  useEffect(() => {
    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (currentStep === "processing" && paymentState.reference) {
      const pollStatus = async () => {
        try {
          const status = await bulkclixService.checkStatus(
            paymentState.reference!
          );

          if (status.status === "pending") {
            // Keep polling, payment is still being processed
            return;
          }

          if (status.status === "success") {
            // Payment succeeded, move to success screen
            setPaymentState((prev) => ({
              ...prev,
              amount: status.amount,
              satoshis: status.satoshis_amount,
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
          console.error("Error polling BulkClix payment status:", err);
        }
      };

      // Poll immediately, then every 5 seconds (as per BulkClix docs)
      pollStatus();
      pollingIntervalRef.current = window.setInterval(pollStatus, 5000);

      // Stop polling after 10 minutes (timeout as per BulkClix docs)
      const timeoutId = window.setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setError(
          "Payment timeout. If you approved the payment, please contact support with reference: " +
            paymentState.reference
        );
        setCurrentStep("purchase");
      }, 600000); // 10 minutes

      return () => {
        clearTimeout(timeoutId);
      };
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
        phone_number: formData.phone,
        network: formData.provider as "MTN" | "TELECEL" | "AIRTELTIGO",
      };

      const response = await bulkclixService.initializePayment(payload);

      if (response.success) {
        setPaymentState({
          reference: response.reference,
          amount: formData.amount,
          satoshis: null,
          phone: formData.phone,
        });

        // Move to processing step - user should check phone
        setCurrentStep("processing");
      } else {
        setError("Payment initialization failed. Please try again.");
      }
    } catch (err) {
      const paymentError = err as PaymentError;

      // Map backend errors to user-friendly messages
      let userMessage = "Payment initialization failed. Please try again.";

      if (paymentError.error?.code === "network_error") {
        userMessage = "Network error. Please check your internet connection.";
      } else if (
        paymentError.error?.message?.toLowerCase().includes("invalid")
      ) {
        userMessage = "Invalid payment information. Please check your details.";
      } else if (
        paymentError.error?.message?.toLowerCase().includes("timeout")
      ) {
        userMessage = "Request timed out. Please try again.";
      } else if (
        paymentError.error?.message?.toLowerCase().includes("insufficient")
      ) {
        userMessage =
          "Insufficient balance. Please check your mobile money account.";
      }

      // Log detailed error for debugging (not visible to user)
      console.error("Payment initialization error:", {
        code: paymentError.error?.code,
        timestamp: new Date().toISOString(),
      });

      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
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
      satoshis: null,
      phone: null,
    });
    setError(null);
  };

  // Show maintenance page if enabled
  if (MAINTENANCE_MODE) {
    return <Maintenance />;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url("/images/hero-image.webp")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      {/* Header with Brand Icon */}
      <header className="w-full py-3 sm:py-4 px-4 sm:px-6 border-b border-gray-700/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={brandIcon}
              alt="Brand Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold text-white">
                BitSpenda
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 hidden xs:block">
                Buy Bitcoin Instantly
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <svg
              className="size-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secure • Fast • Reliable</span>
          </div>
          {/* Mobile badge - just icon */}
          <div className="flex sm:hidden items-center">
            <svg
              className="size-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        {currentStep === "purchase" && (
          <PurchaseForm
            onSubmit={handlePurchaseSubmit}
            isLoading={isLoading}
            error={error}
          />
        )}

        {currentStep === "processing" && (
          <PaymentProcessing phoneNumber={paymentState.phone || undefined} />
        )}

        {currentStep === "success" && paymentState.reference && (
          <PaymentSuccess
            amount={paymentState.amount ? parseFloat(paymentState.amount) : 0}
            currency="GHS"
            reference={paymentState.reference}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default App;
