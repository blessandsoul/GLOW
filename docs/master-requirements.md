# Master Verification Requirements

## Overview

Masters on Glow.GE must meet certain requirements before their profile becomes publicly visible. Verification is handled by platform admins.

---

## Tier 1 — Basic Verification (Required)

All masters must complete these before their profile goes live:

| # | Requirement | How to verify | Field/Feature |
|---|-------------|---------------|---------------|
| 1 | **Phone verification** | OTP via gosms.ge | Already implemented |
| 2 | **ID verification** | Upload photo of national ID or passport | `idDocumentUrl` — admin reviews |
| 3 | **Minimum portfolio** | At least 5 work photos uploaded | Automated check: `portfolio.count >= 5` |
| 4 | **Profile completeness** | First name, last name, city, niche, bio, at least 1 service with price | Automated check |
| 5 | **Terms acceptance** | Accept Master Agreement during registration | `masterAgreementAcceptedAt` timestamp |
| 6 | **Age 18+** | Confirmed via ID document | Admin reviews ID |

**Status after Tier 1**: Profile is `VERIFIED` and visible in the catalog.

---

## Tier 2 — Enhanced Verification (Optional, earns badges)

These are not required but give the master a trust badge on their profile:

| # | Requirement | Badge | Field/Feature |
|---|-------------|-------|---------------|
| 1 | **Professional certificate** | "Certified Professional" | `certificateUrl` — admin reviews |
| 2 | **Hygiene training certificate** | "Hygiene Certified" | `hygieneCertUrl` — admin reviews |
| 3 | **3+ years experience** | "Experienced" | `experienceYears >= 3` (self-reported) |
| 4 | **Professional insurance** | "Insured" | `insuranceDocUrl` — admin reviews |
| 5 | **10+ completed reviews with 4.5+ avg** | "Top Rated" | Automated check |

---

## Verification Workflow

```
Master registers → Fills profile → Uploads portfolio + ID
  → Status: PENDING_REVIEW
  → Admin reviews ID + portfolio
  → APPROVED → Profile goes live (VERIFIED)
  → REJECTED → Reason sent to master, can re-submit
```

## Suspension & Removal

A master's profile can be suspended or removed by admins if:

1. **Fake identity** — ID doesn't match profile
2. **Fake portfolio** — stolen photos from other artists
3. **Repeated complaints** — 3+ disputes from clients within 30 days
4. **Rating drops below 3.0** — automatic suspension, admin reviews
5. **Inappropriate content** — nudity, offensive material
6. **Harassment or abuse** — reported by clients
7. **Inactive for 6+ months** — profile hidden (not deleted), can reactivate
8. **Terms violation** — any breach of the Master Agreement
9. **Illegal activity** — reported to authorities if applicable

## Suggested Database Fields

```prisma
model Master {
  // ... existing fields ...

  // Verification
  verificationStatus  VerificationStatus @default(PENDING)  // PENDING, UNDER_REVIEW, VERIFIED, REJECTED, SUSPENDED
  idDocumentUrl       String?
  rejectionReason     String?
  verifiedAt          DateTime?
  verifiedBy          String?  // admin user ID

  // Tier 2 badges
  certificateUrl      String?
  hygieneCertUrl      String?
  experienceYears     Int?
  insuranceDocUrl     String?

  // Trust signals
  isCertified         Boolean @default(false)
  isHygieneCertified  Boolean @default(false)
  isInsured           Boolean @default(false)
  isTopRated          Boolean @default(false)
}

enum VerificationStatus {
  PENDING
  UNDER_REVIEW
  VERIFIED
  REJECTED
  SUSPENDED
}
```
