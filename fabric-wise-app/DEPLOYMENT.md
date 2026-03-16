# FabricIntel — AWS Deployment Details

## Live URL

| Type | URL |
|---|---|
| **CloudFront (HTTPS)** | https://d3hgvdkp3pujs3.cloudfront.net |

## AWS Resources

| Resource | Value |
|---|---|
| AWS Account | 857590206967 |
| S3 Bucket | `fabric-wise-app-857590206967` |
| S3 Region | `us-east-1` |
| CloudFront Distribution ID | `E203ZX8QJR49Z9` |
| CloudFront Domain | `d3hgvdkp3pujs3.cloudfront.net` |
| CloudFront OAI | `E3W3HOSKBO94OF` |

## Re-deploy (after changes)

```bash
cd /Users/martinfrancis/projects/fabric-wise-app
npm run build
aws s3 cp dist/index.html s3://fabric-wise-app-857590206967/index.html \
  --cache-control "no-cache, no-store, must-revalidate" --content-type "text/html"
aws s3 sync dist s3://fabric-wise-app-857590206967 \
  --exclude "index.html" --cache-control "public, max-age=31536000, immutable" --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E203ZX8QJR49Z9 \
  --paths "/*"
```
