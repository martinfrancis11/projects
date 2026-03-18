# StockIntel — AWS Deployment

## Live URLs
| | URL |
|---|---|
| 🌐 **Frontend** | https://d2b3f1tdzsgzec.cloudfront.net |
| 🔌 **API** | https://s4c05r1bqd.execute-api.us-east-1.amazonaws.com |

---

## AWS Resources
| Resource | Value | Region |
|---|---|---|
| **S3 Bucket** | stock-analysis-app-857590206967 | us-east-1 |
| **Lambda Function** | stock-analysis-api | us-east-1 |
| **API Gateway ID** | s4c05r1bqd | us-east-1 |
| **CloudFront Distribution ID** | E2DHSWXVUF8LJX | Global |
| **CloudFront Domain** | d2b3f1tdzsgzec.cloudfront.net | Global |
| **AWS Account** | 857590206967 | — |

---

## Architecture

```
Browser
  │
  ├── Static Assets (HTML/JS/CSS)
  │     └── CloudFront → S3 (stock-analysis-app-857590206967)
  │
  └── API Calls (/api/*)
        └── API Gateway (s4c05r1bqd)
              └── Lambda (stock-analysis-api, Node 18, 512MB, 60s timeout)
                    ├── GET  /api/stock/:symbol  → Yahoo Finance (free, no key)
                    ├── GET  /api/search         → Yahoo Finance (free, no key)
                    └── POST /api/analyze        → Anthropic API (claude-haiku-4-5)
```

---

## Environment Variables
| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Lambda env + `backend/.env` | Anthropic API key for Claude AI |
| `PORT` | `backend/.env` (local only) | Local dev server port (default 3001) |

---

## Re-deploy
Run from the project root after any code changes:
```bash
cd /Users/martinfrancis/projects/stock-analysis
./deploy.sh
```

The script handles all steps automatically:
1. Packages the Lambda function (production deps only, ~3MB)
2. Updates Lambda code + environment variables
3. Rebuilds the React frontend with the API Gateway URL injected
4. Syncs new build to S3
5. Invalidates CloudFront cache

---

## Local Development
```bash
# Terminal 1 — Backend (http://localhost:3001)
cd backend && node server.js

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```
Vite proxies all `/api/*` requests to `localhost:3001` in dev mode.

---

## Cost Estimate (monthly)
| Service | Usage | Cost |
|---|---|---|
| Lambda | ~1M req free tier | ~$0.00 |
| API Gateway | ~1M req free tier | ~$0.00 |
| S3 | < 1GB storage | ~$0.02 |
| CloudFront | 1TB free (first 12 months) | ~$0.00 |
| Anthropic API | ~$0.001 per analysis | Pay per use |
| **Total** | | **~$0–2/month** |

---

## Useful Commands

### View Lambda logs
```bash
aws logs tail /aws/lambda/stock-analysis-api --follow --region us-east-1
```

### Invalidate CloudFront cache manually
```bash
aws cloudfront create-invalidation \
  --distribution-id E2DHSWXVUF8LJX \
  --paths "/*"
```

### Update API key in Lambda
```bash
aws lambda update-function-configuration \
  --function-name stock-analysis-api \
  --environment "Variables={ANTHROPIC_API_KEY=sk-ant-...}" \
  --region us-east-1
```

### Test API endpoint
```bash
curl "https://s4c05r1bqd.execute-api.us-east-1.amazonaws.com/api/stock/AAPL?period=1mo"
```
