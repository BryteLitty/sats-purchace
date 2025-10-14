# API Integration Guide

## Getting Started

### Prerequisites
- Node.js installed
- Environment variables configured in `.env`

### Start the Server

```bash
npm run dev
```

The server will run on `http://localhost:3000`

---

## API Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T23:21:07.087Z"
}
```

---

### 2. Create Charge (Initiate Payment)

**POST** `/paystack/charge`

Initiate a mobile money payment. This will trigger an OTP to be sent to the user's phone. Upon successful payment, the system will automatically send Bitcoin to the provided Lightning address.

**Request Body:**
```json
{
  "email": "user@example.com",
  "amount": "1000",
  "currency": "GHS",
  "lightning_address": "lnbc10n1p3...",
  "mobile_money": {
    "phone": "0551234987",
    "provider": "mtn"
  },
  "metadata": {
    "custom_fields": [
      {
        "display_name": "Purchase type",
        "variable_name": "purchase_type",
        "value": "BTC Purchase"
      }
    ]
  }
}
```

**Parameters:**
- `email` (string, required): Customer's email address
- `amount` (string, required): Amount in the smallest currency unit (e.g., pesewas for GHS)
- `currency` (string, required): Currency code (e.g., "GHS", "NGN")
- `lightning_address` (string, required): Lightning Network invoice (BOLT11 format) where Bitcoin will be sent
- `mobile_money` (object, required):
  - `phone` (string): Customer's phone number
  - `provider` (string): Mobile money provider (e.g., "mtn", "vodafone", "tigo")
- `metadata` (object, optional): Additional information about the transaction

**Example cURL:**
```bash
curl -X POST http://localhost:3000/paystack/charge \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "amount": "1000",
    "currency": "GHS",
    "lightning_address": "lnbc10n1p3...",
    "mobile_money": {
      "phone": "0551234987",
      "provider": "mtn"
    },
    "metadata": {
      "custom_fields": [
        {
          "display_name": "Purchase type",
          "variable_name": "purchase_type",
          "value": "BTC Purchase"
        }
      ]
    }
  }'
```

**Success Response:**
```json
{
  "status": true,
  "message": "Charge attempted",
  "data": {
    "reference": "abc123xyz",
    "status": "send_otp",
    "display_text": "Please enter OTP sent to phone"
  }
}
```

**Important:** Save the `reference` value - you'll need it to submit the OTP.

---

### 3. Submit OTP (Complete Payment)

**POST** `/paystack/submit-otp`

Submit the OTP that was sent to the user's phone to complete the payment authorization.

**Request Body:**
```json
{
  "otp": "123456",
  "reference": "abc123xyz"
}
```

**Parameters:**
- `otp` (string, required): The 6-digit OTP sent to the user's phone
- `reference` (string, required): The reference from the charge response

**Example cURL:**
```bash
curl -X POST http://localhost:3000/paystack/submit-otp \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456",
    "reference": "abc123xyz"
  }'
```

**Success Response:**
```json
{
  "status": true,
  "message": "Charge attempted",
  "data": {
    "reference": "abc123xyz",
    "status": "success",
    "amount": 1000,
    "currency": "GHS"
  }
}
```

---

### 4. Verify Transaction

**GET** `/paystack/verify/:reference`

Verify the status of a transaction using Paystack's verification endpoint.

**Example cURL:**
```bash
curl http://localhost:3000/paystack/verify/abc123xyz
```

**Success Response:**
```json
{
  "status": true,
  "message": "Verification successful",
  "data": {
    "reference": "abc123xyz",
    "amount": 1000,
    "currency": "GHS",
    "status": "success",
    "channel": "mobile_money"
  }
}
```

---

### 5. Poll Transaction Status

**GET** `/transactions/status/:reference`

Poll the database to check the current status of a transaction. This is useful for checking payment status before making decisions.

**Example cURL:**
```bash
curl http://localhost:3000/transactions/status/abc123xyz
```

**Success Response:**
```json
{
  "reference": "abc123xyz",
  "status": "success",
  "amount": 1000,
  "currency": "GHS",
  "email": "user@example.com",
  "payment_channel": "mobile_money",
  "created_at": "2025-10-07T23:21:07.087Z",
  "updated_at": "2025-10-07T23:22:15.123Z"
}
```

**Possible Status Values:**
- `pending` - Transaction initiated, awaiting payment
- `success` - Payment successful, Bitcoin sent to Lightning address
- `failed` - Payment failed

---

### 6. Get All Transactions

**GET** `/transactions/all`

Retrieve all transactions from the database.

**Example cURL:**
```bash
curl http://localhost:3000/transactions/all
```

---

### 7. Get Transactions by Email

**GET** `/transactions/email/:email`

Retrieve all transactions for a specific email address.

**Example cURL:**
```bash
curl http://localhost:3000/transactions/email/user@example.com
```

---

## Payment Flow

```
1. User provides Lightning invoice and initiates payment
   ↓
2. Call POST /paystack/charge with lightning_address
   ↓
3. Transaction saved to database with status "pending"
   ↓
4. Paystack sends OTP to user's phone
   ↓
5. User receives and enters OTP
   ↓
6. Call POST /paystack/submit-otp with OTP and reference
   ↓
7. Payment completed → Paystack sends webhook
   ↓
8. Webhook updates transaction status to "success"
   ↓
9. System automatically sends Bitcoin to Lightning address
   ↓
10. Poll GET /transactions/status/:reference to confirm completion
```

---

## Webhook Integration

The system automatically handles Paystack webhooks at `/webhook`.

**What happens on successful payment:**
1. Webhook signature is verified
2. Transaction status is updated in the database
3. Lightning invoice is automatically paid using the stored `lightning_address`
4. Success/failure is logged

**Webhook Events Handled:**
- `charge.success` - Updates status and pays Lightning invoice
- `charge.failed` - Updates status to failed

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": {
    "message": "Error description",
    "code": "error_code"
  }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `422` - Validation Error
- `500` - Server Error

---

## Environment Variables

Required in `.env`:

```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**Note:** Use test keys for development. Switch to live keys in production.

---

## Testing

### Test Mobile Money Providers
- MTN
- Vodafone
- AirtelTigo

### Test Phone Numbers
Refer to Paystack documentation for test phone numbers that simulate different scenarios.

---

## Security Notes

1. **Never expose your secret key** - Keep it in `.env` and add `.env` to `.gitignore`
2. **Use HTTPS in production** - Never send API requests over HTTP in production
3. **Validate user input** - Always validate and sanitize input on the backend
4. **Implement rate limiting** - Protect against abuse
5. **Monitor transactions** - Set up logging and monitoring for all payment activities

---

## Support

For Paystack-specific issues, refer to:
- Paystack Documentation: https://paystack.com/docs
- Paystack API Reference: https://paystack.com/docs/api
