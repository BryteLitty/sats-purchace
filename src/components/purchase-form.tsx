import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MobileMoneyProvider } from "@/types/payment";
import { paystackService, type ExchangeRates, type ConversionResponse } from "@/services/paystack";

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
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [conversion, setConversion] = useState<ConversionResponse | null>(null);
  const [lightningAddressValid, setLightningAddressValid] = useState<boolean | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);

  // Fetch rates on mount and refresh every 5 minutes
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoadingRates(true);
        const data = await paystackService.getRates();
        setRates(data);
      } catch (err) {
        console.error("Failed to fetch rates:", err);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Validate lightning address
  useEffect(() => {
    const address = formData.lightning_address;
    if (address.length === 0) {
      setLightningAddressValid(null);
      return;
    }

    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setLightningAddressValid(regex.test(address));
  }, [formData.lightning_address]);

  // Convert amount with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setConversion(null);
      return;
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const pesewas = Math.floor(amount * 100);
        const data = await paystackService.convertAmount({
          amount: pesewas,
          currency: "GHS",
        });
        setConversion(data);
      } catch (err) {
        console.error("Failed to convert amount:", err);
        setConversion(null);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData.amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof PurchaseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!showForm) {
    return (
      <Card className="w-full max-w-md border-primary/20 shadow-xl shadow-primary/5">
        <CardContent className="py-16 px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              <svg className="size-14 text-primary relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Buy Bitcoin</h2>
              <p className="text-muted-foreground">Lightning fast, instant settlement</p>
            </div>

            {isLoadingRates ? (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg w-full">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading rates...</span>
                </div>
              </div>
            ) : rates ? (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg w-full space-y-2">
                <p className="text-sm text-muted-foreground">Current Bitcoin Price</p>
                <p className="text-3xl font-bold text-primary">${rates.rates.btcToUsd.toLocaleString()}</p>
                <div className="pt-2 border-t border-primary/10 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {rates.explanation.btcToGhs}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rates.explanation.ghsToUsd.replace(/\s*\(from Bitnob\)/i, '')}
                  </p>
                </div>
              </div>
            ) : null}

            <Button
              onClick={() => setShowForm(true)}
              disabled={isLoadingRates}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              <span className="flex items-center gap-2">
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                </svg>
                Buy SATS
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-primary/20 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-3 pb-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
            <svg className="size-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
            </svg>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Buy Bitcoin</CardTitle>
            <CardDescription className="text-muted-foreground">
              Lightning Network • Instant Settlement
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Live Rates Display */}
        {isLoadingRates ? (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm text-primary">Live Rates</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Fetching rates...</span>
            </div>
          </div>
        ) : rates ? (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-primary">Live Bitcoin Price</h3>
              <span className="text-xs text-muted-foreground">Updates every 5 min</span>
            </div>
            <p className="text-2xl font-bold text-primary">${rates.rates.btcToUsd.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{rates.explanation.btcToGhs}</p>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm text-destructive">Failed to load rates</h3>
            <p className="text-xs text-destructive/80">Please refresh the page to try again</p>
          </div>
        )}

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
              disabled={isLoading || isLoadingRates}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GH₵)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="50"
              min="0.1"
              max="100"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              required
              disabled={isLoading || isLoadingRates}
            />
            {conversion && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md space-y-1">
                <p className="text-sm font-medium text-foreground">
                  You'll receive: <strong className="text-primary">{conversion.output.satoshis.toLocaleString()}</strong> sats
                </p>
                <p className="text-xs text-muted-foreground">
                  ≈ {conversion.output.formattedUsd}
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Amount range: GH₵0.10 - GH₵100.00
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lightning_address">Lightning Address</Label>
            <Input
              id="lightning_address"
              type="text"
              placeholder="username@blink.sv"
              value={formData.lightning_address}
              onChange={(e) => handleChange("lightning_address", e.target.value)}
              required
              disabled={isLoading || isLoadingRates}
            />
            {lightningAddressValid === true && (
              <p className="text-xs text-primary flex items-center gap-1">
                <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Valid Lightning Address
              </p>
            )}
            {lightningAddressValid === false && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                Invalid format
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Don't have one? Get a free Lightning Address at{" "}
              <a href="https://blink.sv" target="_blank" rel="noopener noreferrer" className="underline">
                Blink.sv
              </a>
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
              disabled={isLoading || isLoadingRates}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Mobile Money Provider</Label>
            <Select
              id="provider"
              value={formData.provider}
              onChange={(e) => handleChange("provider", e.target.value)}
              disabled={isLoading || isLoadingRates}
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

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            disabled={isLoading || isLoadingRates || !lightningAddressValid}
          >
            {isLoadingRates ? (
              <span className="flex items-center gap-2">
                <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading rates...
              </span>
            ) : isLoading ? (
              <span className="flex items-center gap-2">
                <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                </svg>
                Buy BTC
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
