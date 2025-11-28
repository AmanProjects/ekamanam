# 🔧 Quick Fix: Remove GoDaddy Parking IPs

## Issue
You have extra A records that are interfering with GitHub Pages:
- `15.197.142.173` (GoDaddy parking)
- `3.33.152.147` (GoDaddy parking)

## Solution

### Step 1: Log into GoDaddy
1. Go to https://godaddy.com/
2. Sign in
3. Go to **My Products**
4. Click **DNS** next to ekamanam.com

### Step 2: Remove Extra A Records
You should see something like:
```
Type    Name    Value               TTL
A       @       185.199.108.153     600  ✅ Keep
A       @       185.199.109.153     600  ✅ Keep
A       @       185.199.110.153     600  ✅ Keep
A       @       185.199.111.153     600  ✅ Keep
A       @       15.197.142.173      600  ❌ DELETE THIS
A       @       3.33.152.147        600  ❌ DELETE THIS
```

**Action:**
1. Find the A records with values `15.197.142.173` and `3.33.152.147`
2. Click the **trash/delete icon** next to each
3. Click **Save** or **Save All Changes**

### Step 3: Wait 5-10 Minutes
DNS needs to propagate the changes.

### Step 4: Try GitHub Again
1. Go to: https://github.com/AmanProjects/ekamanam/settings/pages
2. Enter: `www.ekamanam.com`
3. Click **Save**

---

## Alternative: Just Use WWW

**Easier solution:** Just use `www.ekamanam.com` instead of `ekamanam.com`

**Why?**
- www.ekamanam.com is already configured correctly
- No conflicts with GoDaddy parking
- Works immediately
- Users can still type ekamanam.com (will redirect to www)

**This is the RECOMMENDED approach!**

