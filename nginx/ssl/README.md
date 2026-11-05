# Certificados locales

Ejecutar `bash nginx/ssl/generate-cert.sh` desde la raíz o desde cualquier otra carpeta. Requiere OpenSSL. Se generan `cert.pem` y `key.pem` con SAN para localhost/127.0.0.1 y permisos privados donde el sistema los admite.

Para sustituir una pareja anterior, usar `--force`. Los archivos `.pem` están ignorados por Git. El certificado es autofirmado y solo sirve para desarrollo; la configuración de un despliegue público debe utilizar sus propios certificados.
