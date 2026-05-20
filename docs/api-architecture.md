# API ARCHITECTURE
## Iconic Virtual AI

---

# SYSTEM OVERVIEW

The platform uses:

Frontend:
- Builder.io
- React
- Next.js
- Vercel

Backend:
- Firebase
- Firestore
- Firebase Storage
- Cloud Functions

External APIs:
- VirtualStagingAI API
- Stripe API

---

# PRIMARY SYSTEM FLOW

Upload
↓
Storage
↓
Render Request
↓
AI Processing
↓
Preview Generation
↓
Payment Validation
↓
HD Unlock
↓
Download

---

# FRONTEND RESPONSIBILITIES

Frontend handles:
- uploads
- UI state
- authentication
- dashboard rendering
- style selection
- checkout UI
- render history

Frontend should NOT:
- expose secret API keys
- directly process payments
- directly handle AI rendering logic

---

# FIREBASE RESPONSIBILITIES

Firestore stores:
- users
- orders
- renders
- subscriptions
- billing records
- statuses
- metadata

Firebase Storage stores:
- uploads
- previews
- renders
- downloads

Firebase Authentication handles:
- login
- registration
- user sessions

Cloud Functions handle:
- render processing
- Stripe validation
- webhook processing
- cleanup automation

---

# STRIPE FLOW

## One-Time Purchase Flow

User Selects Render
↓
Stripe Checkout Session Created
↓
Payment Successful
↓
Webhook Confirms Payment
↓
HD Render Unlocks
↓
Download Enabled

---

## Subscription Flow

User Selects Plan
↓
Stripe Subscription Created
↓
Stripe Webhook Fires
↓
Credits Added To Account
↓
Subscription Status Synced

---

# AI RENDER FLOW

User Uploads Image
↓
Image Stored In Firebase Storage
↓
Render Document Created In Firestore
↓
Cloud Function Triggered
↓
Image Sent To VirtualStagingAI API
↓
AI Render Generated
↓
Preview Watermark Applied
↓
Files Stored In Firebase Storage
↓
Firestore Status Updated
↓
Frontend Dashboard Updated

---

# GUEST USER FLOW

Guest Uploads Image
↓
Temporary Session Created
↓
Preview Generated
↓
Guest Adds Render To Cart
↓
Email Collected
↓
Stripe Checkout
↓
Payment Success
↓
HD Render Unlocks
↓
Files Retained 7 Days
↓
Cleanup Automation Removes Expired Files

---

# CREDIT USER FLOW

User Logs In
↓
Credits Verified
↓
Credits Deduct BEFORE Render
↓
Render Generated
↓
Unlimited AI Variations Allowed
↓
Render Saved To Dashboard

---

# WATERMARK SYSTEM FLOW

Preview Render Created
↓
Watermark Overlay Applied
↓
Preview Displayed
↓
HD Render Locked

After Payment:
↓
HD File Unlocked
↓
Watermark-Free Download Enabled

---

# CLOUD FUNCTIONS

---

## createRenderOrder

Purpose:
Creates render request document.

Responsibilities:
- validate upload
- validate user/session
- create order
- create render document

---

## processAIRender

Purpose:
Sends image to VirtualStagingAI API.

Responsibilities:
- send render request
- monitor completion
- save outputs
- update Firestore

---

## applyWatermark

Purpose:
Creates protected preview image.

Responsibilities:
- apply overlay
- generate preview asset
- store preview

---

## stripeWebhookHandler

Purpose:
Handles Stripe events.

Responsibilities:
- payment confirmation
- subscription sync
- failed payment handling
- refunds

---

## cleanupExpiredFiles

Purpose:
Automatically deletes temporary assets.

Responsibilities:
- remove guest files
- remove abandoned uploads
- remove failed render assets

---

# FIRESTORE COLLECTION RELATIONSHIPS

users
↓
orders
↓
renders
↓
payments

subscriptions
↓
creditTransactions

---

# SECURITY RULES

Frontend should NEVER:
- expose API secrets
- directly modify billing records
- bypass payment validation

All sensitive operations handled through:
- Cloud Functions
- secure server-side logic

---

# FUTURE API SERVICES

Planned future integrations:
- twilight conversion
- object removal
- decluttering
- Canva export
- AI enhancement tools

Future services should integrate into:
- shared credit system
- existing render pipeline

---

# DEVELOPMENT PRIORITIES

Priority Order:

1. Authentication
2. Upload System
3. Render Pipeline
4. Watermark Preview System
5. Stripe Checkout
6. Dashboard History
7. Cleanup Automation
8. Subscription Logic

---

# PLATFORM PHILOSOPHY

The platform should remain:
- simple
- scalable
- automation-first
- low friction
- conversion-focused

The system is optimized for:
Render → Purchase → Download

NOT:
- project management
- collaboration
- permanent cloud storage

---

# STAGING SYSTEM ARCHITECTURE

The staging/render system operates as a centralized reusable application system.

The primary staging experience is:

components/staging/StagingWorkspace.tsx

This component acts as the canonical shared staging workspace across the platform.

The component may be reused across:
- homepage staging flow
- guest rendering flow
- authenticated user dashboard
- account staging workspace

The platform should NOT create:
- duplicate staging tools
- duplicate upload systems
- duplicate render handlers
- duplicate API integrations

---

# SHARED STAGING SERVICE

Frontend staging logic is centralized through:

/lib/staging.ts

This service acts as the frontend source of truth for:
- uploads
- render creation
- render polling
- variation requests
- cart handling
- checkout initiation

All frontend pages/components should reuse this service.

Pages should NOT duplicate:
- fetch logic
- upload logic
- polling logic
- checkout logic

---

# API STABILITY RULES

Existing API routes remain the backend source of truth.

Do NOT unnecessarily rebuild or duplicate:
- upload endpoints
- VSAI endpoints
- Stripe endpoints
- Firebase integrations

The current production render pipeline should remain stable during UI/UX consolidation.

---

# COMPONENT REUSE RULES

Pages should function primarily as:
- layout wrappers
- route containers
- navigation shells

Business logic should remain centralized in:
- reusable components
- shared service layers

---

# IFRAME RULES

Do NOT use iframe-based architecture for internal staging tools.

Reuse React components directly within the application instead.

The platform should behave as:
- one unified application
NOT:
- disconnected embedded applications
