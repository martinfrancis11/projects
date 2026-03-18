#!/bin/bash
set -e

# ── Config ────────────────────────────────────────────────────────────────────
REGION="us-east-1"
ACCOUNT="857590206967"
FUNCTION_NAME="stock-analysis-api"
LAMBDA_ROLE_NAME="stock-analysis-lambda-role"
API_NAME="stock-analysis-api"
S3_BUCKET="stock-analysis-app-${ACCOUNT}"
CF_COMMENT="StockIntel React App"

# ── Colours ───────────────────────────────────────────────────────────────────
G='\033[0;32m'; Y='\033[0;33m'; R='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${G}▶ $*${NC}"; }
warn()  { echo -e "${Y}⚠ $*${NC}"; }
error() { echo -e "${R}✘ $*${NC}"; exit 1; }

# ── Pre-flight ────────────────────────────────────────────────────────────────
command -v aws  >/dev/null || error "aws CLI not found"
command -v node >/dev/null || error "node not found"
command -v zip  >/dev/null || error "zip not found"

# Read API key from backend/.env
ANTHROPIC_API_KEY=$(grep '^ANTHROPIC_API_KEY=' backend/.env | cut -d= -f2-)
[ -z "$ANTHROPIC_API_KEY" ] && error "ANTHROPIC_API_KEY not found in backend/.env"
[[ "$ANTHROPIC_API_KEY" == your_* ]] && error "ANTHROPIC_API_KEY is still the placeholder — add your real key"

info "Using AWS account $ACCOUNT in $REGION"

# ═══════════════════════════════════════════════════════════════════════════════
# 1. LAMBDA IAM ROLE
# ═══════════════════════════════════════════════════════════════════════════════
info "1/7  Setting up Lambda IAM role..."

ROLE_ARN=$(aws iam get-role --role-name "$LAMBDA_ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || true)

if [ -z "$ROLE_ARN" ]; then
  ROLE_ARN=$(aws iam create-role \
    --role-name "$LAMBDA_ROLE_NAME" \
    --assume-role-policy-document '{
      "Version":"2012-10-17",
      "Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]
    }' \
    --query 'Role.Arn' --output text)

  aws iam attach-role-policy \
    --role-name "$LAMBDA_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  info "   Role created: $ROLE_ARN — waiting for IAM propagation..."
  sleep 12
else
  info "   Role exists: $ROLE_ARN"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 2. BUILD LAMBDA ZIP
# ═══════════════════════════════════════════════════════════════════════════════
info "2/7  Building Lambda package..."

BUILD_DIR="/tmp/stock-analysis-lambda-$$"
rm -rf "$BUILD_DIR" && mkdir -p "$BUILD_DIR"

cp backend/server.js backend/lambda.js backend/package.json "$BUILD_DIR/"

# Install production deps only
cd "$BUILD_DIR"
npm install --production --silent
cd - >/dev/null

ZIP_FILE="/tmp/stock-analysis-lambda-$$.zip"
cd "$BUILD_DIR"
zip -r "$ZIP_FILE" . -x "*.DS_Store" >/dev/null
cd - >/dev/null

ZIP_SIZE_MB=$(du -m "$ZIP_FILE" | cut -f1)
info "   Package size: ${ZIP_SIZE_MB}MB"

# ═══════════════════════════════════════════════════════════════════════════════
# 3. DEPLOY LAMBDA
# ═══════════════════════════════════════════════════════════════════════════════
info "3/7  Deploying Lambda function..."

EXISTING=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text 2>/dev/null || true)

if [ -z "$EXISTING" ]; then
  LAMBDA_ARN=$(aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs18.x \
    --role "$ROLE_ARN" \
    --handler lambda.handler \
    --zip-file "fileb://$ZIP_FILE" \
    --timeout 60 \
    --memory-size 512 \
    --environment "Variables={ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}}" \
    --region "$REGION" \
    --query 'FunctionArn' --output text)
  info "   Lambda created: $LAMBDA_ARN"
else
  # Wait for any in-progress update before touching the function
  aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null || true

  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$REGION" >/dev/null

  aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null || true

  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "Variables={ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}}" \
    --timeout 60 \
    --memory-size 512 \
    --region "$REGION" >/dev/null

  LAMBDA_ARN=$EXISTING
  info "   Lambda updated: $LAMBDA_ARN"
fi

# Wait for update to complete
aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null || true

rm -rf "$BUILD_DIR" "$ZIP_FILE"

# ═══════════════════════════════════════════════════════════════════════════════
# 4. API GATEWAY HTTP API
# ═══════════════════════════════════════════════════════════════════════════════
info "4/7  Setting up API Gateway HTTP API..."

EXISTING_API=$(aws apigatewayv2 get-apis --region "$REGION" \
  --query "Items[?Name=='${API_NAME}'].ApiId" --output text 2>/dev/null || true)

if [ -z "$EXISTING_API" ]; then
  API_ID=$(aws apigatewayv2 create-api \
    --name "$API_NAME" \
    --protocol-type HTTP \
    --cors-configuration AllowOrigins='["*"]',AllowMethods='["GET","POST","OPTIONS"]',AllowHeaders='["Content-Type"]' \
    --region "$REGION" \
    --query 'ApiId' --output text)
  info "   API created: $API_ID"
else
  API_ID=$EXISTING_API
  info "   API exists: $API_ID"
fi

# Lambda permission for API Gateway
aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id "apigateway-${API_ID}" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT}:${API_ID}/*/*" \
  --region "$REGION" 2>/dev/null || true

# Integration
INTEG_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --region "$REGION" \
  --query 'Items[0].IntegrationId' --output text 2>/dev/null || true)

if [ -z "$INTEG_ID" ] || [ "$INTEG_ID" = "None" ]; then
  INTEG_ID=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT}:function:${FUNCTION_NAME}" \
    --payload-format-version 2.0 \
    --region "$REGION" \
    --query 'IntegrationId' --output text)
fi

# Default route → Lambda
aws apigatewayv2 create-route \
  --api-id "$API_ID" \
  --route-key 'ANY /{proxy+}' \
  --target "integrations/$INTEG_ID" \
  --region "$REGION" 2>/dev/null || true

# Auto-deploy stage
aws apigatewayv2 create-stage \
  --api-id "$API_ID" \
  --stage-name '$default' \
  --auto-deploy \
  --region "$REGION" 2>/dev/null || true

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com"
info "   API URL: $API_URL"

# ═══════════════════════════════════════════════════════════════════════════════
# 5. BUILD FRONTEND
# ═══════════════════════════════════════════════════════════════════════════════
info "5/7  Building React frontend..."

cd frontend
VITE_API_URL="$API_URL" npm run build -- --mode production 2>/dev/null
cd ..

info "   Build complete"

# ═══════════════════════════════════════════════════════════════════════════════
# 6. S3 BUCKET + FRONTEND UPLOAD
# ═══════════════════════════════════════════════════════════════════════════════
info "6/7  Deploying frontend to S3..."

# Create bucket if needed
if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
  aws s3api create-bucket --bucket "$S3_BUCKET" --region "$REGION" >/dev/null
  aws s3api put-public-access-block --bucket "$S3_BUCKET" \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" >/dev/null
  info "   Bucket created: $S3_BUCKET"
fi

aws s3 sync frontend/dist "s3://$S3_BUCKET" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" >/dev/null

aws s3 cp frontend/dist/index.html "s3://$S3_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" >/dev/null

info "   Files uploaded"

# ═══════════════════════════════════════════════════════════════════════════════
# 7. CLOUDFRONT
# ═══════════════════════════════════════════════════════════════════════════════
info "7/7  Setting up CloudFront..."

EXISTING_CF=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='${CF_COMMENT}'].Id" \
  --output text 2>/dev/null || true)

if [ -z "$EXISTING_CF" ]; then
  # Create OAI (Origin Access Identity) — same approach as other apps
  OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
    --cloud-front-origin-access-identity-config \
      "CallerReference=stock-analysis-$(date +%s),Comment=stock-analysis-oai" \
    --query 'CloudFrontOriginAccessIdentity.Id' --output text)

  CF_DIST=$(aws cloudfront create-distribution --distribution-config "{
    \"Comment\": \"${CF_COMMENT}\",
    \"DefaultRootObject\": \"index.html\",
    \"Enabled\": true,
    \"Origins\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"Id\": \"s3-${S3_BUCKET}\",
        \"DomainName\": \"${S3_BUCKET}.s3.${REGION}.amazonaws.com\",
        \"S3OriginConfig\": {\"OriginAccessIdentity\": \"origin-access-identity/cloudfront/${OAI_ID}\"}
      }]
    },
    \"DefaultCacheBehavior\": {
      \"TargetOriginId\": \"s3-${S3_BUCKET}\",
      \"ViewerProtocolPolicy\": \"redirect-to-https\",
      \"CachePolicyId\": \"658327ea-f89d-4fab-a63d-7e88639e58f6\",
      \"Compress\": true,
      \"AllowedMethods\": {\"Quantity\": 2, \"Items\": [\"GET\",\"HEAD\"], \"CachedMethods\": {\"Quantity\": 2, \"Items\": [\"GET\",\"HEAD\"]}}
    },
    \"CustomErrorResponses\": {
      \"Quantity\": 1,
      \"Items\": [{\"ErrorCode\": 403, \"ResponseCode\": \"200\", \"ResponsePagePath\": \"/index.html\", \"ErrorCachingMinTTL\": 0}]
    },
    \"CallerReference\": \"stock-analysis-$(date +%s)\",
    \"PriceClass\": \"PriceClass_100\"
  }" --query 'Distribution.{Id:Id,Domain:DomainName}' --output json)

  CF_ID=$(echo "$CF_DIST" | node -e "const c=[]; process.stdin.on('data',d=>c.push(d)); process.stdin.on('end',()=>{ const j=JSON.parse(Buffer.concat(c)); console.log(j.Id); })")
  CF_DOMAIN=$(echo "$CF_DIST" | node -e "const c=[]; process.stdin.on('data',d=>c.push(d)); process.stdin.on('end',()=>{ const j=JSON.parse(Buffer.concat(c)); console.log(j.Domain); })")

  # Grant OAI access to S3
  aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy "{
    \"Version\":\"2012-10-17\",
    \"Statement\":[{
      \"Effect\":\"Allow\",
      \"Principal\":{\"CanonicalUser\":\"$(aws cloudfront list-cloud-front-origin-access-identities --query "CloudFrontOriginAccessIdentityList.Items[?Id=='${OAI_ID}'].S3CanonicalUserId" --output text)\"},
      \"Action\":\"s3:GetObject\",
      \"Resource\":\"arn:aws:s3:::${S3_BUCKET}/*\"
    }]
  }" >/dev/null

  info "   CloudFront created (deploying — takes ~5 min): $CF_DOMAIN"
else
  CF_ID=$EXISTING_CF
  CF_DOMAIN=$(aws cloudfront get-distribution --id "$CF_ID" \
    --query 'Distribution.DomainName' --output text)
  aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths '/*' >/dev/null
  info "   CloudFront updated: $CF_DOMAIN"
fi

# Save deployment info
cat > DEPLOYMENT.md << EOF
# StockIntel Deployment

## URLs
- **Frontend:** https://${CF_DOMAIN}
- **API:** ${API_URL}

## AWS Resources
- **S3 Bucket:** ${S3_BUCKET} (${REGION})
- **Lambda:** ${FUNCTION_NAME}
- **API Gateway:** ${API_ID}
- **CloudFront:** ${CF_ID}
- **AWS Account:** ${ACCOUNT}

## Re-deploy
\`\`\`bash
./deploy.sh
\`\`\`
EOF

echo ""
echo -e "${G}════════════════════════════════════════════════════${NC}"
echo -e "${G}  ✅  Deployment complete!${NC}"
echo -e "${G}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐  Frontend:  https://${CF_DOMAIN}"
echo -e "  🔌  API:       ${API_URL}"
echo ""
echo -e "  ${Y}CloudFront takes ~5 minutes to fully propagate.${NC}"
echo ""
