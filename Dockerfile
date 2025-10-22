# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

COPY .env.Production .env

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script with executable permission (avoid RUN chmod which may fail on some filesystems)
COPY --chmod=0755 entrypoint.sh /entrypoint.sh

EXPOSE 80

# NOTE: `apk add curl` and the HEALTHCHECK were removed temporarily because
# executing RUN inside this build was failing with an input/output error on
# this host's Docker runtime. Re-add these lines after Docker storage/runtime
# issues are resolved.

ENTRYPOINT ["/entrypoint.sh"]