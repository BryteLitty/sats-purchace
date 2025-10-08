import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MobileMoneyProvider } from "@/types/payment";

const PROVIDERS: MobileMoneyProvider[] = [
  { id: "1", name: "MTN Mobile Money", value: "mtn" },
  { id: "2", name: "Vodafone Cash", value: "vodafone" },
  { id: "3", name: "AirtelTigo Money", value: "tigo" },
];

interface PurchaseFormProps {
  onSubmit: (data: PurchaseFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface PurchaseFormData {
  email: string;
  amount: string;
  lightning_address: string;
  phone: string;
  provider: string;
}

export function PurchaseForm({ onSubmit, isLoading = false, error }: PurchaseFormProps) {
  const [formData, setFormData] = useState<PurchaseFormData>({
    email: "",
    amount: "",
    lightning_address: "",
    phone: "",
    provider: "mtn",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof PurchaseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Buy Bitcoin</CardTitle>
        <CardDescription>
          Enter your details to purchase Bitcoin with mobile money
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GHS)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100"
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Minimum amount: GHS 1.00
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lightning_address">Lightning Address</Label>
            <Input
              id="lightning_address"
              type="text"
              placeholder="lnbc10n1p3..."
              value={formData.lightning_address}
              onChange={(e) => handleChange("lightning_address", e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              BOLT11 Lightning invoice for receiving Bitcoin
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0551234567"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Mobile Money Provider</Label>
            <Select
              id="provider"
              value={formData.provider}
              onChange={(e) => handleChange("provider", e.target.value)}
              disabled={isLoading}
              required
            >
              {PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.value}>
                  {provider.name}
                </option>
              ))}
            </Select>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Continue to Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
