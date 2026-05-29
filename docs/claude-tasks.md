# Claude Tasks — Iconic Virtual AI Build

## Primary Goal

Turn IconicVirtual.ai into a complete Vercel-hosted website/app.

Final production should run through:

- GitHub
- Vercel
- Builder.io frontend/UI
- Firebase Auth
- Firestore
- Firebase Storage
- Stripe
- VirtualStagingAI API

Do not rely on Wix embeds for the final production experience.

## Existing Docs

Read and follow these first:

- /docs/master-overview.md
- /docs/business-rules.md
- /docs/firestore-schema.md
- /docs/workflows.md
- /docs/api-architecture.md
- /docs/storage-architecture.md

Do not create duplicate docs unless specifically needed.

## Critical Rules

1. Do not rewrite the whole app.
2. Do not rewrite working backend staging logic unless it is proven broken.
3. Do not guess API payloads.
4. Inspect API routes before changing frontend fetch calls.
5. Preserve image resize logic to prevent Vercel 413 errors.
6. Preserve selected variation logic for checkout and final download.
7. Preview watermark should be frontend-only.
8. Paid/final images should not show preview watermark overlay.
9. Stripe must verify payment before final download unlock.
10. Firebase credit ledger must be written by server/backend only.
11. User-facing dashboard must use Firebase user/account data.
12. Final production should run at https://www.iconicvirtual.ai.
## Last Known Working Staging Code Baseline

There was a previously working version of the main AI staging tool in:

- `pages/index.tsx`

Before making changes to the staging UI, compare the current `pages/index.tsx` against the last known working version from GitHub history.

The known-good behavior included:

1. Image upload worked.
2. Large files were resized client-side to prevent Vercel 413 errors.
3. Room and style dropdowns pulled from `/api/vsai-options`.
4. Stage Image sent the original uploaded image through the backend staging flow.
5. The staged preview returned and displayed correctly.
6. The preview used a frontend-only `ICONICVIRTUAL.AI` watermark overlay.
7. Regenerate Image opened a modal with room/style options.
8. Re-Stage triggered a new VSAI variation.
9. Real variation URLs were stored and arrows cycled between actual staged variations.
10. The slider compared the original upload against the selected staged variation.
11. The selected variation needed to be preserved for Stripe checkout.
12. The success/download page needed to show the exact purchased final image.
13. The download button needed to download the final image directly.
14. The “upload a different file” option existed before staging.
15. “Submit for Pro Staging” linked to the pro order flow.
16. File resize logic was added specifically because Vercel returned 413 errors on larger base64 uploads.

Important: Do not assume the current `pages/index.tsx` is correct. Claude or Builder may have changed it. Use GitHub file history to compare and recover the last stable staging behavior before making new changes.

If the current file contains newer cart, selected variation, or checkout logic, do not remove it blindly. Compare it against the known-good baseline and merge only what is needed.

## Phase 1 — Audit Current Code

Before coding, inspect:

- package.json
- next.config.js
- middleware.ts
- pages/index.tsx
- pages/success.tsx
- pages/api/upload.ts
- pages/api/vsai-options.ts
- pages/api/vsai-create.ts
- pages/api/vsai-variation.ts
- pages/api/jobs/[jobId].ts
- pages/api/stripe-checkout.ts
- pages/api/checkout.ts
- lib/firebaseAdmin.ts
- any Firebase client config files
- all docs files

Report:

1. Current frontend routes/pages.
2. Current API routes.
3. Expected payload for each API route.
4. Actual frontend payloads being sent.
5. Which frontend/backend payloads are mismatched.
6. Current Stripe checkout/success flow.
7. Current Firebase collections referenced.
8. Current storage paths used.
9. Current known build risks.
10. Exact files to change first.

## Phase 2 — Stabilize AI Staging Tool

Main staging UI must support:

- Upload image.
- Auto-resize large images before upload to avoid 413.
- Room/style dropdowns from `/api/vsai-options`.
- Stage image through existing backend route.
- Display frontend-only preview watermark.
- Regenerate image through correct VSAI variation route.
- Regenerate modal with room/style choices.
- Store real variation result URLs.
- Arrows cycle actual staged variations.
- Slider compares original and current staged variation.
- User can choose a different file before staging.
- User can submit for pro staging.
- User can purchase selected variation.
- Checkout must preserve selected variation.
- Success page must show correct purchased final image.
- Download button must download actual final image.

## Phase 3 — Production Site on Vercel

Site should support these routes:

- /
- /stage-now
- /dashboard
- /orders
- /projects
- /history
- /credits
- /billing
- /settings
- /team
- /support
- /refer
- /success
- /login
- /logout

Remove final dependency on Wix embeds.

Internal links should use app routes or:

- Homepage: https://www.iconicvirtual.ai
- Pro order page: /orders or https://www.iconicvirtual.ai/orders

## Phase 4 — Firebase Auth and Account Setup

Implement or connect:

- Firebase Auth signup/login.
- User profile record.
- Parent account record.
- Team member association.
- Dashboard greeting using Firebase user/account data.
- Logout redirects to https://www.iconicvirtual.ai.

Required collections:

- users
- accounts
- accounts/{accountId}/teamMembers

## Phase 5 — Orders, Projects, Renders, History

AI staging completion should create/update:

- project
- order
- render
- download record
- activity log
- notification
- confirmation email

Projects and orders must be linked by IDs.

Pro staging orders should support:

- Upload up to 20 images.
- Room labels per image.
- Overall style.
- Special instructions.
- Token/credit total before submission.
- Prompt purchase if not enough credits.
- Firebase order record.
- Internal notification.
- User confirmation email.

## Phase 6 — Credits

Use credit ledger, not one universal credit number.

Credit types:

- ai
- pro
- editing
- video
- referral

Rules:

- AI credits cannot be used for pro staging.
- Pro credits cannot be used for AI staging.
- Team member usage deducts from parent account if allowed.
- Credits are deducted by backend only.
- Stripe purchases add credits through backend/webhook.
- Referral credits use ledger entries.

## Phase 7 — Stripe

Stripe should handle:

- One-time image purchase.
- Credit pack purchase.
- Membership/subscription purchase.
- Payment methods/customer portal.
- Invoices.
- Webhooks.

After successful payment:

- Mark order paid.
- Unlock final download.
- Save final image/download link.
- Add credit ledger entry if applicable.
- Save payment record.
- Save invoice/payment summary.
- Send confirmation email.
- Add history event.

## Phase 8 — Dashboard

Dashboard home:

- Search all orders/projects/history/status/address/order IDs.
- Notifications.
- Welcome back {userName}.
- Credits remaining.
- Stagings this month.
- Active projects.
- Total stagings.

Stage Now:

- AI staging workspace.
- Bulk upload queued ribbon.
- Add selected variation to order.
- Pro staging intake.

Orders:

Columns:

- Order ID
- Property
- Room
- Style
- Date
- Credit Amount
- Status
- Actions

Actions:

- View
- Download
- Track
- Cancel
- Re-Stage
- Retry
- Support
- Request Revision

Filters:

- All
- Processing
- Complete
- Failed
- Draft

Pagination:

- Default 6.
- Options 5, 10, 20, 100.

History:

- All user-visible account activity.
- Admin-only logs hidden from user.

Projects:

- Created by user, admin, or system.
- Organized by address, client name, or custom name.
- Linked to orders/renders/downloads.

Credits:

- Buy single-use credits.
- Buy membership credits.
- Show balances by credit type.

Billing:

- Current plan.
- Credit balances.
- Payment methods.
- Invoices.
- Optional tax info.

Settings:

- Profile.
- Logo/headshot.
- Email/company/name.
- Default staging preferences.
- Notification preferences.

Team:

- Invite team member.
- Roles: admin, editor, viewer.
- Parent account credit sharing.

Support:

- Remove live chat and schedule call.
- Keep send message.
- Keep submit support ticket.
- Add AI chatbot only for general website questions.

Refer & Earn:

- Give 10 Get 10.
- Unique referral links.
- Referral signup tracking.
- First purchase qualification.
- Referral credit ledger entries.
- Multi-level reward rule.

## Phase 9 — Emails

Set up transactional emails for:

- Account created.
- New order submitted.
- Payment successful.
- Payment failed.
- Credit purchase.
- Low credit warning.
- AI staging complete.
- Pro staging submitted.
- Pro staging delivered.
- Revision requested.
- Support ticket submitted.
- Support ticket response.
- Contact form submitted.
- Team invite.

Internal admin emails:

- New order.
- New pro staging order.
- New support ticket.
- Contact form submission.
- Payment issue.
- Failed render.

## Phase 10 — Build Discipline

For every code change:

1. Name the file path.
2. Explain the change.
3. Keep changes small.
4. Avoid touching unrelated working files.
5. Confirm build.
6. If build fails, fix build before continuing.
