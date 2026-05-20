# WORKFLOWS
## Iconic Virtual AI

---

# PLATFORM OVERVIEW

Iconic Virtual AI is a self-service AI virtual staging platform.

The platform is designed for:
- fast rendering
- low friction
- instant purchasing
- recurring credit usage

The system is NOT intended to function as:
- a project management system
- a collaboration platform
- a media workflow platform

Primary user goal:
Upload → Stage → Pay → Download

---

# ONE-OFF USER WORKFLOW

User Uploads Image
↓
Selects:
- Room Type
- Design Style
↓
AI Generates Watermarked Preview
↓
User Chooses:
- Purchase This Image
OR
- Add More Images
↓
Checkout
↓
HD Render Unlocks
↓
User Downloads Files
↓
Files Retained For 7 Days
↓
Unused Files Automatically Deleted

Notes:
- Email required before checkout
- No account required initially
- Watermarked previews shown before payment
- One-off users do not receive unlimited variations

---

# CREDIT USER WORKFLOW

User Creates Account
↓
Purchases Credits OR Subscription
↓
Credits Added To Account
↓
User Uploads Image
↓
User Selects:
- Room Type
- Design Style
↓
Credits Deduct BEFORE Render
↓
AI Render Generated
↓
Unlimited Variations Included
↓
HD Download Available Immediately
↓
Render Saved To Dashboard History

Notes:
- Credits shared across AI and traditional staging
- Subscribers receive lower per-image pricing
- Variations are free for AI staging

---

# SUBSCRIPTION WORKFLOW

User Selects Subscription Plan
↓
Stripe Subscription Created
↓
Monthly Credits Automatically Added
↓
Subscription Status Synced To Account
↓
Credits Roll Into Shared Wallet

Subscription Goals:
- recurring revenue
- lower pricing for loyal users
- streamlined rendering workflow

---

# TRADITIONAL STAGING WORKFLOW

User Uploads Image
↓
Selects Traditional Staging
↓
Credits Deducted
↓
Order Routed To Human Designer
↓
Designer Completes Render
↓
Preview Uploaded
↓
Final Render Delivered

Notes:
- Traditional staging costs more credits
- Variations may cost additional credits
- Human intervention allowed

---

# WATERMARK PREVIEW SYSTEM

Before Payment:
- Previews remain watermarked
- Downloads remain locked

After Payment:
- Watermark removed
- HD download unlocked

---

# FILE RETENTION RULES

## Guest Users
Unused files automatically deleted after 7 days.

## Registered Users
Render history retained longer.

## Subscribers
Long-term history retention.

---

# STORAGE STRUCTURE

/users/{userId}/uploads/
/users/{userId}/renders/
/users/{userId}/previews/
/users/{userId}/downloads/

/guest/{sessionId}/temp/
/system/demo-assets/
/system/watermarks/

---

# AUTO CLEANUP RULES

Automatically Delete:
- abandoned uploads
- unpaid previews
- failed renders
- expired guest files
- unused temp assets

Goals:
- reduce storage costs
- keep infrastructure lean
- prevent unnecessary file buildup

---

# CREDIT SYSTEM RULES

Credits Can Be Used For:
- AI staging
- Traditional staging
- Future AI tools

Examples:
- Twilight conversion
- Object removal
- Decluttering
- Sky replacement

---

# CORE PLATFORM PHILOSOPHY

The platform should remain:
- simple
- fast
- scalable
- low friction

The focus is:
Render → Purchase → Download → Repeat

---
