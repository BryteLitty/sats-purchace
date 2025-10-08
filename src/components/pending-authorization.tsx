import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

interface PendingAuthorizationProps {
  onCancel: () => void;
  phoneNumber?: string;
}

export function PendingAuthorization({
  onCancel,
  phoneNumber
}: PendingAuthorizationProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 animate-pulse">
          <Smartphone className="size-8 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl">Authorize Payment</CardTitle>
        <CardDescription>
          {phoneNumber
            ? `Please check ${phoneNumber} to complete the payment`
            : "Please check your phone to complete the payment"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2 text-center">
          <p className="text-sm font-medium">
            Complete the authorization on your mobile device
          </p>
          <p className="text-xs text-muted-foreground">
            Enter your PIN when prompted to approve this transaction
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="flex-1 h-2 bg-blue-600 rounded-full animate-pulse delay-75"></div>
          <div className="flex-1 h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
        </div>

        <Button onClick={onCancel} variant="outline" className="w-full">
          Cancel Transaction
        </Button>
      </CardContent>
    </Card>
  );
}
