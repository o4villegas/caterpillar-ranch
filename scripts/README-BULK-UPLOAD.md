# Bulk Design Upload Script

Uploads product design images from a local folder to R2 storage and updates the database.

## Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev tsx formdata-node
```

### 2. Get Your Admin Token

**Option A: From Browser (Recommended)**
1. Open https://caterpillar-ranch.lando555.workers.dev/admin/login
2. Log in with admin credentials
3. Open browser DevTools (F12) → Application/Storage → Cookies
4. Copy the value of `admin_token` cookie

**Option B: Generate New Token**
```bash
# Log in via API
curl -X POST https://caterpillar-ranch.lando555.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Response will include token in Set-Cookie header
```

### 3. Set Environment Variable

```bash
export ADMIN_TOKEN="your-token-here"
```

Or create `.env` file in project root:
```
ADMIN_TOKEN=your-token-here
```

### 4. Prepare Design Images

Create a `designs/` folder in the project root and add your images:

```bash
mkdir designs
# Copy your design images into this folder
```

**File Naming Convention** (by product name):
```
designs/
├── Protest Tee.png
├── Fear Tee.jpg
├── Toxic Tee.png
├── Robo Tee.webp
└── ... (21 products total)
```

**Requirements**:
- Format: PNG, JPG, JPEG, or WebP
- Max size: 10MB per file
- File names should match product names (fuzzy matching supported)

### 5. Run the Script

```bash
npx tsx scripts/bulk-upload-designs.ts
```

## Current Products (21 total)

All products currently have `design_url = null` and need images:

1. China Doll Tee (cr-403422458)
2. Cooti Pi Tee (cr-403038882)
3. Demon Tee (cr-403249054)
4. Doll Tee (cr-403249451)
5. Fat Boi Tee (cr-403248474)
6. Fear Tee (cr-403248280)
7. Festival Tee (cr-403040104)
8. Glitch Tee (cr-402862392)
9. Melty Tee (cr-403039363)
10. Metal Tee (cr-403039216)
11. Neon Paint Tee (cr-403422613)
12. Protest Tee (cr-403422954)
13. Purp Tee (cr-403422775)
14. Rancch Bowl Tee (cr-403037502)
15. Reflection Tee (cr-403160852)
16. Robo Tee (cr-403247200)
17. Social Tee (cr-403248718)
18. Tooth Tee (cr-403038065)
19. Toxic Tee (cr-403422837)
20. Toxic Wayst Tee (cr-403038616)
21. Toy Tee (cr-403249292)

## How Matching Works

The script uses **fuzzy matching** to match filenames to product names:

**Exact Match Examples** (best):
- `Protest Tee.png` → "Protest Tee" ✅
- `fear tee.jpg` → "Fear Tee" ✅ (case-insensitive)

**Partial Match Examples** (fallback):
- `protest.png` → "Protest Tee" ✅
- `Fear-Tee-Design.jpg` → "Fear Tee" ✅

**No Match Examples**:
- `random-image.png` → No match ⚠️ (skipped)
- `tshirt-001.png` → No match ⚠️ (skipped)

## Output Example

```
🐛 Caterpillar Ranch - Bulk Design Upload

📁 Found 21 image files in ./designs
📦 Found 21 products without designs

📸 Processing: Protest Tee.png (2.34 MB)
   ✓ Matched to: Protest Tee (cr-403422954)
   ✓ Uploaded successfully

📸 Processing: Fear Tee.jpg (1.87 MB)
   ✓ Matched to: Fear Tee (cr-403248280)
   ✓ Uploaded successfully

... (continues for all files)

============================================================
📊 UPLOAD SUMMARY

✓ Success: 20
✗ Errors:  0
⚠ Skipped: 1
─────────────────
  Total:   21

⚠️  SKIPPED:

   random-image.png
   └─ No matching product found

✨ Done!
```

## Troubleshooting

### "ADMIN_TOKEN not set"
Set the environment variable or create `.env` file with your token.

### "Designs folder not found"
Create `designs/` folder in project root: `mkdir designs`

### "No image files found"
Add PNG/JPG/WebP files to `designs/` folder.

### "Failed to fetch products: 401"
Your admin token is invalid or expired. Get a new one from the browser cookies after logging in.

### "No matching product found"
The filename doesn't match any product name. Rename the file to match a product from the list above.

### "File too large (max 10MB)"
Compress the image or reduce dimensions. Most designs should be under 5MB.

## Advanced: Manual CSV Mapping

If fuzzy matching doesn't work, create a `design-mapping.csv`:

```csv
filename,product_id
protest-tee-final.png,cr-403422954
fear-design-v2.jpg,cr-403248280
```

Then modify the script to read from CSV instead of fuzzy matching.

## Notes

- **Idempotent**: Re-running is safe. Products with existing designs will be skipped.
- **R2 Storage**: Images are stored in `caterpillar-ranch-designs` R2 bucket.
- **Database**: Metadata saved to `product_designs` table in D1.
- **Public URLs**: Designs served via `/api/admin/designs/serve/{filename}`.
- **No Overwrite**: Current script doesn't overwrite existing designs (all are null anyway).

## Next Steps After Upload

1. Verify uploads in admin portal: https://caterpillar-ranch.lando555.workers.dev/admin/products
2. Check R2 bucket: `wrangler r2 object list caterpillar-ranch-designs`
3. Verify database: `wrangler d1 execute Rancch-DB --remote --command="SELECT * FROM product_designs;"`
4. Test frontend: Visit product pages to see designs displayed
