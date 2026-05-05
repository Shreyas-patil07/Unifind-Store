# Legal Compliance Documentation

## Overview
UNIFIND now includes comprehensive legal documentation to ensure compliance with Indian laws and protect both the platform and users.

## Implemented Features

### 1. Privacy Policy (`/privacy`)
**Location:** `frontend/src/pages/PrivacyPolicyPage.jsx`

**Covers:**
- Data collection (account info, profile data, listings, communications)
- How data is used (authentication, listings, communication, fraud detection)
- Data sharing (with users, service providers, payment processors, legal authorities)
- Security measures (HTTPS encryption, password hashing, access control)
- User rights (access, edit, delete, withdraw consent, data portability)
- Cookies and tracking
- Age restrictions (18+)
- University verification disclaimer
- Legal compliance (IT Act 2000, DPDP Act 2023)

### 2. Terms & Conditions (`/terms`)
**Location:** `frontend/src/pages/TermsConditionsPage.jsx`

**Covers:**
- Platform role disclaimer (marketplace connector, not seller)
- User account requirements (eligibility, verification, accuracy)
- Listing rules (allowed/prohibited items, requirements)
- Transaction guidelines (direct transactions, payment, meeting safety)
- Refund & dispute policy
- Prohibited activities (fraud, harassment, spam)
- Content ownership
- Account suspension/termination
- Limitation of liability (critical legal protection)
- Second-hand goods disclaimer
- Communication monitoring
- Dispute resolution (jurisdiction, arbitration)
- Safety tips

### 3. Community Guidelines (`/community-guidelines`)
**Location:** `frontend/src/pages/CommunityGuidelinesPage.jsx`

**Covers:**
- Be respectful (kindness, politeness, no harassment)
- Be honest (accurate listings, fair pricing)
- Stay safe (public meetings, inspection, reporting)
- Prohibited behaviors
- Reporting mechanisms
- Good practices

### 4. Signup Page Integration
**Location:** `frontend/src/pages/SignupPage.jsx`

**Changes:**
- Added mandatory checkbox for Terms & Conditions and Privacy Policy
- Checkbox must be checked before signup is allowed
- Links open in new tab for easy reading
- Footer links to Privacy Policy, Terms, and Support
- Clear disclaimer about platform role

**Validation:**
```javascript
if (!agreedToTerms) {
  setError('You must agree to the Terms & Conditions and Privacy Policy to continue.');
  return;
}
```

### 5. Login Page Enhancement
**Location:** `frontend/src/pages/LoginPage.jsx`

**Changes:**
- Added footer with links to Privacy Policy, Terms, and Support
- Consistent branding with signup page

## Routes Added

```javascript
<Route path="/privacy" element={<PrivacyPolicyPage />} />
<Route path="/terms" element={<TermsConditionsPage />} />
<Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
```

## Legal Compliance Checklist

### ✅ Mandatory Requirements (India)
- [x] Privacy Policy (DPDP Act 2023 compliant)
- [x] Terms & Conditions with platform role disclaimer
- [x] User consent mechanism (checkbox on signup)
- [x] Data collection disclosure
- [x] User rights (access, edit, delete)
- [x] Security measures disclosure
- [x] Age restriction (18+)
- [x] Jurisdiction clause (India/Maharashtra)

### ✅ Highly Recommended
- [x] Community Guidelines
- [x] Safety tips section
- [x] Refund & dispute policy
- [x] Limitation of liability clause
- [x] Second-hand goods disclaimer
- [x] University verification disclaimer
- [x] Communication monitoring notice

### ✅ User Experience
- [x] Easy access to policies (footer links)
- [x] Clear, readable language
- [x] Mobile-responsive design
- [x] Links open in new tab
- [x] Contact information provided

## Key Legal Protections

### 1. Platform Liability Protection
```
"UNIFIND is a marketplace platform that connects student buyers and sellers.
We do NOT own, sell, or guarantee any products listed."
```

### 2. Limitation of Liability
```
"We are NOT liable for disputes, damages, or losses between users.
Maximum liability is limited to ₹1,000 or amount paid (if any)."
```

### 3. Second-Hand Goods Disclaimer
```
"All items are sold 'AS-IS' with no warranty from UNIFIND."
```

### 4. User Responsibility
```
"Users assume all risks when buying or selling."
```

## Contact Information

**All Inquiries:** systemrecord07@gmail.com  
**Address:** SIGCE, Navi Mumbai, Maharashtra, India

## Backend API Compliance

### Data Protection in API Routes
**Location:** `backend/routes/`

**Implemented Routes:**
- `auth.py` - Authentication with secure password hashing
- `users.py` - User profile management with privacy controls
- `products.py` - Product listings with content moderation
- `chats.py` - Secure messaging between users
- `need_board.py` - Community need board with moderation
- `reviews.py` - Review system with abuse prevention
- `uploads.py` - Secure file upload with validation

**Security Measures:**
- Rate limiting on all endpoints
- JWT-based authentication
- Input validation and sanitization
- CORS configuration for frontend-only access
- Secure headers (HSTS, CSP, X-Frame-Options)

### Email Service Compliance
**Location:** `backend/services/email_service.py`

**Features:**
- OTP verification for account security
- Email verification for authenticity
- Transactional emails only (no marketing without consent)
- Secure email templates

### Image Upload Compliance
**Location:** `backend/services/cloudinary_service.py`

**Features:**
- Cloudinary integration for secure image hosting
- Image validation and size limits
- Content moderation capabilities
- HTTPS-only image delivery

## Next Steps (Recommended)

1. **Legal Review:** Have a lawyer review these documents for your specific situation
2. **Update Dates:** Keep "Last updated" dates current when making changes
3. **User Notification:** Notify existing users of policy updates via email
4. **Version Control:** Maintain version history of policy changes
5. **Regular Updates:** Review and update policies annually or when laws change

## Important Notes

⚠️ **Customization:** These policies are tailored for UNIFIND but should be reviewed by a legal professional before going live.

⚠️ **Enforcement:** Having policies is not enough - you must enforce them consistently.

⚠️ **Updates:** Laws change - stay informed about Indian data protection and e-commerce regulations.

⚠️ **Records:** Keep records of user consent (signup timestamps, IP addresses).

⚠️ **Data Retention:** Implement data retention policies and automatic deletion of old data per DPDP Act 2023.

⚠️ **Breach Notification:** Have a plan to notify users within 72 hours of any data breach.

⚠️ **Third-Party Services:** Ensure all third-party services (Cloudinary, email providers) are GDPR/DPDP compliant.

## Testing

To test the implementation:

1. Visit `/signup` - verify checkbox is present and required
2. Click Privacy Policy link - should open in new tab
3. Click Terms & Conditions link - should open in new tab
4. Try to signup without checking the box - should show error
5. Check the box and signup - should proceed normally
6. Visit `/privacy`, `/terms`, `/community-guidelines` directly

## Files Modified/Created

### Created:
- `frontend/src/pages/PrivacyPolicyPage.jsx`
- `frontend/src/pages/TermsConditionsPage.jsx`
- `frontend/src/pages/CommunityGuidelinesPage.jsx`
- `LEGAL_COMPLIANCE.md` (this file)

### Modified:
- `frontend/src/pages/SignupPage.jsx` (added checkbox and validation)
- `frontend/src/pages/LoginPage.jsx` (added footer links)
- `frontend/src/App.jsx` (added routes)

---

**Last Updated:** April 9, 2026  
**Compliance Status:** ✅ Ready for Review


## Data Security Measures

### Backend Security
- HTTPS encryption for all API communications
- Password hashing using bcrypt
- JWT token-based authentication
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS configuration for trusted origins only

### Firebase Security
- Firestore security rules enforced (see `DEPLOYMENT.md`)
- Authentication required for write operations
- User-specific data access controls
- Firebase Admin SDK for server-side operations

### Frontend Security
- Environment variables for sensitive configs
- Secure token storage
- XSS protection via React
- HTTPS-only in production

## Data Retention Policy

- User accounts: Retained until user requests deletion
- Chat messages: Retained for 90 days after last activity
- Product listings: Retained for 30 days after deletion
- Transaction history: Retained for 1 year for dispute resolution
- Logs: Retained for 30 days

## User Data Rights (DPDP Act 2023 Compliance)

Users have the right to:
1. Access their personal data
2. Correct inaccurate data
3. Delete their account and data
4. Withdraw consent
5. Data portability
6. Lodge complaints with Data Protection Authority

## Compliance Monitoring

- Regular security audits recommended
- Policy review: Annually or when laws change
- User consent tracking via signup timestamps
- Incident response plan for data breaches

---

**Last Updated:** April 10, 2026  
**Compliance Status:** ✅ Ready for Legal Review  
**Next Review Date:** April 10, 2027
