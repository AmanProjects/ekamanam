# 🚀 Razorpay Quick Start - 10 Minutes to Payment

Razorpay is India's leading payment gateway with support for UPI, Cards, Net Banking, and Wallets.

---

## Step 1: Create Razorpay Account (3 mins)

1. Go to https://dashboard.razorpay.com/signup
2. Sign up with your email
3. Complete business verification:
   - Business name: "Ekamanam"
   - Business type: "Education/EdTech"
   - Website: Your website URL

---

## Step 2: Get API Keys (1 min)

1. Go to **Settings** → **API Keys**
2. Click **Generate Test Keys** (for testing)
3. Copy:
   - **Key ID** (starts with `rzp_test_...`)
   - **Key Secret** (starts with `...`) - **Keep this secret!**

---

## Step 3: Configure Environment (2 mins)

### Frontend (.env)

Open `.env` file and add:

```bash
# Razorpay Key ID (already in .env)
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_actual_key_here
```

### Firebase Functions

```bash
# Set Razorpay keys in Firebase Functions config
firebase functions:config:set razorpay.key_id="rzp_test_your_key_id"
firebase functions:config:set razorpay.key_secret="your_key_secret_here"

# Set webhook secret (generate a random string)
firebase functions:config:set razorpay.webhook_secret="your_random_webhook_secret_here"

# View config
firebase functions:config:get
```

---

## Step 4: Deploy Functions (2 mins)

```bash
# Deploy Razorpay functions
firebase deploy --only functions

# Note the URLs - you'll need them for webhooks
```

---

## Step 5: Test Payment (2 mins)

```bash
# Start app
npm start

# Test with Razorpay test credentials:
```

### Test Cards

**Success:**
```
Card: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
```

**Test UPI:**
```
UPI ID: success@razorpay
```

**Test Net Banking:**
- Select any bank
- Use `success` as username/password

---

## ✅ Done!

Your app is now ready to accept payments through Razorpay! 🎉

### What's Supported:

✅ **UPI** - Google Pay, PhonePe, Paytm, BHIM, etc.
✅ **Cards** - Visa, Mastercard, RuPay, Amex
✅ **Net Banking** - All major Indian banks
✅ **Wallets** - Paytm, PhonePe, Mobikwik, etc.
✅ **EMI** - No cost EMI options

---

## 🔒 Security

- All payments are PCI-DSS compliant
- Card details never touch your servers
- Webhook signature verification
- Secret keys stored securely in Firebase

---

## 📊 Next Steps

### Setup Webhook (Optional for Testing)

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-project.cloudfunctions.net/razorpayWebhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
4. Set webhook secret (same as Firebase config)

### Go Live

1. Complete business verification in Razorpay Dashboard
2. Add bank account for settlements
3. Switch to **Live Mode**
4. Get Live API keys
5. Update Firebase config with live keys
6. Redeploy functions

---

## 💡 Tips

- **Test Mode**: Use test keys for development
- **Live Mode**: Use live keys for production
- **Settlements**: Payments settled to your bank in 2-3 days
- **Support**: Razorpay has excellent support for Indian businesses

---

## 🐛 Troubleshooting

**Payment succeeds but subscription not updated?**
- Check Firebase Functions logs: `firebase functions:log`
- Verify webhook is configured correctly

**"Razorpay is not configured" error?**
- Make sure `.env` has `REACT_APP_RAZORPAY_KEY_ID`
- Restart dev server: `npm start`

**Payment fails immediately?**
- Check Razorpay Dashboard for test mode
- Use correct test card numbers

---

## 📞 Support

- Razorpay Dashboard: https://dashboard.razorpay.com
- Documentation: https://razorpay.com/docs
- Support: support@razorpay.com

---

**Total Time:** ~10 minutes
**Status:** ✅ Ready for Indian Payments!
