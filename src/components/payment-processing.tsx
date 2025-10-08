import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PaymentProcessingProps {
  phoneNumber?: string;
}

export function PaymentProcessing({ phoneNumber }: PaymentProcessingProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
          <Loader2 className="size-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <CardTitle className="text-2xl">Processing Payment</CardTitle>
        <CardDescription>
          Please wait while we confirm your payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {phoneNumber
              ? `Waiting for payment confirmation from ${phoneNumber}...`
              : "Waiting for payment confirmation..."}
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="flex-1 h-2 bg-blue-600 rounded-full animate-pulse delay-75"></div>
          <div className="flex-1 h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          This may take a few moments. Please do not close this page.
        </p>
      </CardContent>
    </Card>
  );
}
