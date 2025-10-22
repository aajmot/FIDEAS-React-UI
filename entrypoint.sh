#!/bin/sh

# Create runtime config file
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  REACT_APP_API_URL: '${REACT_APP_API_URL:-http://localhost:8000}'
};
EOF

# Start nginx
nginx -g 'daemon off;'