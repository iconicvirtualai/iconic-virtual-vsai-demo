# BUSINESS RULES
## Iconic Virtual AI

---

# PLATFORM PURPOSE

Iconic Virtual AI is a self-service AI rendering platform focused on:

Upload → Stage → Pay → Download

The platform is NOT intended to function as:
- a project management platform
- a collaboration system
- a long-term file storage service

---

# USER TYPES

## Guest User
- Can upload images
- Can generate watermarked previews
- Can purchase one-time renders
- Files retained temporarily

---

## Registered User
- Has account dashboard
- Can purchase credits
- Can access render history
- Can generate unlimited AI variations

---

## Subscriber
- Receives recurring credits
- Receives discounted pricing
- Receives longer file retention

---

# ONE-TIME PURCHASE RULES

Users may:
- upload image
- generate preview
- purchase individual renders
- add multiple renders to cart

Requirements:
- email required before checkout
- payment required before HD download unlocks

Guest users do NOT receive:
- unlimited render history
- unlimited free variations
- subscription pricing

---

# CREDIT SYSTEM RULES

Credits are shared across:
- AI staging
- traditional staging
- future AI tools

Credits deduct BEFORE render generation for account users.

Credits may be purchased:
- one-time
- through subscriptions
- through promotional offers

---

# SUBSCRIPTION RULES

Subscriptions:
- automatically reload credits
- provide discounted render pricing
- support recurring usage

Subscription billing handled through Stripe.

---

# AI STAGING RULES

AI staging includes:
- room type selection
- design style selection
- unlimited AI variations

AI variations are included at no extra charge for account users.

---

# TRADITIONAL STAGING RULES

Traditional staging:
- uses higher credit amounts
- may involve human designers
- may allow paid revisions or variations
- may have different turnaround times

Traditional staging variations may cost additional credits.

---

# WATERMARK RULES

Before payment:
- previews remain watermarked
- downloads remain locked

After payment:
- watermark removed
- HD render unlocked

---

# FILE RETENTION RULES

## Guest Users
Unused files automatically deleted after 7 days.

## Registered Users
Longer render retention allowed.

## Subscribers
Extended storage and render history retention.

---

# STORAGE RULES

Do NOT store images inside Firestore.

Firestore stores:
- metadata
- URLs
- billing
- statuses
- account information

Firebase Storage stores:
- uploads
- previews
- renders
- downloads

---

# AUTO CLEANUP RULES

Automatically delete:
- abandoned uploads
- expired previews
- failed renders
- temporary guest files
- unused temp assets

Goal:
Maintain lean storage costs.

---

# DASHBOARD RULES

Dashboard should remain:
- simple
- fast
- lightweight

Dashboard includes:
- render history
- downloads
- billing
- subscriptions
- account settings

Dashboard should NOT become:
- a project management system
- a collaboration platform
- a media workflow application

---

# PLATFORM PRIORITIES

Highest priorities:
- fast rendering
- low friction
- simple checkout
- recurring subscriptions
- scalable infrastructure
- low operational overhead

---

# FUTURE SERVICES

Future AI services may include:
- twilight conversion
- furniture removal
- decluttering
- object removal
- sky replacement
- grass enhancement

These services should integrate into the shared credit system.

---

# UI/UX CONSOLIDATION RULES

The platform should consolidate around 4 primary experiences:

1. Marketing Homepage
2. Staging Workspace
3. Checkout Flow
4. User Dashboard

Avoid generating:
- duplicate dashboards
- duplicate portals
- duplicate upload pages
- duplicate staging systems

---

# STAGING WORKSPACE RULES

The staging workspace is the core product experience.

Users should be able to:
- upload images
- generate renders
- preview results
- add renders to cart
- continue staging additional images
- checkout once for multiple renders

The platform should support:
- persistent order/cart sessions
- return-to-workspace navigation
- simplified rendering workflow

---

# PRODUCT PHILOSOPHY

The platform should prioritize:
- speed
- simplicity
- low friction
- conversion optimization
- reusable systems

Avoid:
- unnecessary complexity
- disconnected workflows
- feature duplication
- overbuilt dashboard systems
