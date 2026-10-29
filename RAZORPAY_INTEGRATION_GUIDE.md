# WARRIER - Razorpay Integration Blueprint (For Future Use)

This document contains the complete, zero-cost blueprint to integrate **Razorpay** into WARRIER whenever you are ready to launch publicly and collect payments in India via **UPI (GPay, PhonePe, Paytm)**, **RuPay / Debit / Credit Cards**, and **Net Banking**.

---

## 1. Zero-Cost Account Setup Checklist
- [ ] Sign up at [razorpay.com](https://razorpay.com) (Free, no setup fee, no annual fee).
- [ ] Select business type as **"Individual / Unregistered"** (No GST or company registration required for starting).
- [ ] Toggle to **"Test Mode"** in the dashboard.
- [ ] Go to **Settings &rarr; API Keys &rarr; Generate Key**.
- [ ] Copy your `Key ID` (e.g., `rzp_test_xxxxxxxxxxxxxx`).

---

## 2. Ready-to-Use Checkout Script

When you are ready to enable payments, add this code:

### Step A: Include Razorpay Script in `index.html`
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Step B: Trigger Checkout Function
```javascript
function launchRazorpayCheckout(planType = 'monthly') {
  const isAnnual = planType === 'annual';
  const amountInPaise = isAnnual ? 49900 : 9900; // ₹499 or ₹99 (amount in paise)

  const options = {
    key: "YOUR_RAZORPAY_KEY_ID", // Replace with your rzp_test_... or rzp_live_... key
    amount: amountInPaise,
    currency: "INR",
    name: "WARRIER Enterprise",
    description: isAnnual ? "Annual Pro Plan (Unlimited Bills & WhatsApp Alerts)" : "Monthly Pro Plan",
    image: "https://your-domain.com/assets/logo.png", // Or local logo path
    handler: function (response) {
      // Payment Successful!
      console.log("Payment ID:", response.razorpay_payment_id);
      alert(`Payment Successful! Reference: ${response.razorpay_payment_id}. Your Pro features are now active.`);
      
      // Store Pro status in LocalStorage or Database
      localStorage.setItem('warrier_plan', 'pro');
      location.reload();
    },
    prefill: {
      name: "Customer Name",
      email: "user@example.com",
      contact: "9876543210"
    },
    notes: {
      plan: planType
    },
    theme: {
      color: "#2563eb" // Matches WARRIER's cobalt primary theme
    }
  };

  const rzp = new Razorpay(options);
  
  // Handle failed/dismissed payments gracefully
  rzp.on('payment.failed', function (response) {
    alert("Payment could not be completed: " + response.error.description);
  });

  rzp.open();
}
```

---

## 3. Supported Payment Methods Automatically Available
Once `rzp.open()` is called, Razorpay automatically handles:
1. **UPI Intent:** Automatically opens Google Pay, PhonePe, or Paytm app on Android/iOS.
2. **UPI QR Code:** Displays a live scan-to-pay QR code for desktop users.
3. **Cards:** RuPay, Visa, Mastercard, American Express (Debit & Credit cards).
4. **Net Banking:** 50+ Indian banks (SBI, HDFC, ICICI, Axis, Kotak, etc.).
5. **Wallets:** Amazon Pay, Mobikwik, Airtel Money.

---

## 4. Recommended Indian SaaS Pricing Model
* **Free Tier:** Up to 10 product bills + basic in-browser due date warnings.
* **Pro Tier (₹99 / Month or ₹499 / Year):**
  * Unlimited bill receipt storage
  * Multi-device cloud sync
  * WhatsApp & SMS expiry alerts 24 hours before penalty fees occur
  * Automated AI bill photo scanner

