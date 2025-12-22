# Ekamanam Version Guide

## Current Version: 6.0.1

**Live at**: https://www.ekamanam.com

---

## Versioning Strategy

Ekamanam follows **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`

### Format: `6.x.x`

- **MAJOR (6)**: Revolutionary learning platform with subscription system
- **MINOR (x)**: New features, enhancements
- **PATCH (x)**: Bug fixes, security updates

---

## Version History

### v6.0.1 (December 15, 2025) - Current
**Type**: Bug Fix

**Changes**:
- ✅ Fixed Razorpay payment checkout initialization
- ✅ Added Firebase app parameter to getFunctions()
- ✅ Payment modal now opens correctly on production

**Files Modified**:
- `src/services/razorpayService.js`
- `package.json`

**Commit**: `e066932`

**Documentation**:
- [PAYMENT_CHECKOUT_FIX.md](PAYMENT_CHECKOUT_FIX.md)

---

### v6.0.0 (December 15, 2025)
**Type**: Major Release - Subscription System + Revolutionary Features

**Changes**:
- ✅ Razorpay payment integration (India-focused)
- ✅ Subscription tiers (Free, Student, Educator)
- ✅ 6 Revolutionary Learning Features:
  1. Spaced Repetition System
  2. Cognitive Load Tracker
  3. AI Doubt Prediction
  4. Session History & Analytics
  5. Peer Learning (Beta)
  6. Sync Study
- ✅ GitHub Pages deployment (www.ekamanam.com)
- ✅ Firebase Functions backend
- ✅ UPI, Cards, Net Banking, Wallets support

**Files Modified**: 76 files
**Insertions**: 26,140 lines
**Deletions**: 419 lines

**Commits**:
- `8785ea0` - Initial v6.0.0 deployment
- `dff5822` - Firebase hosting cleanup

**Documentation**:
- [DEPLOYMENT_COMPLETE_v6.0.0.md](DEPLOYMENT_COMPLETE_v6.0.0.md)
- [GITHUB_PAGES_DEPLOYMENT.md](GITHUB_PAGES_DEPLOYMENT.md)
- [docs/RELEASE_v6.0.0_SUBSCRIPTION.md](docs/RELEASE_v6.0.0_SUBSCRIPTION.md)

---

### v5.1.0 and earlier
Legacy versions before subscription system and revolutionary features.

---

## How to Update Versions

### Before Making Changes:
1. Determine change type:
   - **Bug fix** → Increment PATCH (6.0.x)
   - **New feature** → Increment MINOR (6.x.0)
   - **Breaking change** → Increment MAJOR (7.0.0)

### Making the Update:

#### 1. Update package.json
```bash
# Edit package.json
"version": "6.0.2"  # Or appropriate version
```

#### 2. Document Changes
Create or update relevant documentation:
- Bug fixes: Create `FIX_*.md`
- Features: Update `CHANGELOG.md` or create `FEATURE_*.md`
- Breaking changes: Create `MIGRATION_*.md`

#### 3. Build and Deploy
```bash
npm run deploy
```

#### 4. Commit with Version Tag
```bash
git add package.json [other-files]
git commit -m "Update version to X.Y.Z - Description

Changes in vX.Y.Z:
- Change 1
- Change 2
- Change 3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push
```

#### 5. Create Git Tag (Optional)
```bash
git tag -a v6.0.2 -m "Version 6.0.2 - Description"
git push origin v6.0.2
```

---

## Version Naming Guidelines

### Patch Versions (6.0.x)
**When to use**: Bug fixes, security patches, minor improvements

**Examples**:
- `6.0.1` - Payment checkout fix
- `6.0.2` - Login form validation fix
- `6.0.3` - Performance optimization

**Commit Format**:
```
Update version to 6.0.X - [Brief description]

Changes in v6.0.X:
- Fixed: [Bug description]
- Improved: [Performance/UX improvement]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Minor Versions (6.x.0)
**When to use**: New features, enhancements, non-breaking changes

**Examples**:
- `6.1.0` - Add dark mode toggle
- `6.2.0` - Add export to PDF feature
- `6.3.0` - Add collaborative study rooms

**Commit Format**:
```
Update version to 6.X.0 - [Feature name]

New in v6.X.0:
- Feature: [Description]
- Enhanced: [Improvement]
- Added: [New capability]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Major Versions (7.0.0)
**When to use**: Breaking changes, complete redesigns, architecture overhauls

**Examples**:
- `7.0.0` - Complete UI redesign
- `8.0.0` - Migration to new backend
- `9.0.0` - Switch to different payment provider

**Commit Format**:
```
Update version to X.0.0 - [Major change description]

BREAKING CHANGES in vX.0.0:
- Changed: [What changed]
- Removed: [What was removed]
- Migration: See MIGRATION_vX.0.0.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Requirements**:
- Create `MIGRATION_vX.0.0.md` guide
- Update all documentation
- Notify users via email/announcement

---

## Current Version Status

### v6.0.1 (Production)
- ✅ **Status**: Live and stable
- ✅ **URL**: https://www.ekamanam.com
- ✅ **Hosting**: GitHub Pages (gh-pages branch)
- ✅ **Backend**: Firebase Functions
- ✅ **Payment**: Razorpay (India)
- ✅ **Features**: All 6 revolutionary features active

### Next Version Planning

#### v6.0.2 (Patch - If needed)
Potential bug fixes:
- [ ] TBD based on user feedback

#### v6.1.0 (Minor - Next feature)
Potential features:
- [ ] Enhanced analytics dashboard
- [ ] Advanced study group features
- [ ] More AI learning modes
- [ ] Mobile app (React Native)

#### v7.0.0 (Major - Future)
Potential breaking changes:
- [ ] Complete UI redesign
- [ ] New architecture
- [ ] Platform expansion

---

## Version Metadata

### package.json
```json
{
  "name": "ekamanam",
  "version": "6.0.1",
  "description": "Ekamanam - The Art of Focused Learning"
}
```

### Where Version Appears
1. **package.json** - Source of truth
2. **App Header** - Shows version chip (v6.0.1)
3. **About Dialog** - Full version info
4. **Git Tags** - Optional version tags
5. **Documentation** - Referenced in all docs

---

## Version Release Checklist

### Pre-Release
- [ ] Update version in package.json
- [ ] Write release notes / documentation
- [ ] Test all features locally
- [ ] Check browser console for errors
- [ ] Verify payment flow (if applicable)

### Release
- [ ] Run `npm run deploy`
- [ ] Verify deployment successful
- [ ] Test on production (www.ekamanam.com)
- [ ] Commit with proper version message
- [ ] Push to GitHub
- [ ] Create Git tag (optional)

### Post-Release
- [ ] Monitor Firebase Functions logs
- [ ] Check error rates in console
- [ ] Test payment success rate
- [ ] Update documentation site
- [ ] Announce on social media (for major/minor)
- [ ] Email users (for major versions)

---

## Rollback Procedure

If a version has critical issues:

### 1. Revert Deployment
```bash
# Switch to gh-pages branch
git checkout gh-pages

# Reset to previous commit
git reset --hard HEAD~1

# Force push (CAUTION!)
git push origin gh-pages --force
```

### 2. Revert Code Changes
```bash
# Switch back to v2 branch
git checkout v2

# Revert the commit
git revert [commit-hash]

# Push revert
git push
```

### 3. Update Version
```bash
# If reverting from 6.0.2 to 6.0.1
# Update package.json back to 6.0.1
# Commit and redeploy
```

---

## Version Communication

### User-Facing Changes
Communicate via:
1. **In-App Notification** (for major/minor)
2. **Landing Page** (update features list)
3. **Social Media** (Twitter, LinkedIn)
4. **Email** (for major versions)

### Developer-Facing Changes
Document in:
1. **Git Commit Messages** (detailed)
2. **Documentation Files** (*.md)
3. **GitHub Releases** (optional)
4. **CHANGELOG.md** (maintain going forward)

---

## Semantic Versioning Reference

Given version `MAJOR.MINOR.PATCH`:

1. **MAJOR**: Incompatible API changes
2. **MINOR**: Backwards-compatible functionality
3. **PATCH**: Backwards-compatible bug fixes

Additional labels:
- `6.1.0-alpha.1` - Alpha release
- `6.1.0-beta.2` - Beta release
- `6.1.0-rc.3` - Release candidate

---

## Tools

### Check Current Version
```bash
# In terminal
cat package.json | grep version

# In Node/React
import packageJson from '../package.json';
console.log(packageJson.version);
```

### Version Bump Scripts (Future)
```bash
# Could add to package.json scripts
"version:patch": "npm version patch && npm run deploy && git push",
"version:minor": "npm version minor && npm run deploy && git push",
"version:major": "npm version major && npm run deploy && git push"
```

---

## Summary

- **Current**: v6.0.1 (Bug fix for payment checkout)
- **Series**: 6.x.x (Subscription system + Revolutionary features)
- **Strategy**: Semantic Versioning
- **Updates**: Version number must be updated for each commit
- **Documentation**: Required for all version changes

---

**Maintained by**: Ekamanam Development Team
**Last Updated**: December 15, 2025
**Current Version**: 6.0.1
