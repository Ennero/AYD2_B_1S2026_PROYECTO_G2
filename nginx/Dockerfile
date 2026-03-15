FROM nginx:stable-alpine

# Copy custom nginx configuration
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Create ssl directory (certs are mounted as a volume at runtime via docker-compose)
RUN mkdir -p /etc/nginx/ssl

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
