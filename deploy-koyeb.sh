#!/bin/bash
# Deploy the Solvox backend (Express + Socket.IO) to Koyeb's free instance.
#
# Prerequisites:
#   1. A free Koyeb account - https://app.koyeb.com/signup
#      (free tier: one instance, 512MB RAM, 0.1 vCPU, 2GB SSD, WebSockets OK)
#   2. A personal access token - https://app.koyeb.com/user/settings/api/
#   3. Run this from the repo root.
#
# Usage:
#   KOYEB_TOKEN=<token> ./deploy-koyeb.sh
#
# Notes:
#   - Free instances scale to zero after 1 hour with no traffic, and the
#     filesystem is ephemeral, so data/*.jsonl (leaderboard, evaluations,
#     feedback) resets every time the instance sleeps. Good enough for a demo,
#     not for records you need to keep.
#   - The frontend stays on Vercel. After /health is ok here, point
#     frontend/public/config.js at the Koyeb URL and redeploy.

set -euo pipefail

APP="solvox"
SERVICE="api"
REGION="fra"   # free instances can only run in Frankfurt or Washington, D.C.

: "${KOYEB_TOKEN:?set KOYEB_TOKEN to your Koyeb personal access token}"

KY="${KY:-/tmp/opencode/koyeb}"
[ -x "$KY" ] || { echo "koyeb CLI not found at $KY" >&2; exit 1; }

echo "==> authenticating"
"$KY" login --token "$KOYEB_TOKEN"

echo "==> deploying backend to $APP/$SERVICE (region $REGION)"
"$KY" deploy . "$APP/$SERVICE" \
  --docker \
  --docker-dockerfile Dockerfile \
  --region "$REGION" \
  --port 3000 \
  --instance-type nano \
  --checks 3000:http:/health \
  --env NODE_ENV=production \
  --env PORT=3000

echo
echo "==> follow the rollout with:  $KY services logs $APP/$SERVICE"
echo "    and check:                 https://$APP-$SERVICE.koyeb.app/health"
echo
echo "Once health returns ok, repoint the Vercel frontend:"
echo "    backendUrl in frontend/public/config.js -> https://$APP-$SERVICE.koyeb.app"
echo "    then: cd frontend && vercel deploy --prod --yes"
