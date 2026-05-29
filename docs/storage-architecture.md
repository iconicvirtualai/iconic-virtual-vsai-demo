# STORAGE ARCHITECTURE
## Iconic Virtual AI

---

# STORAGE OVERVIEW

Iconic Virtual AI uses Firebase Storage for all media assets.

Firestore should NEVER store image files directly.

Firestore stores:
- metadata
- URLs
- statuses
- billing data
- account data

Firebase Storage stores:
- uploads
- previews
- renders
- downloads
- temporary assets

---

# PRIMARY STORAGE GOALS

- low storage costs
- scalable file organization
- automated cleanup
- secure user separation
- temporary guest asset handling

---

# STORAGE PROVIDERS

## Primary Storage
Firebase Storage

Bucket:
iconic-virtual-ai.firebasestorage.app

---

# STORAGE STRUCTURE

## Registered User Files

/users/{userId}/uploads/
/users/{userId}/previews/
/users/{userId}/renders/
/users/{userId}/downloads/

---

## Guest User Files

/guest/{sessionId}/uploads/
/guest/{sessionId}/previews/
/guest/{sessionId}/temp/

---

## System Files

/system/demo-assets/
/system/watermarks/
/system/temp/
/system/logos/
/system/placeholders/

---

# FILE TYPES

Supported:
- JPG
- JPEG
- PNG
- WEBP

Future:
- HEIC
- TIFF

---

# FILE SIZE RULES

Uploads should:
- validate before upload
- compress when possible
- reject unsupported formats

Large RAW files should NOT be supported in V1.

---

# GUEST USER STORAGE RULES

Guest users:
- do not receive permanent storage
- use temporary file storage only
- files auto-delete after 7 days

Guest previews:
- remain watermarked
- remain download-locked before payment

---

# REGISTERED USER STORAGE RULES

Registered users:
- receive render history
- receive longer retention
- can access prior downloads

---

# SUBSCRIBER STORAGE RULES

Subscribers receive:
- longest retention windows
- expanded render history
- priority storage retention

---

# AUTO CLEANUP RULES

Automatically delete:
- abandoned uploads
- failed renders
- unpaid previews
- expired guest files
- temporary processing assets

Cleanup goals:
- reduce storage costs
- keep storage lean
- prevent duplicate buildup

---

# WATERMARK SYSTEM

Before payment:
- preview image generated
- watermark overlay applied
- HD download locked

After payment:
- HD render unlocked
- watermark removed

---

# FILE DELIVERY RULES

Downloads should:
- use secure URLs
- support temporary access links
- prevent unnecessary bandwidth abuse

Future:
- signed URLs
- expiring download links

---

# IMAGE VARIATIONS

AI staging variations:
- stored under original render
- do not duplicate unnecessary assets
- should remain lightweight

Traditional staging variations:
- may generate separate render records

---

# STORAGE COST STRATEGY

Priorities:
- aggressive temp cleanup
- minimize duplicate storage
- avoid permanent guest storage
- retain paid assets only

The platform is optimized for:
Render → Download → Cleanup

NOT permanent cloud storage hosting.

---
