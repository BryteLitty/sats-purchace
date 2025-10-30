# BulkClix Frontend Implementation Guide

## Overview

This guide explains how to integrate BulkClix mobile money payments on your frontend. BulkClix replaces Paystack for mobile money payments in Ghana (MTN, Telecel, AirtelTigo).

---

## API Endpoints

### Base URL
```
Production: https://your-domain.com
Development: http://localhost:3000
```

### Available Endpoints

#### 1. Initialize Payment
```
POST /bulkclix/initialize
```

#### 2. Check Payment Status
```
GET /bulkclix/check-status/:reference
```

---

## Payment Flow

```
User fills form → Initialize payment → User approves on phone → Poll status → Payment complete → Lightning sent
```

**Timeline:**
- Initialization: ~2-5 seconds
- User approval: 30 seconds - 5 minutes
- Status detection: Automatic (polling every 30s) or manual (frontend polls every 5s)
- Lightning payment: Automatic after payment success

---

## 1. Initialize Payment

### Request

**Endpoint:** `POST /bulkclix/initialize`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "email": "user@example.com",
  "amount": "10",
  "currency": "GHS",
  "lightning_address": "user@getalby.com",
  "phone_number": "0541008285",
  "network": "MTN"
}
```

**Field Descriptions:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `email` | string | Yes | User's email address | `"user@example.com"` |
| `amount` | string | Yes | Amount in GHS (main unit) | `"10"` (means 10 GHS) |
| `currency` | string | Yes | Currency code | `"GHS"` |
| `lightning_address` | string | Yes | Lightning address to receive sats | `"user@getalby.com"` |
| `phone_number` | string | Yes | Phone number (10 digits, with leading 0) | `"0541008285"` |
| `network` | string | Yes | Mobile money network | `"MTN"`, `"TELECEL"`, or `"AIRTELTIGO"` |

**Network Mapping:**
- `MTN` → MTN Mobile Money
- `TELECEL` → Telecel Cash (formerly Vodafone Cash)
- `AIRTELTIGO` → AirtelTigo Money

### Response

**Success (200):**
```json
{
  "success": true,
  "reference": "f69df26b7d7848eed8cb8de3270f08ae",
  "bulkclix_transaction_id": "f69df26b7d7848eed8cb8de3270f08ae",
  "status": "pending",
  "message": "Payment initialized. Please check your phone to complete the payment.",
  "data": {
    "amount": 10,
    "transaction_id": "f69df26b7d7848eed8cb8de3270f08ae",
    "ext_transaction_id": "810967569684",
    "phone_number": "0541008285"
  }
}
```

**Error (400/500):**
```json
{
  "error": "Missing required fields",
  "required": ["email", "amount", "currency", "lightning_address", "phone_number", "network"]
}
```

---

## 2. Check Payment Status

### Request

**Endpoint:** `GET /bulkclix/check-status/:reference`

**Parameters:**
- `reference` - The reference returned from initialize payment

**Example:**
```
GET /bulkclix/check-status/f69df26b7d7848eed8cb8de3270f08ae
```

### Response

**Success (200):**
```json
{
  "success": true,
  "reference": "f69df26b7d7848eed8cb8de3270f08ae",
  "status": "success",
  "lightning_payment_status": "SUCCESS",
  "amount": "1000",
  "satoshis_amount": "680",
  "bulkclix_data": {
    "status": "success",
    "transaction_id": "f69df26b7d7848eed8cb8de3270f08ae",
    "ext_transaction_id": "810967569684",
    "amount": "10.00"
  }
}
```

**Status Values:**
- `pending` - Waiting for user to approve on phone
- `success` - Payment completed successfully
- `failed` - Payment failed

**Lightning Payment Status:**
- `null` - Not yet processed
- `pending` - Lightning payment queued
- `processing` - Lightning payment in progress
- `SUCCESS` - Lightning payment completed
- `FAILED` - Lightning payment failed (user still paid, manual refund needed)

---

## Frontend Implementation Examples

### React/TypeScript Example

```typescript
import { useState } from 'react';

interface PaymentData {
  email: string;
  amount: string;
  currency: string;
  lightning_address: string;
  phone_number: string;
  network: 'MTN' | 'TELECEL' | 'AIRTELTIGO';
}

interface PaymentResponse {
  success: boolean;
  reference: string;
  status: string;
  message: string;
}

interface StatusResponse {
  success: boolean;
  status: 'pending' | 'success' | 'failed';
  lightning_payment_status: string | null;
  satoshis_amount: string;
}

export function BulkClixPayment() {
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);

  // Step 1: Initialize Payment
  const initializePayment = async (data: PaymentData) => {
    setLoading(true);

    try {
      const response = await fetch('/bulkclix/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: PaymentResponse = await response.json();

      if (result.success) {
        setReference(result.reference);
        // Start polling for status
        startPolling(result.reference);
      } else {
        alert('Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Poll for Payment Status
  const checkStatus = async (ref: string) => {
    try {
      const response = await fetch(`/bulkclix/check-status/${ref}`);
      const result: StatusResponse = await response.json();

      setStatus(result);
      return result;
    } catch (error) {
      console.error('Status check error:', error);
      return null;
    }
  };

  // Step 3: Start Polling (check every 5 seconds)
  const startPolling = (ref: string) => {
    const interval = setInterval(async () => {
      const result = await checkStatus(ref);

      if (result?.status === 'success') {
        clearInterval(interval);

        // Check Lightning payment status
        if (result.lightning_payment_status === 'SUCCESS') {
          alert(`Payment successful! ${result.satoshis_amount} sats sent to your Lightning address.`);
        } else {
          alert('Payment received, processing Lightning payment...');
        }
      } else if (result?.status === 'failed') {
        clearInterval(interval);
        alert('Payment failed. Please try again.');
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 10 minutes (timeout)
    setTimeout(() => {
      clearInterval(interval);
      if (status?.status === 'pending') {
        alert('Payment timeout. Please contact support if you completed the payment.');
      }
    }, 600000); // 10 minutes
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data: PaymentData = {
      email: formData.get('email') as string,
      amount: formData.get('amount') as string,
      currency: 'GHS',
      lightning_address: formData.get('lightning_address') as string,
      phone_number: formData.get('phone_number') as string,
      network: formData.get('network') as 'MTN' | 'TELECEL' | 'AIRTELTIGO',
    };

    initializePayment(data);
  };

  return (
    <div>
      <h2>Buy Bitcoin</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
        />

        <input
          type="text"
          name="lightning_address"
          placeholder="Lightning Address (e.g., user@getalby.com)"
          required
        />

        <input
          type="number"
          name="amount"
          placeholder="Amount (GHS)"
          min="1"
          step="0.01"
          required
        />

        <input
          type="tel"
          name="phone_number"
          placeholder="Phone Number (e.g., 0541008285)"
          pattern="0[0-9]{9}"
          required
        />

        <select name="network" required>
          <option value="">Select Network</option>
          <option value="MTN">MTN Mobile Money</option>
          <option value="TELECEL">Telecel Cash</option>
          <option value="AIRTELTIGO">AirtelTigo Money</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Pay with Mobile Money'}
        </button>
      </form>

      {/* Status Display */}
      {status && (
        <div>
          <h3>Payment Status</h3>
          <p>Status: {status.status}</p>
          <p>Lightning: {status.lightning_payment_status || 'Pending'}</p>
          {status.satoshis_amount && (
            <p>Amount: {status.satoshis_amount} sats</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Vanilla JavaScript Example

```javascript
// Initialize Payment
async function initializePayment(paymentData) {
  const response = await fetch('/bulkclix/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Payment initialized:', result.reference);
    startPolling(result.reference);
  }
}

// Check Payment Status
async function checkStatus(reference) {
  const response = await fetch(`/bulkclix/check-status/${reference}`);
  return await response.json();
}

// Poll for Status Updates
function startPolling(reference) {
  const interval = setInterval(async () => {
    const status = await checkStatus(reference);

    if (status.status === 'success') {
      clearInterval(interval);

      if (status.lightning_payment_status === 'SUCCESS') {
        alert(`Success! ${status.satoshis_amount} sats sent!`);
      }
    } else if (status.status === 'failed') {
      clearInterval(interval);
      alert('Payment failed');
    }
  }, 5000);

  // Timeout after 10 minutes
  setTimeout(() => clearInterval(interval), 600000);
}

// Example Usage
initializePayment({
  email: 'user@example.com',
  amount: '10',
  currency: 'GHS',
  lightning_address: 'user@getalby.com',
  phone_number: '0541008285',
  network: 'MTN'
});
```

---

## User Experience Flow

### 1. User Fills Form
```
┌─────────────────────────────┐
│  Buy Bitcoin               │
│                            │
│  Email: user@example.com   │
│  Lightning: user@getalby.. │
│  Amount: 10 GHS            │
│  Phone: 0541008285         │
│  Network: [MTN ▼]          │
│                            │
│  [Pay with Mobile Money]   │
└─────────────────────────────┘
```

### 2. Payment Initialized
```
┌─────────────────────────────┐
│  ✓ Payment Initialized     │
│                            │
│  Check your phone to       │
│  approve the payment       │
│                            │
│  Waiting... [••••••••]     │
└─────────────────────────────┘
```

### 3. User Receives Phone Prompt
```
📱 User's Phone:
┌─────────────────────────────┐
│  MTN Mobile Money          │
│                            │
│  Confirm Payment           │
│  Amount: GHS 10.00         │
│  To: BulkClix              │
│                            │
│  [Approve]  [Decline]      │
└─────────────────────────────┘
```

### 4. Payment Processing
```
┌─────────────────────────────┐
│  ⏳ Processing Payment      │
│                            │
│  Payment approved!         │
│  Converting to Bitcoin...  │
│                            │
│  Please wait... [•••••]    │
└─────────────────────────────┘
```

### 5. Payment Complete
```
┌─────────────────────────────┐
│  ✅ Payment Successful!     │
│                            │
│  680 sats sent to:         │
│  user@getalby.com          │
│                            │
│  Transaction ID:           │
│  f69df26b7d7848ee...       │
│                            │
│  [View Transaction] [Done] │
└─────────────────────────────┘
```

---

## Error Handling

### Common Errors

#### 1. Missing Fields
```json
{
  "error": "Missing required fields",
  "required": ["email", "amount", "currency", "lightning_address", "phone_number", "network"]
}
```

**Solution:** Ensure all fields are provided and not empty.

#### 2. Invalid Network
```json
{
  "error": "Invalid network",
  "validNetworks": ["MTN", "TELECEL", "AIRTELTIGO"]
}
```

**Solution:** Use one of the valid network values.

#### 3. Invalid Phone Number
**Validation:** Phone number must be 10 digits starting with 0 (e.g., `0541008285`)

```javascript
const isValidPhone = (phone) => /^0[0-9]{9}$/.test(phone);
```

#### 4. Payment Timeout
If user doesn't approve within 10 minutes, stop polling and show message:
```
"Payment timeout. If you approved the payment, please contact support with reference: [reference]"
```

#### 5. Lightning Payment Failed
If `status === 'success'` but `lightning_payment_status === 'FAILED'`:
```
"Payment received but Lightning transfer failed. We will process it manually. Reference: [reference]"
```

---

## Best Practices

### 1. Input Validation
```javascript
// Validate phone number (10 digits, starts with 0)
const validatePhone = (phone) => {
  const phoneRegex = /^0[0-9]{9}$/;
  return phoneRegex.test(phone);
};

// Validate Lightning address
const validateLightningAddress = (address) => {
  const lnRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return lnRegex.test(address);
};

// Validate amount (minimum 1 GHS)
const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 1;
};
```

### 2. Polling Strategy
- Poll every **5 seconds** on frontend
- Stop after **10 minutes** (timeout)
- Backend also polls every **30 seconds** (backup)

### 3. User Feedback
- Show loading states during initialization
- Display clear instructions: "Check your phone to approve payment"
- Show real-time status updates
- Display satoshis amount when payment completes

### 4. Error Recovery
```javascript
// Retry logic for failed requests
async function initializeWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/bulkclix/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) return await response.json();

      if (i === maxRetries - 1) throw new Error('Max retries reached');

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### 5. Save Reference
Always save the payment reference for support queries:
```javascript
// Store in localStorage
localStorage.setItem('lastPaymentRef', result.reference);

// Or send to analytics
analytics.track('payment_initiated', {
  reference: result.reference,
  amount: data.amount,
});
```

---

## Testing

### Test Data
Use these for testing:

**Test Phone Numbers:**
- MTN: `0249013159`
- Telecel: `0502000000`
- AirtelTigo: `0272000000`

**Test Amounts:**
- Minimum: `1` GHS
- Recommended for testing: `1` GHS (68 sats)

**Test Lightning Address:**
- Use your own: `yourname@bitnob.io` or `yourname@getalby.com`

### Test Flow
1. Initialize payment with 1 GHS
2. Approve on phone
3. Verify status changes to "success"
4. Verify Lightning payment status is "SUCCESS"
5. Check Lightning wallet for sats received

---

## Migration from Paystack

If you're migrating from Paystack:

### Changes Required

1. **Endpoint Change:**
   ```diff
   - POST /paystack/initialize
   + POST /bulkclix/initialize

   - GET /paystack/verify/:reference
   + GET /bulkclix/check-status/:reference
   ```

2. **Request Body:**
   ```diff
   {
     "email": "user@example.com",
     "amount": "10",
     "currency": "GHS",
     "lightning_address": "user@getalby.com",
   + "phone_number": "0541008285",
   + "network": "MTN"
   }
   ```

3. **No Redirect:**
   - Paystack: User redirects to Paystack page
   - BulkClix: User stays on your page, approves on phone

4. **Polling Required:**
   - Paystack: Callback URL or redirect
   - BulkClix: Frontend must poll for status

---

## Support

### Common Issues

**Q: User approved payment but status is still "pending"?**
A: Wait up to 60 seconds. Backend polls every 30s. If still pending after 2 minutes, check BulkClix dashboard.

**Q: Payment successful but Lightning failed?**
A: The user's payment was received. Lightning payment will be retried or processed manually. Save the reference for support.

**Q: How long does Lightning payment take?**
A: Usually instant (< 5 seconds) once MoMo payment is confirmed.

**Q: What's the minimum amount?**
A: 1 GHS minimum. Recommended minimum is 5 GHS for better Lightning compatibility.

---

## Security Notes

1. **Never expose API keys** in frontend code
2. **Validate all inputs** on both frontend and backend
3. **Use HTTPS** in production
4. **Store references** for audit trail
5. **Don't trust client-side status** - always verify on backend

---

## Production Checklist

- [ ] Update `.env` with production `BULKCLIX_CALLBACK_URL`
- [ ] Test with real payments (small amounts)
- [ ] Verify Lightning payments are sent correctly
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Add analytics tracking
- [ ] Test all mobile networks (MTN, Telecel, AirtelTigo)
- [ ] Verify polling timeout works (10 minutes)
- [ ] Test error scenarios (failed payments, timeouts)
- [ ] Update frontend environment variables
- [ ] Deploy and test on production domain

---

## Complete Integration Summary

**Backend:**
- `POST /bulkclix/initialize` - Start payment
- `GET /bulkclix/check-status/:ref` - Check status
- `POST /webhook/bulkclix` - Receive webhooks (backup)
- Background polling service - Auto-check pending payments

**Frontend:**
1. Collect payment info (email, amount, Lightning address, phone, network)
2. Call `/bulkclix/initialize`
3. Display "Check your phone" message
4. Poll `/bulkclix/check-status/:ref` every 5 seconds
5. Show success when `status === 'success'` and `lightning_payment_status === 'SUCCESS'`

**User Journey:**
1. Fill form → 2. Approve on phone → 3. Receive sats

**Time:** ~30 seconds - 5 minutes total

---

## Questions?

For technical support or questions, contact your backend team or check the backend implementation docs.

**Happy coding! 🚀**
