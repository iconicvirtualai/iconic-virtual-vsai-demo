# ICONIC VIRTUAL AI
## Master System Overview

---

# Overview

Iconic Virtual AI is a nationwide self-service AI virtual staging platform designed for real estate professionals, photographers, marketers, and property owners.

The platform allows users to:
- Upload property photos
- Generate AI virtual staging previews
- Purchase one-time renders
- Buy credits
- Subscribe to monthly plans
- Download completed HD images
- Access render history through a simple dashboard

The system is designed around a fast and low-friction workflow:

Upload → Stage → Pay → Download

The platform supports:
- DIY AI staging
- Traditional designer staging
- Shared credit usage
- Watermarked preview workflows
- Automated rendering and delivery

The platform is NOT intended to function as:
- a project management system
- a media collaboration platform
- a workflow management tool

---

# Core Goals

- Fully automated nationwide virtual staging platform
- Fast rendering and download workflow
- Low-friction customer experience
- Subscription-based recurring revenue
- Watermarked preview-before-purchase system
- Shared credit ecosystem across services
- Scalable cloud infrastructure
- Lean operational overhead

---

# Business Model

The platform operates using two primary customer models:

## One-Time Purchase Users

Users can:
- Upload an image
- Generate a watermarked preview
- Purchase individual renders
- Add multiple renders to cart
- Download HD files after payment

No subscription required.

Files are temporarily retained after purchase.

---

## Credit & Subscription Users

Registered users can:
- Purchase credits
- Subscribe to recurring plans
- Access discounted render pricing
- Use credits across services
- Access render history
- Generate unlimited AI variations

Credits are shared across:
- AI staging
- Traditional staging
- Future AI enhancement tools

---

# Core Services

## AI Virtual Staging

Self-service AI rendering workflow.

Users:
- upload an image
- choose room type
- choose design style
- generate staged render
- download completed image

---

## Traditional Virtual Staging

Human-assisted staging workflow.

Users:
- upload image
- request designer staging
- receive professionally completed render

Traditional staging may use:
- higher credit costs
- manual revisions
- separate turnaround times

---

## Future AI Services

Planned services include:
- twilight conversion
- furniture removal
- decluttering
- object removal
- sky replacement
- grass enhancement

---

# Platform Philosophy

The platform should remain:

- fast
- simple
- scalable
- conversion-focused
- automation-first

Primary user goal:

Render → Purchase → Download → Repeat

The platform should avoid:
- unnecessary complexity
- bloated workflows
- excessive dashboards
- collaboration-heavy systems

---

# Tech Stack

## Frontend
- Builder.io
- React
- Next.js
- Vercel

## Backend
- Firebase
- Firestore
- Firebase Authentication
- Firebase Storage
- Cloud Functions

## AI Services
- VirtualStagingAI API

## Payments
- Stripe

---

# Firebase Project

Project ID:
iconic-virtual-ai

Storage Bucket:
iconic-virtual-ai.firebasestorage.app

---

# GitHub Repository

iconicvirtualai/iconic-virtual-vsai-demo

---

# Core User Types

## Guest User
- Upload images
- Generate previews
- Purchase one-time renders
- Temporary file retention

---

## Registered User
- Purchase credits
- Manage downloads
- Access render history
- Generate AI variations

---

## Subscriber
- Monthly or annual credits
- Discounted pricing
- Faster workflows
- Long-term render access

---

## Admin
- User management
- Billing management
- Render monitoring
- Refund management
- Analytics access

---

# Core Platform Modules

## Authentication
- account creation
- login/logout
- password reset
- subscription validation

---

## Credit System
- shared credit wallet
- subscription renewals
- one-time purchases
- credit deduction tracking

---

## Upload System
- drag-and-drop uploads
- file validation
- upload progress tracking

---

## Rendering System
- AI staging generation
- room type selection
- style selection
- unlimited AI variations

---

## Watermark Preview System

Before payment:
- previews remain watermarked
- downloads remain locked

After payment:
- HD render unlocks
- watermark removed

---

## Dashboard
- render history
- downloads
- billing history
- subscription management
- account settings

---

# Firebase Storage Structure

/users/{userId}/uploads/
/users/{userId}/renders/
/users/{userId}/previews/
/users/{userId}/downloads/

/guest/{sessionId}/temp/

/system/demo-assets/
/system/watermarks/
/system/temp/

---

# File Retention Rules

## Guest Users
Unused files automatically deleted after 7 days.

## Registered Users
Longer render history retention.

## Subscribers
Extended render storage and history access.

---

# Cleanup Rules

Automatically delete:
- abandoned uploads
- unpaid previews
- failed renders
- expired guest files
- unused temporary assets

Goals:
- lower storage costs
- lean infrastructure
- scalable file management

---

# Brand Positioning

Iconic Virtual AI focuses on:
- affordability
- speed
- simplicity
- automation
- scalable AI rendering

Tone:
- modern
- clean
- confident
- tech-forward
- creative-industry friendly

Avoid:
- overly corporate tone
- cluttered workflows
- cheap/fiverr-style branding

---
