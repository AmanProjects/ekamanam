#!/bin/bash

# 🔐 Razorpay Configuration Script
# This script helps you configure Razorpay keys in Firebase Functions

set -e

echo "================================================"
echo "🔐 Razorpay Configuration for Firebase Functions"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if logged in to Firebase
echo "Checking Firebase login status..."
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Firebase${NC}"
    echo "Please run: firebase login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Firebase${NC}"
echo ""

# Display instructions
echo "================================================"
echo "📋 Before we begin, you need:"
echo "================================================"
echo ""
echo "1. Your Razorpay Key Secret from:"
echo "   https://dashboard.razorpay.com/app/keys"
echo ""
echo "   Steps to get it:"
echo "   - Login to Razorpay Dashboard"
echo "   - Go to Settings → API Keys"
echo "   - Find key: rzp_live_RrwnUfrlnM6Hbq"
echo "   - Click 'Regenerate/View' to see the secret"
echo "   - Copy the Key Secret (looks like: rzp_live_xxxxx...)"
echo ""
echo "================================================"
echo ""

read -p "Do you have your Razorpay Key Secret ready? (y/n): " READY

if [ "$READY" != "y" ] && [ "$READY" != "Y" ]; then
    echo ""
    echo -e "${YELLOW}Please get your Razorpay Key Secret first, then run this script again.${NC}"
    exit 0
fi

echo ""
echo "================================================"
echo "🔧 Configuration"
echo "================================================"
echo ""

# Set Key ID
echo "Setting Razorpay Key ID..."
firebase functions:config:set razorpay.key_id="rzp_live_RrwnUfrlnM6Hbq"
echo -e "${GREEN}✅ Key ID set${NC}"
echo ""

# Ask for Key Secret
echo -e "${YELLOW}⚠️  Your Key Secret will be hidden while typing${NC}"
read -sp "Enter your Razorpay Key Secret: " KEY_SECRET
echo ""

if [ -z "$KEY_SECRET" ]; then
    echo -e "${RED}❌ Key Secret cannot be empty${NC}"
    exit 1
fi

# Validate format (basic check)
if [[ ! $KEY_SECRET =~ ^rzp_(live|test)_ ]]; then
    echo -e "${YELLOW}⚠️  Warning: Key Secret doesn't look like a valid Razorpay key${NC}"
    echo "   Expected format: rzp_live_xxxxxxxxxxxxxxxx"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 0
    fi
fi

echo "Setting Razorpay Key Secret..."
firebase functions:config:set razorpay.key_secret="$KEY_SECRET"
echo -e "${GREEN}✅ Key Secret set${NC}"
echo ""

# Set Webhook Secret
echo "Setting Webhook Secret..."
firebase functions:config:set razorpay.webhook_secret="d7b324af53c4e0c889ea767e48aa7fdfd743d6ea288c6c64b5108d7cd6af625a"
echo -e "${GREEN}✅ Webhook Secret set${NC}"
echo ""

# Verify configuration
echo "================================================"
echo "🔍 Verifying Configuration"
echo "================================================"
echo ""

echo "Current Firebase Functions configuration:"
firebase functions:config:get

echo ""
echo -e "${GREEN}✅ Configuration complete!${NC}"
echo ""

# Ask to redeploy
echo "================================================"
echo "🚀 Deployment"
echo "================================================"
echo ""
echo "Functions need to be redeployed with the new configuration."
echo ""
read -p "Deploy functions now? (y/n): " DEPLOY

if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
    echo ""
    echo "Deploying Firebase Functions..."
    firebase deploy --only functions

    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Skipped deployment${NC}"
    echo ""
    echo "Deploy later with:"
    echo "  firebase deploy --only functions"
fi

echo ""
echo "================================================"
echo "🎉 Configuration Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Test your payment flow: npm start"
echo "  2. Go to Pricing page and click 'Upgrade Now'"
echo "  3. Complete a test payment"
echo ""
echo "Setup Razorpay Webhooks (optional but recommended):"
echo "  1. Go to: https://dashboard.razorpay.com"
echo "  2. Settings → Webhooks"
echo "  3. Add webhook URL:"
echo "     https://us-central1-ekamanam.cloudfunctions.net/razorpayWebhook"
echo "  4. Select events: payment.captured, payment.failed, order.paid"
echo "  5. Enter webhook secret:"
echo "     d7b324af53c4e0c889ea767e48aa7fdfd743d6ea288c6c64b5108d7cd6af625a"
echo ""
echo -e "${GREEN}🎊 Your payment system is ready!${NC}"
echo ""
