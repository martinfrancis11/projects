#!/usr/bin/env bash
# =============================================================
# Book Writer — CloudFront Distribution Setup (HTTPS + CDN)
# Run AFTER deploy-aws.sh
# Usage: ./cloudfront-setup.sh my-book-writer-bucket-name
# =============================================================
set -e

BUCKET_NAME="${1:-book-writer-app}"
REGION="${AWS_REGION:-us-east-1}"
ORIGIN="$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo "Creating CloudFront distribution..."
DIST=$(aws cloudfront create-distribution \
  --distribution-config "{
    \"CallerReference\": \"book-writer-$(date +%s)\",
    \"Origins\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"Id\": \"S3-$BUCKET_NAME\",
        \"DomainName\": \"$ORIGIN\",
        \"CustomOriginConfig\": {
          \"HTTPPort\": 80,
          \"HTTPSPort\": 443,
          \"OriginProtocolPolicy\": \"http-only\"
        }
      }]
    },
    \"DefaultCacheBehavior\": {
      \"TargetOriginId\": \"S3-$BUCKET_NAME\",
      \"ViewerProtocolPolicy\": \"redirect-to-https\",
      \"AllowedMethods\": {\"Quantity\": 2, \"Items\": [\"GET\", \"HEAD\"]},
      \"ForwardedValues\": {
        \"QueryString\": false,
        \"Cookies\": {\"Forward\": \"none\"}
      },
      \"MinTTL\": 0,
      \"DefaultTTL\": 86400,
      \"MaxTTL\": 31536000,
      \"Compress\": true
    },
    \"CustomErrorResponses\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"ErrorCode\": 404,
        \"ResponsePagePath\": \"/index.html\",
        \"ResponseCode\": \"200\",
        \"ErrorCachingMinTTL\": 300
      }]
    },
    \"Comment\": \"Book Writer App\",
    \"Enabled\": true,
    \"HttpVersion\": \"http2\",
    \"PriceClass\": \"PriceClass_100\"
  }" \
  --output json)

DOMAIN=$(echo "$DIST" | python3 -c "import sys,json; print(json.load(sys.stdin)['Distribution']['DomainName'])")
DIST_ID=$(echo "$DIST" | python3 -c "import sys,json; print(json.load(sys.stdin)['Distribution']['Id'])")

echo "========================================"
echo "  CloudFront distribution created!"
echo "  Domain : https://$DOMAIN"
echo "  ID     : $DIST_ID"
echo ""
echo "  Note: Distribution takes ~10-15 min"
echo "  to fully deploy globally."
echo "========================================"
