# Design Upload - Ready to Run!

## ✅ What's Already Done

- ✅ Dependencies installed (`tsx`, `formdata-node`)
- ✅ Design images extracted to `./designs/` folder
- ✅ 21 files renamed to match product names exactly
- ✅ Upload script ready at `./scripts/bulk-upload-designs.ts`

## 📁 Current State

**Matched Designs (21 files ready)**:
```
China Doll Tee.png       → China Doll Tee
Cooti Pi Tee.png         → Cooti Pi Tee
Demon Tee.png            → Demon Tee
Doll Tee.png             → Doll Tee
Fat Boi Tee.png          → Fat Boi Tee
Fear Tee.png             → Fear Tee
Festival Tee.png         → Festival Tee
Glitch Tee.png           → Glitch Tee
Melty Tee.png            → Melty Tee
Metal Tee.png            → Metal Tee
Neon Paint Tee.png       → Neon Paint Tee
Protest Tee.png          → Protest Tee
Purp Tee.png             → Purp Tee
Rancch Bowl Tee.png      → Rancch Bowl Tee
Reflection Tee.png       → Reflection Tee
Robo Tee.png             → Robo Tee
Social Tee.png           → Social Tee
Tooth Tee.png            → Tooth Tee
Toxic Tee.png            → Toxic Tee
Toxic Wayst Tee.png      → Toxic Wayst Tee
Toy Tee.png              → Toy Tee
```

**Unmatched Files (7 - will be skipped)**:
```
102 (2).png
102.png
113.png
24.png
28.png
Korny.png
Slyme.png
```

## 🚀 Run the Upload (3 Steps)

### Step 1: Get Your Admin Token

1. Open: https://caterpillar-ranch.lando555.workers.dev/admin/login
2. Log in with admin credentials
3. Open DevTools: Press `F12` or Right-click → Inspect
4. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
5. Click **Cookies** → `https://caterpillar-ranch.lando555.workers.dev`
6. Find `admin_token` row
7. Copy the **Value** (long string)

### Step 2: Set the Token

```bash
export ADMIN_TOKEN='paste-your-token-here'
```

**Verify it's set**:
```bash
echo $ADMIN_TOKEN  # Should show your token
```

### Step 3: Run the Upload

```bash
npx tsx scripts/bulk-upload-designs.ts
```

## 📊 Expected Output

```
🐛 Caterpillar Ranch - Bulk Design Upload

📁 Found 28 image files in ./designs
📦 Found 21 products without designs

📸 Processing: China Doll Tee.png (5.2 MB)
   ✓ Matched to: China Doll Tee (cr-403422458)
   ✓ Uploaded successfully

📸 Processing: Cooti Pi Tee.png (4.2 MB)
   ✓ Matched to: Cooti Pi Tee (cr-403038882)
   ✓ Uploaded successfully

... (continues for all 21 matched files)

📸 Processing: Korny.png (6.4 MB)
   ⚠️  Skipped: No matching product found

============================================================
📊 UPLOAD SUMMARY

✓ Success: 21
✗ Errors:  0
⚠ Skipped: 7
─────────────────
  Total:   28

⚠️  SKIPPED:
   102 (2).png → No matching product found
   102.png → No matching product found
   113.png → No matching product found
   24.png → No matching product found
   28.png → No matching product found
   Korny.png → No matching product found
   Slyme.png → No matching product found

✨ Done!
```

## ✅ Verify Uploads

After successful upload, verify in admin portal:

1. Open: https://caterpillar-ranch.lando555.workers.dev/admin/products
2. Check that all 21 products now show design thumbnails
3. Visit a product page to see the design image displayed

## 🔧 Troubleshooting

### "ADMIN_TOKEN not set"
Run `export ADMIN_TOKEN='your-token'` again in the same terminal session.

### "Failed to fetch products: 401"
Your token expired. Get a new one by logging in again (Step 1).

### "Upload failed: 413"
A file is too large (>10MB). Check file sizes: `ls -lh designs/`

### All files skipped
Token is valid but something is wrong. Check:
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://caterpillar-ranch.lando555.workers.dev/api/admin/products
```

Should return JSON with products list.

## 📝 Notes

- **Script is idempotent**: Safe to re-run if some uploads fail
- **7 unmatched files**: These need manual mapping or are extras
- **File size**: All images are under 10MB (largest is 6.4MB)
- **Format**: All are PNG (supported)
- **Upload time**: ~30-45 seconds for 21 images

## 🐛 Need Help?

If you encounter issues, provide me with:
1. The exact error message
2. Output from: `ls -lh designs/ | grep -v "102\|113\|24\|28\|Korny\|Slyme"`
3. Whether you see your token: `echo $ADMIN_TOKEN | head -c 20`
