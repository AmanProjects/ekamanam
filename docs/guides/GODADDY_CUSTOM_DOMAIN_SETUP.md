# 🌐 Setting Up Custom Domain: www.ekamanam.com with GitHub Pages

## Overview
This guide will help you connect your GoDaddy domain `www.ekamanam.com` to your GitHub Pages hosted Ekamanam application.

---

## 📋 Prerequisites
- ✅ Domain purchased from GoDaddy: `ekamanam.com`
- ✅ GitHub repository: `https://github.com/AmanProjects/ekamanam`
- ✅ GitHub Pages already working: `https://amanprojects.github.io/ekamanam/`
- ✅ Access to GoDaddy DNS management
- ✅ Admin access to GitHub repository

---

## 🎯 Goal
- Current URL: `https://amanprojects.github.io/ekamanam/`
- Target URL: `https://www.ekamanam.com/`
- Also work: `https://ekamanam.com/` (redirects to www)

---

## 📝 Step-by-Step Instructions

### **PART 1: Configure DNS in GoDaddy** (10 minutes)

#### 1. Log in to GoDaddy
1. Go to https://godaddy.com/
2. Click **Sign In** (top right)
3. Enter your credentials
4. Navigate to **My Products**

#### 2. Access DNS Management
1. Find your domain: **ekamanam.com**
2. Click the **DNS** button next to it
3. You'll see the DNS Management page

#### 3. Add DNS Records

**📌 Important: You need to add 5 DNS records**

##### Record 1: A Record for Root Domain
```
Type: A
Name: @ (this represents ekamanam.com)
Value: 185.199.108.153
TTL: 600 seconds (or default)
```

##### Record 2: A Record for Root Domain
```
Type: A
Name: @
Value: 185.199.109.153
TTL: 600 seconds
```

##### Record 3: A Record for Root Domain
```
Type: A
Name: @
Value: 185.199.110.153
TTL: 600 seconds
```

##### Record 4: A Record for Root Domain
```
Type: A
Name: @
Value: 185.199.111.153
TTL: 600 seconds
```

##### Record 5: CNAME Record for WWW
```
Type: CNAME
Name: www
Value: amanprojects.github.io
TTL: 600 seconds (or default)
```

#### 4. Steps to Add Each Record:
1. Click **Add** button (or **Add New Record**)
2. Select **Type** from dropdown
3. Enter **Name** (@ for root, www for subdomain)
4. Enter **Value** (IP address or domain)
5. Set **TTL** (600 seconds recommended)
6. Click **Save**
7. Repeat for all 5 records

#### 5. Remove Conflicting Records (If Any)
**⚠️ IMPORTANT:** If you see existing A records or CNAME records for @ or www that point elsewhere:
1. Click the **trash/delete icon** next to them
2. Confirm deletion
3. Then add the new records above

**Common records to remove:**
- Parked domain records
- Default GoDaddy A records
- Old CNAME records pointing to other services

#### 6. Verify DNS Records
Your DNS Management page should now show:
```
Type    Name    Value                   TTL
────────────────────────────────────────────
A       @       185.199.108.153         600
A       @       185.199.109.153         600
A       @       185.199.110.153         600
A       @       185.199.111.153         600
CNAME   www     amanprojects.github.io  600
```

#### 7. Save Changes
1. Click **Save All Changes** (if prompted)
2. DNS propagation can take **10 minutes to 48 hours** (usually ~1 hour)

---

### **PART 2: Configure GitHub Pages** (5 minutes)

#### 1. Go to GitHub Repository Settings
1. Open https://github.com/AmanProjects/ekamanam
2. Click **Settings** tab (top right)
3. Scroll to **Pages** (left sidebar under "Code and automation")

#### 2. Add Custom Domain
1. Under **Custom domain**, enter: `www.ekamanam.com`
2. Click **Save**
3. Wait 30-60 seconds

#### 3. DNS Check
GitHub will automatically check your DNS configuration:
- ✅ **Success**: Green checkmark appears
- ⏳ **Pending**: Yellow warning (wait for DNS propagation)
- ❌ **Error**: Red X (check DNS settings)

**If you see an error:**
- Wait 10-15 minutes for DNS propagation
- Click **Remove** then re-enter `www.ekamanam.com` and save again
- Verify GoDaddy DNS records are correct

#### 4. Enable HTTPS (Recommended)
1. Once DNS check passes, a checkbox will appear:
   - ☑️ **Enforce HTTPS**
2. Check this box
3. GitHub will automatically provision a Let's Encrypt SSL certificate
4. This may take **5-10 minutes**

---

### **PART 3: Update Application Configuration** (2 minutes)

#### 1. Update package.json
```bash
cd /Users/amantalwar/Documents/GitHub/ekamanam
```

Open `package.json` and update the `homepage` field:

**BEFORE:**
```json
{
  "homepage": "https://amanprojects.github.io/ekamanam"
}
```

**AFTER:**
```json
{
  "homepage": "https://www.ekamanam.com"
}
```

#### 2. Rebuild and Deploy
```bash
npm run build
npm run deploy
```

This ensures all asset paths point to your custom domain.

---

### **PART 4: Create CNAME File** (Automatic)

When you save the custom domain in GitHub Pages settings, GitHub automatically creates a `CNAME` file in your `gh-pages` branch with content:
```
www.ekamanam.com
```

**⚠️ Important:** Don't delete this file! If your deploy script removes it, add this to your build:
```bash
echo "www.ekamanam.com" > build/CNAME
```

---

## ✅ Verification & Testing

### Step 1: Check DNS Propagation (after 15-30 minutes)
Use online tools to verify:
1. Go to: https://dnschecker.org/
2. Enter: `ekamanam.com`
3. Select **A** record type
4. Click **Search**
5. Should show all 4 GitHub IPs globally

Repeat for:
- `www.ekamanam.com` (CNAME type) → should show `amanprojects.github.io`

### Step 2: Test URLs
Open these in your browser (after DNS propagation):

1. **http://www.ekamanam.com** → Should work
2. **https://www.ekamanam.com** → Should work (after HTTPS enabled)
3. **http://ekamanam.com** → Should redirect to www
4. **https://ekamanam.com** → Should redirect to www

### Step 3: Test Application Features
1. Open `https://www.ekamanam.com`
2. Upload a PDF
3. Test Teacher Mode, Smart Explain, etc.
4. Check browser console for errors (F12)
5. Verify all assets load correctly

---

## 🐛 Troubleshooting

### Issue 1: "DNS check failed"
**Symptoms:** Red X in GitHub Pages settings

**Solutions:**
1. Wait 1-2 hours for DNS propagation
2. Verify A records in GoDaddy point to correct IPs
3. Try `dig www.ekamanam.com` in terminal to check DNS
4. Clear your browser cache and DNS cache

**Clear DNS cache:**
- **Mac:** `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
- **Windows:** `ipconfig /flushdns`
- **Linux:** `sudo systemd-resolve --flush-caches`

### Issue 2: Site loads but shows 404
**Symptoms:** Domain works but shows GitHub 404 page

**Solutions:**
1. Check `CNAME` file exists in `gh-pages` branch
2. Rebuild and redeploy: `npm run build && npm run deploy`
3. Wait 5 minutes for GitHub Pages to update

### Issue 3: "Not Secure" warning
**Symptoms:** Browser shows padlock with warning

**Solutions:**
1. Wait 10-30 minutes for SSL certificate provisioning
2. Ensure "Enforce HTTPS" is checked in GitHub Pages settings
3. Try removing and re-adding the custom domain

### Issue 4: Mixed content warnings
**Symptoms:** Some assets don't load on HTTPS

**Solutions:**
1. Check `package.json` has correct `homepage` URL
2. Ensure all imports use relative paths or HTTPS
3. Check browser console for specific mixed content errors

### Issue 5: Old GitHub Pages URL still works
**This is normal!** Both URLs will work:
- `https://amanprojects.github.io/ekamanam/` ← Still works
- `https://www.ekamanam.com/` ← New primary URL

To redirect the old URL to new:
- This happens automatically if you enabled "Enforce HTTPS"
- Users visiting old URL will see the new domain in browser

---

## 📊 Expected Timeline

| Step | Time | Status Check |
|------|------|--------------|
| Add DNS records in GoDaddy | 5 min | Immediate |
| DNS propagation starts | 10-60 min | Use dnschecker.org |
| GitHub detects DNS | 10-30 min | Green check in Settings |
| SSL certificate issued | 5-30 min | Padlock in browser |
| Fully operational | 1-2 hours | Test all features |

---

## 🔒 Security & Best Practices

### 1. Always Use HTTPS
- ✅ Check "Enforce HTTPS" in GitHub Pages
- ✅ Update all links to use `https://`
- ✅ Test mixed content warnings

### 2. Monitor SSL Certificate
- GitHub auto-renews Let's Encrypt certificates (every 90 days)
- No action needed from you
- Check expiry: https://www.ssllabs.com/ssltest/

### 3. Backup DNS Settings
Take screenshots of your GoDaddy DNS settings for future reference.

### 4. Regular Testing
- Test domain weekly to ensure it's working
- Check SSL certificate validity monthly
- Monitor GitHub Pages status: https://www.githubstatus.com/

---

## 📧 Support & Resources

### GitHub Pages Documentation
- Custom domains: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- Troubleshooting: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages

### GoDaddy Documentation
- DNS Management: https://www.godaddy.com/help/manage-dns-records-680

### DNS Checker Tools
- https://dnschecker.org/
- https://www.whatsmydns.net/
- https://mxtoolbox.com/

### SSL Checker
- https://www.ssllabs.com/ssltest/

---

## 🎉 Success Checklist

- [ ] 4 A records added in GoDaddy pointing to GitHub IPs
- [ ] 1 CNAME record added for www → amanprojects.github.io
- [ ] DNS propagation verified (dnschecker.org shows correct records)
- [ ] Custom domain added in GitHub Pages settings
- [ ] Green checkmark appears in GitHub Pages settings
- [ ] HTTPS enforced and certificate issued
- [ ] `package.json` homepage updated to new domain
- [ ] Application rebuilt and deployed
- [ ] `https://www.ekamanam.com` loads successfully
- [ ] `https://ekamanam.com` redirects to www
- [ ] All features tested and working
- [ ] No mixed content warnings in browser console
- [ ] SSL certificate valid (check with ssllabs.com)

---

## 🚀 Going Live

Once everything is verified:

1. **Update documentation** with new domain
2. **Share new URL** with users
3. **Update any external links** (social media, etc.)
4. **Set up analytics** for the new domain
5. **Monitor for 24-48 hours** to catch any issues

---

## 💡 Pro Tips

1. **Use www**: Setting up `www.ekamanam.com` as primary is recommended (better for CDN, cookies, etc.)

2. **DNS TTL**: Start with 600 seconds (10 minutes). Once stable, you can increase to 3600 (1 hour) for better caching.

3. **Keep both**: The old `amanprojects.github.io/ekamanam` will still work - useful for testing.

4. **Email**: This setup is for website only. For email@ekamanam.com, you need separate MX records and email service.

5. **Monitoring**: Use Google Search Console to monitor your new domain's SEO and indexing.

---

## 📞 Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify each step was completed correctly
3. Wait the full propagation time (up to 48 hours for global DNS)
4. Check GitHub Pages status page for any outages

---

**Last Updated:** November 28, 2024  
**Version:** 1.0  
**For:** Ekamanam v3.0.3

