import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

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
  // Convert amount from smallest currency unit (e.g., 100 pesewas = 1.00 GHS)
  const formattedAmount = (amount / 100).toFixed(2);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-2xl">Payment Complete!</CardTitle>
        <CardDescription>
          Bitcoin has been sent to your Lightning address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount Paid:</span>
            <span className="font-medium">
              {currency} {formattedAmount}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reference:</span>
            <span className="font-mono text-xs">{reference}</span>
          </div>
        </div>

        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-900 dark:text-green-200">
          <div className="flex items-start gap-2">
            <CheckCircle className="size-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Bitcoin Successfully Sent!</p>
              <p className="text-xs mt-1 opacity-90">
                Your Bitcoin has been delivered to your Lightning address. You should receive a confirmation email shortly.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onReset} className="w-full">
          Make Another Purchase
        </Button>
      </CardContent>
    </Card>
  );
}
