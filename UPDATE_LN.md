# Frontend Implementation - Simple Guide

## Overview
User sees live rates → Enters amount → Gets instant conversion → Pays → Receives Bitcoin

---

## 1. Display Live Rates (Auto-refresh every 5 minutes)

### API Call
```javascript
GET /lightning/rates
```

### Response
```json
{
  "rates": {
    "btcToUsd": 95000,
    "btcToGhs": 1248350,
    "ghsToUsd": 13.14
  },
  "explanation": {
    "btcToUsd": "1 BTC = $95,000",
    "btcToGhs": "1 BTC = GH₵1,248,350",
    "ghsToUsd": "1 USD = GH₵13.14 (from Bitnob)"
  }
}
```

### Implementation
```javascript
// Fetch and display rates
async function fetchRates() {
  const response = await fetch('http://localhost:5000/lightning/rates');
  const data = await response.json();

  // Display on page
  document.getElementById('btc-price').textContent = data.explanation.btcToGhs;
  document.getElementById('usd-rate').textContent = `$1 = GH₵${data.rates.ghsToUsd}`;
}

// Initial fetch
fetchRates();

// Auto-refresh every 5 minutes
setInterval(fetchRates, 5 * 60 * 1000);
```

---

## 2. Real-time Amount Conversion

### User enters GHS → Show USD & Sats

### API Call
```javascript
POST /lightning/convert
Content-Type: application/json

{
  "amount": 100000,  // GH₵1000 in pesewas
  "currency": "GHS"
}
```

### Response
```json
{
  "input": {
    "amountInMainUnit": 1000
  },
  "output": {
    "satoshis": 8007,
    "btcAmount": 0.00008007,
    "usdEquivalent": 76.05,
    "formattedUsd": "$76.05"
  }
}
```

### Implementation
```javascript
let debounceTimer;

function onAmountChange(ghsAmount) {
  clearTimeout(debounceTimer);

  // Debounce: Wait 500ms after user stops typing
  debounceTimer = setTimeout(async () => {
    const pesewas = Math.floor(ghsAmount * 100);

    const response = await fetch('http://localhost:5000/lightning/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: pesewas, currency: 'GHS' })
    });

    const data = await response.json();

    // Display results
    document.getElementById('sats-amount').textContent = data.output.satoshis.toLocaleString();
    document.getElementById('usd-equivalent').textContent = data.output.formattedUsd;

  }, 500);
}

// Attach to input
document.getElementById('ghs-input').addEventListener('input', (e) => {
  onAmountChange(e.target.value);
});
```

---

## 3. Lightning Address Input

### What is a Lightning Address?
Format: `username@domain.com` (like email)

### Validation
```javascript
function validateLightningAddress(address) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(address);
}

document.getElementById('lightning-address').addEventListener('input', (e) => {
  const isValid = validateLightningAddress(e.target.value);

  if (isValid) {
    // Show green checkmark
    document.getElementById('address-status').textContent = '✓ Valid';
    document.getElementById('address-status').style.color = 'green';
  } else if (e.target.value.length > 0) {
    // Show error
    document.getElementById('address-status').textContent = '✗ Invalid format';
    document.getElementById('address-status').style.color = 'red';
  }
});
```

### Help Text
```html
<small>
  Don't have one? Get a free Lightning Address at
  <a href="https://blink.sv" target="_blank">Blink.sv</a>
</small>
```

---

## 4. Complete Payment Flow

### Step 1: Initialize Payment
```javascript
async function initializePayment() {
  const email = document.getElementById('email').value;
  const ghsAmount = document.getElementById('ghs-input').value;
  const lightningAddress = document.getElementById('lightning-address').value;

  const response = await fetch('http://localhost:5000/paystack/charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      amount: ghsAmount,
      currency: 'GHS',
      lightning_address: lightningAddress
    })
  });

  const data = await response.json();

  // Redirect to Paystack or open popup
  window.location.href = data.data.authorization_url;
}
```

### Step 2: After Payment (Redirect back)
User returns to: `https://yoursite.com/success?reference=PAY_abc123`

### Step 3: Check Transaction Status
```javascript
async function checkTransactionStatus(reference) {
  const response = await fetch(`http://localhost:5000/transactions/${reference}`);
  const transaction = await response.json();

  return {
    paymentStatus: transaction.status,              // "success"
    lightningStatus: transaction.lightning_payment_status,  // "SUCCESS"
    satoshisReceived: transaction.satoshis_amount,
    lightningAddress: transaction.lightning_address
  };
}

// Poll every 3 seconds until lightning payment completes
const pollInterval = setInterval(async () => {
  const status = await checkTransactionStatus(reference);

  if (status.lightningStatus === 'SUCCESS') {
    clearInterval(pollInterval);
    showSuccessMessage();
  } else if (status.lightningStatus === 'FAILED') {
    clearInterval(pollInterval);
    showErrorMessage();
  }
}, 3000);
```

---

## 5. Simple HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>Buy Bitcoin</title>
</head>
<body>
  <!-- Live Rates -->
  <div class="rates">
    <h3>Live Rates (Updates every 5 min)</h3>
    <p id="btc-price">Loading...</p>
    <p id="usd-rate">Loading...</p>
  </div>

  <!-- Purchase Form -->
  <form id="buy-form">
    <label>Email</label>
    <input type="email" id="email" required />

    <label>Amount (GH₵)</label>
    <input type="number" id="ghs-input" placeholder="1000" required />

    <div class="conversion-result">
      <p>You'll receive: <strong id="sats-amount">-</strong> sats</p>
      <p>≈ <span id="usd-equivalent">$0.00</span></p>
    </div>

    <label>Lightning Address</label>
    <input type="text" id="lightning-address" placeholder="username@blink.sv" required />
    <small id="address-status"></small>

    <button type="submit">Pay Now</button>
  </form>
</body>
</html>
```

---

## 6. What to Expect

### Timeline
1. **User enters amount** → See conversion instantly (< 1 second)
2. **User clicks "Pay"** → Transaction created, redirected to Paystack
3. **User completes payment** → Redirected back (5-30 seconds)
4. **Webhook triggers** → Bitcoin sent to Lightning Address (2-5 seconds)
5. **User sees success** → Transaction complete

### Transaction Statuses

#### Payment Status (`status`)
- `pending` - Waiting for payment
- `success` - Payment received
- `failed` - Payment failed

#### Lightning Status (`lightning_payment_status`)
- `pending` - Not sent yet
- `SUCCESS` - Bitcoin delivered ✓
- `FAILED` - Bitcoin sending failed (rare)

---

## 7. Error Handling

### Common Errors

**Invalid Lightning Address**
```javascript
if (!validateLightningAddress(address)) {
  alert('Please enter a valid Lightning Address (e.g., username@blink.sv)');
  return;
}
```

**Minimum Amount**
```javascript
const MIN_AMOUNT = 10; // GH₵10

if (ghsAmount < MIN_AMOUNT) {
  alert(`Minimum amount is GH₵${MIN_AMOUNT}`);
  return;
}
```

**Payment Failed**
```javascript
if (transaction.status === 'failed') {
  alert('Payment failed. Please try again.');
}
```

**Lightning Payment Failed**
```javascript
if (transaction.lightning_payment_status === 'FAILED') {
  alert('Payment received but Bitcoin transfer failed. Contact support with reference: ' + reference);
}
```

---

## 8. Complete JavaScript Example

```javascript
const API_BASE = 'http://localhost:5000';

// 1. Fetch and display rates
async function updateRates() {
  const res = await fetch(`${API_BASE}/lightning/rates`);
  const data = await res.json();
  document.getElementById('btc-price').textContent = data.explanation.btcToGhs;
  document.getElementById('usd-rate').textContent = `$1 = GH₵${data.rates.ghsToUsd}`;
}

updateRates();
setInterval(updateRates, 5 * 60 * 1000);

// 2. Convert amount on input
let timer;
document.getElementById('ghs-input').addEventListener('input', (e) => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const pesewas = Math.floor(e.target.value * 100);
    const res = await fetch(`${API_BASE}/lightning/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: pesewas, currency: 'GHS' })
    });
    const data = await res.json();
    document.getElementById('sats-amount').textContent = data.output.satoshis.toLocaleString();
    document.getElementById('usd-equivalent').textContent = data.output.formattedUsd;
  }, 500);
});

// 3. Validate Lightning Address
document.getElementById('lightning-address').addEventListener('input', (e) => {
  const valid = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.target.value);
  document.getElementById('address-status').textContent = valid ? '✓ Valid' : '✗ Invalid';
});

// 4. Submit payment
document.getElementById('buy-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const res = await fetch(`${API_BASE}/paystack/charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      amount: document.getElementById('ghs-input').value,
      currency: 'GHS',
      lightning_address: document.getElementById('lightning-address').value
    })
  });

  const data = await res.json();
  window.location.href = data.data.authorization_url;
});
```

---

## 9. Success Page (After Paystack Redirect)

```javascript
// Get reference from URL: ?reference=PAY_abc123
const urlParams = new URLSearchParams(window.location.search);
const reference = urlParams.get('reference');

async function checkStatus() {
  const res = await fetch(`${API_BASE}/transactions/${reference}`);
  const tx = await res.json();

  // Show payment details
  document.getElementById('amount-paid').textContent = `GH₵${(tx.amount / 100).toFixed(2)}`;
  document.getElementById('sats-received').textContent = tx.satoshis_amount.toLocaleString();
  document.getElementById('lightning-address').textContent = tx.lightning_address;

  // Check lightning status
  if (tx.lightning_payment_status === 'SUCCESS') {
    document.getElementById('status').textContent = '✓ Bitcoin Sent Successfully!';
    document.getElementById('status').style.color = 'green';
  } else if (tx.lightning_payment_status === 'FAILED') {
    document.getElementById('status').textContent = '✗ Bitcoin Transfer Failed';
    document.getElementById('status').style.color = 'red';
  } else {
    document.getElementById('status').textContent = '⏳ Sending Bitcoin...';
    // Keep polling
    setTimeout(checkStatus, 3000);
  }
}

checkStatus();
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/lightning/rates` | Get all exchange rates |
| POST | `/lightning/convert` | Convert GHS to sats |
| POST | `/paystack/charge` | Initialize payment |
| GET | `/transactions/:reference` | Check transaction status |

---

## Testing Checklist

- [ ] Live rates display and refresh every 5 min
- [ ] Amount input converts to sats/USD instantly
- [ ] Lightning address validation works
- [ ] Payment redirects to Paystack
- [ ] After payment, returns with reference
- [ ] Success page shows transaction details
- [ ] Lightning status updates correctly
- [ ] Error messages display properly

---

## Environment Variable

```javascript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

---

**That's it!** Simple, clean, and straightforward implementation.
