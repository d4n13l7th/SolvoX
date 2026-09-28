# syntax=docker/dockerfile:1

# Backend image only: Express + Socket.IO (API, Socket.IO, data logs).
#
# The React frontend is deployed separately to Vercel, so it is intentionally NOT
# in this image. That keeps it small enough to build and run on a free 0.1 vCPU
# instance, which cannot afford a Vite build or 34MB of 4K video per deploy.
#
# The frontend points at this service via window.SOLVOX_CONFIG.backendUrl.
# backend/server.js still serves frontend/dist when that directory happens to
# exist, so a single-container local run keeps working unchanged.

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# The root package.json declares a "frontend" workspace, so install the two
# runtime deps directly rather than pulling the whole workspace tree back in.
COPY package.json ./
RUN npm install --no-save --no-audit --no-fund express@5.1.0 socket.io@4.8.1 \
  && npm cache clean --force

COPY server.js ./
COPY backend ./backend

# data/ holds the append-only jsonl logs. On the free tier the platform only
# offers an ephemeral filesystem, so these reset whenever the instance sleeps.
RUN mkdir -p /app/data

EXPOSE 3000

# Free instances sleep when idle; keep this cheap and tolerant of a cold start.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
