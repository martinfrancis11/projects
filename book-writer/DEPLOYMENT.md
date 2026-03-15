# Book Writer — AWS Deployment Details

## Live URLs

| Type | URL |
|---|---|
| **CloudFront (HTTPS)** | https://d3lvmi2zmb9gkw.cloudfront.net |
| S3 Website (HTTP) | http://book-writer-app-857590206967.s3-website-us-east-1.amazonaws.com |

## Auth & Backend

| Resource | Value |
|---|---|
| Cognito User Pool ID | `us-east-1_w9AmzY6D3` |
| Cognito Client ID | `20fnjsbakh8ag6kanaviug0fae` |
| API Gateway ID | `no4ps0813m` |
| API URL | `https://no4ps0813m.execute-api.us-east-1.amazonaws.com/prod` |
| Lambda Function | `book-writer-api` |
| DynamoDB Books Table | `BookWriterBooks` |
| DynamoDB Shares Table | `BookWriterShares` |

## AWS Resources

| Resource | Value |
|---|---|
| AWS Account | 857590206967 |
| S3 Bucket | `book-writer-app-857590206967` |
| S3 Region | `us-east-1` |
| CloudFront Distribution ID | `E10H330PTPGRY0` |
| CloudFront Domain | `d3lvmi2zmb9gkw.cloudfront.net` |

## Re-deploy (after changes)

```bash
cd /Users/martinfrancis/projects/book-writer
npm run build
aws s3 cp dist/index.html s3://book-writer-app-857590206967/index.html \
  --cache-control "no-cache, no-store, must-revalidate" --content-type "text/html"
aws s3 sync dist s3://book-writer-app-857590206967 \
  --exclude "index.html" --cache-control "public, max-age=31536000, immutable" --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E10H330PTPGRY0 \
  --paths "/*"
```

## ⚠️ Security — Do This Now

Your AWS access keys were shared in plain text. Rotate them immediately:
1. Go to AWS Console → IAM → Users → aws-admin → Security credentials
2. Create a new access key
3. Run `aws configure` with the new keys
4. Delete the old key
