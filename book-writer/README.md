# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


 You have several places to check traffic across your stack:

  ---
  1. CloudFront — Website Visits & Bandwidth

  Console → CloudFront → Distributions → E10H330PTPGRY0 → Monitoring tab

  Shows:
  - Total requests per day/week/month
  - Bandwidth (data transferred)
  - HTTP error rates (4xx, 5xx)
  - Cache hit ratio

  CLI:
  aws cloudfront get-distribution-statistics \
    --distribution-id E10H330PTPGRY0 \
    --start-time 2026-03-01 --end-time 2026-03-15 \
    --granularity DAILY

  ---
  2. API Gateway — API Calls & Errors

  Console → API Gateway → book-writer-api → Monitor tab

  Shows:
  - Request count (total API calls)
  - Latency (p50, p99)
  - 4xx / 5xx errors

  CLI (last 7 days):
  aws cloudwatch get-metric-statistics \
    --namespace AWS/ApiGateway \
    --metric-name Count \
    --dimensions Name=ApiId,Value=no4ps0813m \
    --start-time $(date -v-7d +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Sum

  ---
  3. Lambda — Invocations & Performance

  Console → Lambda → book-writer-api → Monitor tab

  Shows:
  - Invocations (= API calls that hit Lambda)
  - Duration (how long each call takes)
  - Error count & rate
  - Throttles
  - Concurrent executions

  CLI:
  aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=book-writer-api \
    --start-time $(date -v-7d +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Sum

  ---
  4. DynamoDB — Read/Write Usage

  Console → DynamoDB → Tables → BookWriterBooks → Monitor tab

  Shows:
  - Read/Write consumed capacity
  - Successful requests
  - Latency

  ---
  5. CloudWatch Logs — Raw Lambda Logs

  Console → CloudWatch → Log groups → /aws/lambda/book-writer-api

  Shows every Lambda invocation log including:
  - Which route was called
  - Any errors
  - Execution time

  CLI (last 10 log entries):
  aws logs tail /aws/lambda/book-writer-api --since 1h

  ---
  6. Cost & Usage (real spend)

  Console → Billing → Cost Explorer

  Filter by service to see exactly what each component costs as traffic grows.

  ---
  Quick Summary — What to Check Where

  ┌──────────────────────────────────┬───────────────────────────────┐
  │             Question             │         Where to look         │
  ├──────────────────────────────────┼───────────────────────────────┤
  │ How many people visited my site? │ CloudFront → Monitoring       │
  ├──────────────────────────────────┼───────────────────────────────┤
  │ How many API calls were made?    │ API Gateway → Monitor         │
  ├──────────────────────────────────┼───────────────────────────────┤
  │ Which routes are being hit most? │ CloudWatch Logs → Lambda logs │
  ├──────────────────────────────────┼───────────────────────────────┤
  │ Are there any errors?            │ Lambda → Monitor → Error rate │
  ├──────────────────────────────────┼───────────────────────────────┤
  │ How much is it costing?          │ Billing → Cost Explorer       │
  ├──────────────────────────────────┼───────────────────────────────┤
  │ Is it slow?                      │ Lambda → Duration metric      │
  └──────────────────────────────────┴───────────────────────────────┘