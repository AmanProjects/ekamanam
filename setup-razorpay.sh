#!/bin/bash

# 🔥 Razorpay + Firebase Functions Setup Script
# This script helps you configure Firebase Functions for Razorpay payments

set -e  # Exit on error

echo "================================================"
echo "🔥 Razorpay + Firebase Functions Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Firebase CLI
echo "Step 1: Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found${NC}"
    echo ""
    echo "Please install Firebase CLI first:"
    echo "  npm install -g firebase-tools"
    echo ""
    echo "Or using Homebrew:"
    echo "  brew install firebase-cli"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Firebase CLI installed:$(firebase --version)${NC}"
fi

echo ""

# Step 2: Check Firebase Login
echo "Step 2: Checking Firebase login status..."
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo ""
    echo "Running: firebase login"
    firebase login
else
    echo -e "${GREEN}✅ Already logged in to Firebase${NC}"
fi

echo ""

# Step 3: Get Razorpay credentials
echo "================================================"
echo "Step 3: Configure Razorpay Credentials"
echo "================================================"
echo ""
echo "You need THREE pieces of information from Razorpay Dashboard:"
echo "  1. Key ID (already in .env)"
echo "  2. Key Secret (from Razorpay Dashboard → Settings → API Keys)"
echo "  3. Webhook Secret (any secure random string)"
echo ""

# Read current key from .env
CURRENT_KEY_ID=$(grep REACT_APP_RAZORPAY_KEY_ID .env | cut -d '=' -f2)
echo -e "${GREEN}Current Key ID from .env: $CURRENT_KEY_ID${NC}"
echo ""

# Ask for Key ID
read -p "Enter Razorpay Key ID (or press Enter to use $CURRENT_KEY_ID): " KEY_ID
KEY_ID=${KEY_ID:-$CURRENT_KEY_ID}

# Ask for Key Secret
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Keep your Key Secret confidential!${NC}"
read -sp "Enter Razorpay Key Secret (hidden): " KEY_SECRET
echo ""

if [ -z "$KEY_SECRET" ]; then
    echo -e "${RED}❌ Key Secret is required${NC}"
    exit 1
fi

# Generate or ask for Webhook Secret
echo ""
echo "Generating a secure webhook secret..."
WEBHOOK_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}Generated webhook secret: $WEBHOOK_SECRET${NC}"
echo ""
read -p "Press Enter to use this, or type your own webhook secret: " CUSTOM_WEBHOOK
WEBHOOK_SECRET=${CUSTOM_WEBHOOK:-$WEBHOOK_SECRET}

echo ""

# Step 4: Set Firebase Functions config
echo "================================================"
echo "Step 4: Setting Firebase Functions Configuration"
echo "================================================"
echo ""

echo "Setting razorpay.key_id..."
firebase functions:config:set razorpay.key_id="$KEY_ID"

echo "Setting razorpay.key_secret..."
firebase functions:config:set razorpay.key_secret="$KEY_SECRET"

echo "Setting razorpay.webhook_secret..."
firebase functions:config:set razorpay.webhook_secret="$WEBHOOK_SECRET"

echo ""
echo -e "${GREEN}✅ Firebase Functions configuration complete!${NC}"
echo ""

# Step 5: Display configuration
echo "Verifying configuration..."
firebase functions:config:get

echo ""

# Step 6: Ask to deploy
echo "================================================"
echo "Step 5: Deploy Firebase Functions"
echo "================================================"
echo ""
read -p "Deploy Firebase Functions now? (y/n): " DEPLOY

if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
    echo ""
    echo "Deploying Firebase Functions..."
    firebase deploy --only functions

    echo ""
    echo -e "${GREEN}✅ Firebase Functions deployed successfully!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Skipped deployment${NC}"
    echo ""
    echo "Deploy later with:"
    echo "  firebase deploy --only functions"
fi

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Test payment flow: npm start"
echo "  2. Setup Razorpay webhooks (see FIREBASE_FUNCTIONS_SETUP.md)"
echo "  3. Monitor logs: firebase functions:log"
echo ""
echo "Documentation:"
echo "  • FIREBASE_FUNCTIONS_SETUP.md - Complete setup guide"
echo "  • docs/RAZORPAY_INTEGRATION_COMPLETE.md - Technical docs"
echo "  • RAZORPAY_QUICK_START.md - Quick reference"
echo ""
echo -e "${GREEN}🎉 Your app is ready to accept payments!${NC}"
echo ""
