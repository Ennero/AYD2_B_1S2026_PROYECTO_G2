#!/bin/bash

# Script to generate self-signed SSL certificates for local development

SSL_DIR="nginx/ssl"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"
DAYS_VALID=365

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Check if certificate already exists
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "[OK]   SSL certificates already exist at:"
    echo "       - $CERT_FILE"
    echo "       - $KEY_FILE"
    exit 0
fi

echo "[INFO] Generating self-signed SSL certificates..."
echo "       Output directory: $SSL_DIR"
echo "       Validity: $DAYS_VALID days"
echo ""

# Generate private key and certificate
openssl req -x509 -newkey rsa:2048 -keyout "$KEY_FILE" -out "$CERT_FILE" \
    -days "$DAYS_VALID" -nodes \
    -subj "/CN=localhost/O=LogiTrans/C=GT"

if [ $? -eq 0 ]; then
    echo "[OK]   SSL certificates generated successfully!"
    echo ""
    echo "Certificate details:"
    openssl x509 -in "$CERT_FILE" -text -noout | grep -E "Subject:|Issuer:|Not Before|Not After"
    echo ""
    echo "[WARN] This is a self-signed certificate for LOCAL DEVELOPMENT ONLY"
    echo "       Your browser will show security warnings. This is expected."
    echo ""
    echo "Usage:"
    echo "  - HTTP:  http://localhost"
    echo "  - HTTPS: https://localhost (ignore certificate warning)"
    echo ""
else
    echo "[ERR]  Failed to generate SSL certificates!"
    exit 1
fi
