#!/bin/sh

# Directory where certs will be stored
CERT_DIR=/etc/nginx/certs

# Check if SSL certificate and key are present
if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
    echo "No SSL certificates found. Generating self-signed certificate..."
    mkdir -p $CERT_DIR
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $CERT_DIR/privkey.pem \
        -out $CERT_DIR/fullchain.pem \
        -subj "/C=US/ST=YourState/L=YourCity/O=YourOrganization/OU=IT Department/CN=localhost"
    echo "Self-signed SSL certificate generated."
else
    echo "Using existing SSL certificates."
fi

# Start Nginx in foreground
exec nginx -g 'daemon off;'
