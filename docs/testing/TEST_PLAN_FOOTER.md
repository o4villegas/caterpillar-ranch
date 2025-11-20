# Footer Functionality Test Plan
**Created:** 2025-11-15
**Target:** https://caterpillar-ranch.lando555.workers.dev/
**Purpose:** Verify end-to-end functionality of footer implementation

---

## Test Categories

### 1. API Endpoint Tests (Backend)

#### 1.1 Newsletter API - POST /api/newsletter/subscribe
**Test Cases:**
- [ ] TC-N1: Valid email submission (first time)
- [ ] TC-N2: Duplicate email submission (already subscribed)
- [ ] TC-N3: Reactivation (previously unsubscribed email)
- [ ] TC-N4: Invalid email format (no @)
- [ ] TC-N5: Invalid email format (no TLD)
- [ ] TC-N6: Missing email field
- [ ] TC-N7: Rate limiting (6th request within hour)

**Expected Responses:**
- TC-N1: 200, `{"success": true, "message": "You've joined the colony! 🐛"}`
- TC-N2: 200, `{"success": true, "message": "You're already part of the colony! 🐛"}`
- TC-N3: 200, `{"success": true, "message": "Welcome back to the colony! 🐛"}`
- TC-N4: 400, `{"error": "Invalid email format"}`
- TC-N5: 400, `{"error": "Invalid email format"}`
- TC-N6: 400, `{"error": "Email is required"}`
- TC-N7: 429, `{"error": "Too many requests. Please try again later.", "retryAfter": 3600}`

#### 1.2 Contact API - POST /api/contact/submit
**Test Cases:**
- [ ] TC-C1: Valid submission (all fields)
- [ ] TC-C2: Missing name field
- [ ] TC-C3: Missing email field
- [ ] TC-C4: Invalid email format
- [ ] TC-C5: Invalid subject (not in enum)
- [ ] TC-C6: Missing message field
- [ ] TC-C7: Name too long (101 chars)
- [ ] TC-C8: Message too long (2001 chars)
- [ ] TC-C9: Rate limiting (4th request within hour)

**Expected Responses:**
- TC-C1: 200, `{"success": true, "message": "Message received! We'll respond to your inquiry soon. 🐛"}`
- TC-C2: 400, `{"error": "Name is required"}`
- TC-C3: 400, `{"error": "Email is required"}`
- TC-C4: 400, `{"error": "Invalid email format"}`
- TC-C5: 400, `{"error": "Invalid subject"}`
- TC-C6: 400, `{"error": "Message is required"}`
- TC-C7: 400, `{"error": "Name is too long (max 100 characters)"}`
- TC-C8: 400, `{"error": "Message is too long (max 2000 characters)"}`
- TC-C9: 429, `{"error": "Too many requests. Please try again later.", "retryAfter": 3600}`

---

### 2. Frontend Component Tests

#### 2.1 Footer Display
**Test Cases:**
- [ ] TC-F1: Footer visible on homepage
- [ ] TC-F2: Footer has 4 sections (Brand, Newsletter, Links, Social)
- [ ] TC-F3: Brand section shows "Caterpillar Rancch" logo
- [ ] TC-F4: Brand section shows "Adorable Horror Tees" tagline
- [ ] TC-F5: Newsletter form has email input
- [ ] TC-F6: Newsletter form has submit button
- [ ] TC-F7: Links section shows Privacy, Terms, Shipping links
- [ ] TC-F8: Social section shows Instagram, TikTok icons
- [ ] TC-F9: Admin link (🐛) visible in Social section
- [ ] TC-F10: Footer has horror border animation (flickering)

#### 2.2 Newsletter Form Submission
**Test Cases:**
- [ ] TC-NF1: Enter valid email, click submit
- [ ] TC-NF2: Success toast appears
- [ ] TC-NF3: Form resets after submission
- [ ] TC-NF4: Enter invalid email (no @), submit
- [ ] TC-NF5: Client-side validation error toast appears
- [ ] TC-NF6: Submit empty email
- [ ] TC-NF7: Error toast appears for empty field

#### 2.3 Contact Modal
**Test Cases:**
- [ ] TC-CM1: Click "Contact" link opens modal
- [ ] TC-CM2: Modal shows title "Contact Us 🐛"
- [ ] TC-CM3: Modal has Name, Email, Subject, Message fields
- [ ] TC-CM4: Subject dropdown has 3 options
- [ ] TC-CM5: Message shows character counter (0/2000)
- [ ] TC-CM6: Fill all fields, submit
- [ ] TC-CM7: Success toast appears
- [ ] TC-CM8: Modal closes after submission
- [ ] TC-CM9: Form resets after submission
- [ ] TC-CM10: Submit with invalid email
- [ ] TC-CM11: Client-side error toast appears
- [ ] TC-CM12: Close modal (X button)
- [ ] TC-CM13: Close modal (click outside)

#### 2.4 Policy Pages
**Test Cases:**
- [ ] TC-P1: Click "Privacy Policy" link
- [ ] TC-P2: /privacy page loads correctly
- [ ] TC-P3: Page shows horror-themed content
- [ ] TC-P4: "Back to Store" link works
- [ ] TC-P5: Click "Terms of Service" link
- [ ] TC-P6: /terms page loads correctly
- [ ] TC-P7: Click "Shipping & Returns" link
- [ ] TC-P8: /shipping page loads correctly
- [ ] TC-P9: Footer visible on all policy pages

#### 2.5 Social & Admin Links
**Test Cases:**
- [ ] TC-S1: Click Instagram icon
- [ ] TC-S2: Opens https://www.instagram.com/caterpillar_ranch
- [ ] TC-S3: Click TikTok icon
- [ ] TC-S4: Opens https://www.tiktok.com/@caterpillar_ranch
- [ ] TC-S5: Click admin link (🐛)
- [ ] TC-S6: Navigates to /admin

#### 2.6 Error Pages
**Test Cases:**
- [ ] TC-E1: Visit /fake-404-page
- [ ] TC-E2: ErrorHeader displays (not full Header with cart)
- [ ] TC-E3: Footer displays on error page
- [ ] TC-E4: No CartContext errors in console
- [ ] TC-E5: "Return to homepage" link works

---

### 3. Integration Tests

#### 3.1 Rate Limiting Verification
**Test Cases:**
- [ ] TC-R1: Submit newsletter form 5 times
- [ ] TC-R2: All 5 succeed (or show duplicate message)
- [ ] TC-R3: Submit 6th time within same hour
- [ ] TC-R4: Error toast shows "Too many requests"
- [ ] TC-R5: Submit contact form 3 times
- [ ] TC-R6: All 3 succeed
- [ ] TC-R7: Submit 4th time within same hour
- [ ] TC-R8: Error toast shows "Too many requests"

#### 3.2 Database Verification
**Test Cases:**
- [ ] TC-D1: Query newsletter_subscribers table
- [ ] TC-D2: Verify test email exists
- [ ] TC-D3: Verify subscribed_at timestamp
- [ ] TC-D4: Verify source = 'footer'
- [ ] TC-D5: Verify active = 1
- [ ] TC-D6: Query contact_messages table
- [ ] TC-D7: Verify test message exists
- [ ] TC-D8: Verify all fields populated
- [ ] TC-D9: Verify status = 'new'
- [ ] TC-D10: Verify created_at timestamp

---

## Test Execution Plan

### Phase 1: API Direct Testing (curl)
1. Newsletter API tests (TC-N1 to TC-N7)
2. Contact API tests (TC-C1 to TC-C9)
3. Database verification after API tests

### Phase 2: Frontend Manual Testing
1. Footer display tests (TC-F1 to TC-F10)
2. Newsletter form tests (TC-NF1 to TC-NF7)
3. Contact modal tests (TC-CM1 to TC-CM13)
4. Policy pages tests (TC-P1 to TC-P9)
5. Social/admin links tests (TC-S1 to TC-S6)
6. Error pages tests (TC-E1 to TC-E5)

### Phase 3: Integration Testing
1. Rate limiting tests (TC-R1 to TC-R8)
2. Database verification (TC-D1 to TC-D10)

---

## Test Data

**Valid Test Emails:**
- test1@caterpillarranch.com
- test2@caterpillarranch.com
- test3@caterpillarranch.com
- ratelimit@caterpillarranch.com (for rate limit testing)

**Invalid Test Emails:**
- invalid-no-at-sign
- invalid@no-tld
- @missing-local.com
- missing-domain@.com

**Valid Contact Form Data:**
```json
{
  "name": "Test User",
  "email": "test@caterpillarranch.com",
  "subject": "Product Question",
  "message": "This is a test message from the automated test suite."
}
```

**Edge Case Strings:**
- Name (101 chars): "a" repeated 101 times
- Message (2001 chars): "a" repeated 2001 times

---

## Success Criteria

**Backend (API):**
- All newsletter API tests pass (TC-N1 to TC-N7)
- All contact API tests pass (TC-C1 to TC-C9)
- Database entries created correctly

**Frontend:**
- Footer displays on all pages
- Newsletter form submits successfully
- Contact modal opens, submits, closes correctly
- Policy pages render and navigate correctly
- Social/admin links work
- Error pages show ErrorHeader + Footer (no crashes)

**Integration:**
- Rate limiting works correctly (blocks after limit)
- Database contains test data with correct timestamps/values

**Overall:** 100% pass rate on critical tests (TC-N1, TC-C1, TC-F1-F10, TC-NF1-2, TC-CM1-9, TC-P1-P9, TC-E1-E5)

---

## Test Execution Log

### Phase 1: API Testing
**Started:** [Timestamp]
**Status:** Not Started

### Phase 2: Frontend Testing
**Started:** [Timestamp]
**Status:** Not Started

### Phase 3: Integration Testing
**Started:** [Timestamp]
**Status:** Not Started

---

## Issues Found
[To be populated during testing]

---

## Final Report
[To be populated after all tests complete]
