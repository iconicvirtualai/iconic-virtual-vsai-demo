# FIRESTORE SCHEMA
## Iconic Virtual AI

---

# USERS COLLECTION

Collection:
users

Purpose:
Stores all user account data.

Example Document ID:
userId

Fields:
- firstName
- lastName
- email
- phone
- role
- subscriptionPlan
- credits
- stripeCustomerId
- createdAt
- updatedAt
- accountStatus

Roles:
- guest
- user
- subscriber
- admin

---

# SUBSCRIPTIONS COLLECTION

Collection:
subscriptions

Purpose:
Stores subscription and billing data.

Fields:
- userId
- stripeSubscriptionId
- planName
- billingCycle
- creditsPerMonth
- renewalDate
- status
- createdAt

Statuses:
- active
- canceled
- past_due
- expired

---

# CREDIT TRANSACTIONS COLLECTION

Collection:
creditTransactions

Purpose:
Tracks all credit usage and purchases.

Fields:
- userId
- type
- amount
- balanceAfter
- referenceId
- createdAt

Types:
- purchase
- render
- refund
- bonus
- adjustment

---

# ORDERS COLLECTION

Collection:
orders

Purpose:
Stores render orders.

Fields:
- orderId
- userId
- orderType
- status
- totalCreditsUsed
- totalImages
- createdAt
- updatedAt

Statuses:
- pending
- processing
- completed
- failed
- refunded

Order Types:
- ai-staging
- traditional-staging
- twilight
- furniture-removal

---

# RENDERS COLLECTION

Collection:
renders

Purpose:
Stores individual render data.

Fields:
- renderId
- orderId
- userId
- originalImageUrl
- previewImageUrl
- finalImageUrl
- roomType
- designStyle
- renderStatus
- creditsUsed
- createdAt
- completedAt

Render Statuses:
- queued
- rendering
- completed
- failed

---

# PAYMENTS COLLECTION

Collection:
payments

Purpose:
Tracks payments and invoices.

Fields:
- userId
- orderId
- stripePaymentIntentId
- amount
- currency
- paymentStatus
- createdAt

Payment Statuses:
- pending
- paid
- failed
- refunded

---

# SUPPORT TICKETS COLLECTION

Collection:
supportTickets

Purpose:
Stores customer support requests.

Fields:
- userId
- subject
- message
- status
- priority
- createdAt

Statuses:
- open
- pending
- resolved
- closed

---

# SYSTEM SETTINGS COLLECTION

Collection:
systemSettings

Purpose:
Stores platform-wide configuration.

Fields:
- maintenanceMode
- freeCreditsEnabled
- maxUploadSize
- watermarkEnabled
- allowedFileTypes
- updatedAt

---

# FIREBASE STORAGE STRUCTURE

/users/{userId}/uploads/
/users/{userId}/renders/
/users/{userId}/previews/
/users/{userId}/downloads/

/system/demo-assets/
/system/watermarks/
/system/temp/

---

# IMPORTANT RULES

- Never store images directly in Firestore
- Store image URLs only
- Keep collections modular
- Use timestamps on all documents
- Use Firebase Storage for all media files
- Keep user files separated by userId

---
