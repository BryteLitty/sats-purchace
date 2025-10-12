import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { paystackService } from "@/services/paystack";

interface PaymentSuccessProps {
  amount: number;
  currency: string;
  reference: string;
  onReset: () => void;
}

export function PaymentSuccess({
  amount,
  currency,
  reference,
  onReset,
}: PaymentSuccessProps) {
  const [lightningStatus, setLightningStatus] = useState<"pending" | "SUCCESS" | "FAILED">("pending");
  const [satoshisAmount, setSatoshisAmount] = useState<number | null>(null);
  const [lightningAddress, setLightningAddress] = useState<string | null>(null);

  // Convert amount from smallest currency unit (e.g., 100 pesewas = 1.00 GHS)
  const formattedAmount = (amount / 100).toFixed(2);

  // Poll for lightning payment status
  useEffect(() => {
    let intervalId: number | null = null;
    let isMounted = true;

    const checkStatus = async () => {
      if (!isMounted) return;

      try {
        const tx = await paystackService.getTransactionStatus(reference);

        if (!isMounted) return;

        if (tx.lightning_payment_status) {
          setLightningStatus(tx.lightning_payment_status);
        }
        if (tx.satoshis_amount) {
          setSatoshisAmount(tx.satoshis_amount);
        }
        if (tx.lightning_address) {
          setLightningAddress(tx.lightning_address);
        }

        // Stop polling if status is final
        if (tx.lightning_payment_status === "SUCCESS" || tx.lightning_payment_status === "FAILED") {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (err) {
        console.error("Failed to check transaction status:", err);
      }
    };

    // Poll immediately, then every 3 seconds
    checkStatus();
    intervalId = window.setInterval(checkStatus, 3000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [reference]);

  return (
    <Card className="w-full max-w-md border-primary/20 shadow-xl shadow-primary/5">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary/20 relative">
          {lightningStatus === "SUCCESS" && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <CheckCircle className="size-10 text-primary relative z-10" />
            </>
          )}
          {lightningStatus === "FAILED" && <AlertCircle className="size-10 text-destructive" />}
          {lightningStatus === "pending" && <Loader2 className="size-10 text-primary animate-spin" />}
        </div>
        <CardTitle className="text-2xl">
          {lightningStatus === "SUCCESS" && "Payment Complete!"}
          {lightningStatus === "FAILED" && "Bitcoin Transfer Failed"}
          {lightningStatus === "pending" && "Sending Bitcoin..."}
        </CardTitle>
        <CardDescription>
          {lightningStatus === "SUCCESS" && "Bitcoin has been sent to your Lightning address"}
          {lightningStatus === "FAILED" && "Payment received but Bitcoin transfer failed"}
          {lightningStatus === "pending" && "Please wait while we send Bitcoin to your address"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount Paid:</span>
            <span className="font-medium">
              {currency}{formattedAmount}
            </span>
          </div>
          {satoshisAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bitcoin Received:</span>
              <span className="font-medium">
                {satoshisAmount.toLocaleString()} sats
              </span>
            </div>
          )}
          {lightningAddress && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lightning Address:</span>
              <span className="font-mono text-xs truncate max-w-[200px]">{lightningAddress}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reference:</span>
            <span className="font-mono text-xs">{reference}</span>
          </div>
        </div>

        {lightningStatus === "SUCCESS" && (
          <div className="rounded-md bg-primary/10 border border-primary/20 p-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <CheckCircle className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">✓ Bitcoin Sent Successfully!</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Your Bitcoin has been delivered to your Lightning address.
                </p>
              </div>
            </div>
          </div>
        )}

        {lightningStatus === "FAILED" && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                <AlertCircle className="size-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">✗ Bitcoin Transfer Failed</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Contact support with reference: {reference}
                </p>
              </div>
            </div>
          </div>
        )}

        {lightningStatus === "pending" && (
          <div className="rounded-md bg-primary/10 border border-primary/20 p-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Loader2 className="size-5 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-primary">⏳ Sending Bitcoin...</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  This usually takes 2-5 seconds
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={onReset}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          <span className="flex items-center gap-2">
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
            </svg>
            Make Another Purchase
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
