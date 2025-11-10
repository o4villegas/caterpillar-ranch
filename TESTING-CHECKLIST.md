# Session-Based Game Replay Testing Checklist

## ✅ Automated Tests Completed

1. **TypeScript Compilation**: PASSED
   - All files compile without errors
   - No type mismatches in hooks or components

2. **Dev Server**: RUNNING
   - Homepage: http://localhost:5173/
   - Product pages work correctly
   - Play Game button renders in HTML

3. **Session Storage Logic**: VERIFIED
   - Test page created: http://localhost:5173/test-session-tracking.html
   - Logic correctly implements Set-based tracking
   - Uses sessionStorage (clears on tab close)

## 🌐 Manual Browser Tests Required

### Test 1: Initial State (Button Shows)
**Steps:**
1. Open browser: http://localhost:5173/
2. Click any product card (e.g., "Punk Edition")
3. **VERIFY**: 🎮 Play Game button is visible and enabled (after selecting size)

**Expected Result:**
- Button shows: "🎮 Play Game - Earn up to 40% Off"
- Button is enabled after size selection
- sessionStorage is empty (check DevTools → Application → Session Storage)

---

### Test 2: Play Game (Button Hides)
**Steps:**
1. From Test 1, click "🎮 Play Game" button
2. Game modal should open
3. Close modal (X button) without completing game
4. Return to product page (if navigated away)
5. **VERIFY**: 🎮 Play Game button is now HIDDEN

**Expected Result:**
- Button no longer visible on product page
- sessionStorage contains: `["cr-punk"]` (or appropriate product ID)
- Discount section shows: "No discount earned yet" or similar

---

### Test 3: Same Session, Different Product (Independent Tracking)
**Steps:**
1. From Test 2, navigate back to homepage
2. Click a DIFFERENT product (e.g., "Rock Edition")
3. **VERIFY**: 🎮 Play Game button IS visible for this product

**Expected Result:**
- Button shows for new product (not played yet)
- sessionStorage contains only first product: `["cr-punk"]`
- Each product tracked independently

---

### Test 4: Complete Game and Earn Discount
**Steps:**
1. From Test 3, click "🎮 Play Game" on second product
2. Complete game successfully (earn 20-40% discount)
3. Click "Claim Discount & Return" button
4. **VERIFY**: Back on product page, button is now HIDDEN

**Expected Result:**
- Button hidden after game completion
- Discount displays (e.g., "20% off earned")
- sessionStorage contains: `["cr-punk", "cr-rock"]`

---

### Test 5: New Session (Close/Reopen Tab) - CRITICAL TEST
**Steps:**
1. From Test 4, close the entire browser tab
2. Open NEW browser tab
3. Navigate to: http://localhost:5173/
4. Click the SAME product from Test 4
5. **VERIFY**: 🎮 Play Game button IS visible again

**Expected Result:**
- ✅ Button shows (new session = can play again)
- ✅ sessionStorage is empty (cleared on tab close)
- ✅ Previous discount may still be in localStorage (cart persistence)
- ✅ User can earn a NEW discount

---

### Test 6: Discount Replacement (Not Accumulation)
**Steps:**
1. From Test 5, play game and earn 30% discount
2. Add product to cart with 30% discount
3. Close browser tab, reopen new tab
4. Navigate to same product
5. Play game again, earn 20% discount (lower)
6. Check cart
7. **VERIFY**: Discount replaced, not accumulated

**Expected Result:**
- ✅ Cart shows ONE discount: 20% (latest)
- ✅ Previous 30% discount removed
- ✅ Only latest discount applies

---

### Test 7: Multiple Tabs (Independent Sessions)
**Steps:**
1. Open product in Tab A
2. Click "🎮 Play Game" → button hides
3. Open SAME product in new Tab B
4. **VERIFY**: Button shows in Tab B (different session)

**Expected Result:**
- ✅ Tab A: Button hidden
- ✅ Tab B: Button visible
- ✅ Each tab has separate sessionStorage
- ✅ User can play in both tabs independently

---

### Test 8: Cart Behavior with Different Discounts
**Steps:**
1. Play game, earn 30% discount
2. Add product to cart (M size, 30% off)
3. Close tab, reopen
4. Play game again, earn 20% discount
5. Add SAME product to cart (M size, 20% off)
6. Open cart
7. **VERIFY**: TWO separate cart lines

**Expected Result:**
- ✅ Cart item 1: M size, 30% off, price $21.00
- ✅ Cart item 2: M size, 20% off, price $24.00
- ✅ Items NOT merged (different earnedDiscount)

---

### Test 9: Session Tracking Isolation Test
**Steps:**
1. Open: http://localhost:5173/test-session-tracking.html
2. Click "Mark as Played"
3. **VERIFY**: Status changes to "Already played"
4. Click "Clear sessionStorage"
5. **VERIFY**: Status changes to "Can play game"

**Expected Result:**
- ✅ Demonstrates sessionStorage clears correctly
- ✅ Logic matches useGamePlaySession hook

---

## 🐛 Known Issues to Watch For

❌ **Bug if button NEVER hides**: `markAsPlayed()` not called
❌ **Bug if button STAYS hidden after tab close**: Using localStorage instead of sessionStorage
❌ **Bug if discounts accumulate**: Missing removeDiscount() before addDiscount()
❌ **Bug if cart items merge with different discounts**: CartContext matching logic broken

---

## 📊 Testing Summary Template

```
TEST RESULTS:
[ ] Test 1: Initial state - Button shows ✅ / ❌
[ ] Test 2: Play game - Button hides ✅ / ❌
[ ] Test 3: Different product - Button shows ✅ / ❌
[ ] Test 4: Complete game - Button hides ✅ / ❌
[ ] Test 5: NEW SESSION - Button shows ✅ / ❌ ⭐ CRITICAL
[ ] Test 6: Discount replacement ✅ / ❌ ⭐ CRITICAL
[ ] Test 7: Multiple tabs ✅ / ❌
[ ] Test 8: Cart separation ✅ / ❌ ⭐ CRITICAL
[ ] Test 9: Session isolation ✅ / ❌

OVERALL: PASS / FAIL
```

---

## 🚀 Next Steps After Testing

1. If ALL tests pass → Commit and push changes
2. If ANY test fails → Debug and fix before committing
3. Document any edge cases discovered during testing
