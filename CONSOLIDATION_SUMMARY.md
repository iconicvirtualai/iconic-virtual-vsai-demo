# App Consolidation: 4 Core Experiences

## Overview
The app has been consolidated from multiple disconnected dashboards/pages into **one unified user journey** with 4 core experiences.

---

## 4 Core Experiences

### 1. **Marketing Homepage** (`/home`)
- **File**: `pages/home.tsx`
- **Purpose**: Entry point for new users, showcasing product benefits
- **Features**:
  - AI staging overview
  - Pricing comparison (AI vs Professional)
  - Before/after gallery
  - How it works (3 steps)
  - FAQ section
  - CTA buttons to staging workspace

### 2. **Staging Workspace** (`/`)
- **File**: `pages/index.tsx`
- **Purpose**: Core product - upload image, select style, generate staged versions
- **Features**:
  - Drag-and-drop image upload
  - Room type & style selection
  - Real-time rendering with polling
  - Before/after slider view
  - Variation carousel
  - Regenerate/Re-stage options
  - Purchase button for high-res download
  - Integrated header with navigation

### 3. **Checkout Flow** (`/checkout`)
- **File**: `pages/checkout.tsx`
- **Purpose**: Payment processing for purchased staged images
- **Flow**:
  1. User clicks "Purchase Staging – $5"
  2. Redirected to Stripe Checkout
  3. Returned to success page after payment

### 4. **User Dashboard** (`/orders/me`)
- **File**: `pages/orders/me.tsx`
- **Purpose**: User's order history, staging history, and downloads
- **Features**:
  - Overview cards (completed stagings, in progress, total spent)
  - Staging history table with thumbnail previews
  - Download buttons for completed images
  - Status tracking (pending/completed/failed)
  - Quick links to stage more images

---

## Pages Removed
- ❌ `/pages/dashboard-rebuild.tsx` - **DELETED**
- ❌ `/pages/admin.tsx` - **DELETED**
- ❌ `/pages/test-checkout.tsx` - **DELETED**

---

## Pages Repurposed
- `/pages/portal.tsx` - Now redirects to `/orders/me` (unified dashboard)
- `/pages/success.tsx` - Updated with new branding (post-purchase confirmation)
- `/pages/login.tsx` - Updated with new branding (authentication)
- `/pages/checkout.tsx` - Enhanced with better error handling and header

---

## Navigation Structure

All pages now share **unified header navigation**:
```
[ICONIC VIRTUAL.AI Logo] | Home | Stage Image | Dashboard | Account
```

### Navigation Flow
```
/home (Marketing)
  └─> [Try AI Staging Free] ──> / (Staging Workspace)
      └─> [Purchase] ──> /checkout ──> /success
  └─> [See Pricing] ──> #pricing section
  └─> [Start Free] ──> / (Staging Workspace)

/ (Staging Workspace)
  └─> [Home] ──> /home
  └─> [Dashboard] ──> /orders/me
  └─> [Account] ──> /login

/orders/me (Dashboard)
  └─> [Stage Another Image] ──> /
  └─> [Home] ──> /home
  └─> [Account] ──> /login
```

---

## Branding Consistency

### Color Scheme
- **Primary**: Amber (#8B7355)
- **Primary Dark**: #6B5842
- **Accent**: Amber gradients
- **Background**: Slate-50 (#FAF8F5)
- **Surface**: White
- **Text**: Slate-900

### Typography
- **Logo**: Bold uppercase "ICONIC VIRTUAL.AI"
- **Headings**: Semibold to bold, large sizes
- **Navigation**: Uppercase tracking-widest text

### Components
- Buttons: Gradient backgrounds (amber), consistent padding & border-radius
- Cards: Rounded-2xl, white background, subtle borders
- Headers: Sticky, backdrop-blur, white/translucent

---

## API Endpoints (No Changes)
All backend APIs remain unchanged:
- `/api/upload` - Upload image
- `/api/vsai-create` - Create render job
- `/api/vsai-render` - Get render progress
- `/api/vsai-variation` - Generate variation
- `/api/vsai-options` - Get available styles/rooms
- `/api/stripe-checkout` - Create checkout session
- `/api/post-checkout` - Finalize purchase
- `/api/jobs/[jobId]` - Get job status
- `/api/orders/me` - Get user's orders

---

## Key Improvements

### UX
1. ✅ **Clear user journey** - Home → Stage → Purchase → Dashboard
2. ✅ **Consistent branding** across all pages
3. ✅ **Unified navigation** - all pages share the same header
4. ✅ **No duplicate pages** - single source of truth for each experience

### Technical
1. ✅ Removed unused/broken pages
2. ✅ Replaced static HTML with React for easier updates
3. ✅ Proper error handling in checkout flow
4. ✅ Loading states and user feedback throughout

### Data Integration
1. ✅ Dashboard fetches live order data from `/api/orders/me`
2. ✅ Status tracking (pending/completed/failed)
3. ✅ Download links for completed stagings
4. ✅ User staging history with timestamps

---

## To Enable Full Functionality

### Environment Variables (Already in place)
- `VSAI_API_KEY` - Virtual Staging AI API key ⚠️ **REQUIRED**
- `VSAI_API_BASE` - VSAI API endpoint (defaults to https://api.virtualstagingai.app/v1)
- Firebase credentials
- Stripe keys
- Supabase credentials (for auth)

### Firestore Setup
The dashboard expects orders to be stored with this structure:
```json
{
  "id": "unique-order-id",
  "jobId": "staging-job-id",
  "createdAt": "ISO-8601 timestamp",
  "imageUrl": "original-image-url",
  "stagedUrl": "staged-result-url",
  "amount": 5.00,
  "status": "completed|pending|failed",
  "roomType": "living",
  "style": "modern"
}
```

---

## Testing Checklist

- [ ] `/home` - Marketing homepage loads with correct branding
- [ ] `/` - Staging workspace functions (upload, render, purchase)
- [ ] `/orders/me` - Dashboard shows order history (or empty state)
- [ ] `/checkout` - Payment flow works
- [ ] `/success` - Post-purchase page displays staged image
- [ ] Header navigation works across all pages
- [ ] All links point to correct destinations
- [ ] Responsive design works on mobile
- [ ] Auth flow (login/signup) integrated with Supabase

---

## Next Steps

1. Set `VSAI_API_KEY` environment variable if not already set
2. Test the staging workflow end-to-end
3. Verify Firestore orders are being saved correctly
4. Deploy to production
5. Monitor user flows and update as needed
