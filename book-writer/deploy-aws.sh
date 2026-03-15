#!/usr/bin/env bash
# =============================================================
# Book Writer — AWS S3 + CloudFront Deployment Script
# =============================================================
# Prerequisites:
#   aws CLI installed and configured (aws configure)
#   An existing S3 bucket or let this script create one.
#
# Usage:
#   chmod +x deploy-aws.sh
#   ./deploy-aws.sh my-book-writer-bucket-name
# =============================================================

set -e

BUCKET_NAME="${1:-book-writer-app}"
REGION="${AWS_REGION:-us-east-1}"
BUILD_DIR="dist"

echo "========================================"
echo "  Book Writer — AWS Deployment"
echo "========================================"
echo "  Bucket  : $BUCKET_NAME"
echo "  Region  : $REGION"
echo "========================================"

# 1. Build
echo ""
echo "[1/5] Building app..."
npm run build
echo "    ✓ Build complete"

# 2. Create bucket (if it doesn't exist)
echo ""
echo "[2/5] Creating S3 bucket (if not exists)..."
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "    ✓ Bucket already exists"
else
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
  else
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION"
  fi
  echo "    ✓ Bucket created"
fi

# 3. Configure bucket for static website hosting
echo ""
echo "[3/5] Configuring static website hosting..."
aws s3api put-bucket-website \
  --bucket "$BUCKET_NAME" \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'

# Allow public access
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\"
    }]
  }"
echo "    ✓ Website hosting configured"

# 4. Upload build
echo ""
echo "[4/5] Uploading files..."
# Upload HTML with no-cache
aws s3 cp "$BUILD_DIR/index.html" "s3://$BUCKET_NAME/index.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# Upload assets with long cache
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --exclude "index.html" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete
echo "    ✓ Upload complete"

# 5. Print URL
WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"
echo ""
echo "[5/5] Done!"
echo "========================================"
echo "  Website URL:"
echo "  $WEBSITE_URL"
echo ""
echo "  Tip: For HTTPS, set up a CloudFront"
echo "  distribution pointing to this bucket."
echo "========================================"
