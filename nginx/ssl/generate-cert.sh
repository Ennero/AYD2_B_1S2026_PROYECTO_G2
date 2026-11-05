#!/usr/bin/env bash
set -euo pipefail
umask 077

SSL_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"
if [[ $# -gt 1 || ( $# -eq 1 && "$1" != "--force" ) ]]; then
    echo "Usage: bash nginx/ssl/generate-cert.sh [--force]" >&2
    exit 2
fi
if [[ "${1:-}" != "--force" && -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
    echo "Local certificate pair exists; use --force to replace it."
    exit 0
fi
command -v openssl >/dev/null || { echo "OpenSSL is required." >&2; exit 1; }
KEY_ARG="$KEY_FILE"
CERT_ARG="$CERT_FILE"
if command -v cygpath >/dev/null; then
    KEY_ARG="$(cygpath -m "$KEY_FILE")"
    CERT_ARG="$(cygpath -m "$CERT_FILE")"
fi
# Disable Git Bash conversion of the X.509 subject; file arguments above use native paths.
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$KEY_ARG" -out "$CERT_ARG" -days 365 \
    -subj "/CN=localhost/O=LogiTrans/C=GT" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
echo "Generated a local-development certificate pair. The .pem files must remain outside Git."
openssl x509 -in "$CERT_FILE" -noout -subject -dates
