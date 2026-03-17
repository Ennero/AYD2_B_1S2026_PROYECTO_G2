# LogiTrans Production Deployment Guide

## Overview

This document describes how to deploy LogiTrans with a **scalable, production-ready infrastructure** featuring:

- **2 NestJS API instances** with automatic load balancing
- **Nginx reverse proxy / load balancer** with SSL/TLS support
- **PostgreSQL 15** database with persistent storage
- **Next.js frontend** client
- **Automatic health checks** and failure recovery

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     Nginx Load Balancer                       │
│                  (HTTP/HTTPS on 80/443)                       │
│                                                                │
│   - SSL/TLS Termination                                       │
│   - Load Balancing (Least Connections)                        │
│   - Health Checks                                             │
└─────────────┬────────────────────────────────┬────────────────┘
              │                                │
      ┌───────▼────────┐            ┌──────────▼────────┐
      │   API Instance 1│           │  API Instance 2    │
      │  (NestJS)      │           │   (NestJS)        │
      │  Port 3001     │           │   Port 3002       │
      └────────┬───────┘           └────────┬──────────┘
               │                            │
               └───────────┬────────────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
        ┌────▼─────┐  ┌────▼────┐  ┌───▼────┐
        │PostgreSQL│  │Client  │
        │   (BD)   │  │(Next.js)
        │Port 5432 │  │Port 3000
        └──────────┘  └────────┘
```

## Prerequisites

### System Requirements

- **Docker**: v20.10+ (with Docker Compose)
- **OpenSSL**: For SSL certificate generation
- **Disk Space**: Minimum 2GB free (for containers + database volumes)
- **Memory**: Minimum 2GB RAM recommended
- **Network**: Ports 80 and 443 available

### Installation

#### macOS
```bash
# Using Homebrew
brew install docker
brew install openssl
```

#### Linux (Ubuntu/Debian)
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh | sh

# Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose

# OpenSSL (usually pre-installed)
# If not:
sudo apt-get install -y openssl
```

## Quick Start

### 1. Clone and Setup

```bash
# Navigate to project root
cd /path/to/logitrans

# Ensure all scripts are executable
chmod +x scripts/deploy.sh
chmod +x nginx/ssl/generate-cert.sh
```

### 2. Configure Environment

Create or update `.env.production`:

```bash
# Copy the template
cp server/.env.example server/.env.production

# Edit with your production values
nano server/.env.production
```

**Critical Environment Variables:**

```env
# Database
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=change_me_to_strong_password
DB_DATABASE=logitrans_db

# Server
PORT=3000
NODE_ENV=production
JWT_SECRET=generate_with_openssl_rand_base64_32

# CORS (For your production domain)
CORS_ORIGINS=https://app.example.com,https://www.example.com

# Transactional Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=no-reply@logitrans.gt

# Logging
DB_LOGGING=false
```

**Generate a strong JWT secret:**

```bash
openssl rand -base64 32
# Example output: 7HdK8mPqL9jNbVcXzA2fR5gT4iU6eO1wS3yQ0xBc=
```

### 3. Deploy

```bash
# Run the deployment script
./scripts/deploy.sh
```

The script will:
1. ✅ Check prerequisites (Docker, Docker Compose, OpenSSL)
2. ✅ Generate SSL certificates
3. ✅ Load environment variables
4. ✅ Build all Docker images
5. ✅ Start all services
6. ✅ Wait for services to be ready
7. ✅ Display deployment information

### 4. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Test API health
curl http://localhost/health

# Test with HTTPS
curl --insecure https://localhost/health
```

## Access Points

After deployment, access LogiTrans at:

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend (HTTP)** | `http://localhost` | Redirects to HTTPS |
| **Frontend (HTTPS)** | `https://localhost` | Main application |
| **API (HTTP)** | `http://localhost/api/` | Redirects to HTTPS |
| **API (HTTPS)** | `https://localhost/api/` | NestJS backend |
| **Health Check** | `https://localhost/health` | Load balancer monitor |
| **Database** | `localhost:5432` | PostgreSQL (internal) |

### Browser Certificate Warning

Since the deployment uses a **self-signed SSL certificate**, your browser will display a security warning:

**Firefox:**
- Click "Advanced..."
- Click "Accept the Risk and Continue"

**Chrome/Edge:**
- Click "Advanced"
- Click "Proceed to localhost (unsafe)"

**Safari:**
- Click "Show Details"
- Click "Visit this website"

This is **expected and normal** for local development with self-signed certificates.

## Load Balancing

### How It Works

The Nginx load balancer distributes requests to 2 API instances using the **least connections** strategy:

```
Request 1 ──┐
Request 2 ──┼──> Nginx ──> api-1 (0 connections)
Request 3 ──┤            └> api-2 (1 connection)
Request 4 ──┘
```

### Health Checks

Nginx continuously monitors API health:

- **Endpoint**: `GET /health`
- **Interval**: 10 seconds
- **Timeout**: 5 seconds
- **Failure Threshold**: 3 consecutive failures
- **Recovery**: Automatic when service responds

If an API instance fails, Nginx automatically routes all traffic to the healthy instance.

### Test Load Balancing

```bash
# Terminal 1: Watch API 1 logs
docker-compose -f docker-compose.prod.yml logs -f api-1

# Terminal 2: Watch API 2 logs
docker-compose -f docker-compose.prod.yml logs -f api-2

# Terminal 3: Send requests
for i in {1..10}; do
  curl https://localhost/api --insecure -s
done

# Both terminals should show incoming requests
```

## Database Management

### Access PostgreSQL

```bash
# Connect to database container
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d logitrans_db

# Common commands
\l                    # List databases
\dt                   # List tables
SELECT COUNT(*) FROM users;  # Query example
\q                    # Exit
```

### Backup Database

```bash
# Full backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres -d logitrans_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d logitrans_db < backup_20240314_120000.sql
```

### Database Volumes

Persistent data is stored in Docker volumes:

```bash
# View volumes
docker volume ls | grep logitrans

# Inspect volume location
docker volume inspect logitrans_postgres_data | grep Mountpoint

# Backup volumes (full file system)
docker run --rm -v logitrans_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

## Scaling to More Instances

To scale beyond 2 API instances:

### Method 1: Update docker-compose.prod.yml

Add more API instances (api-3, api-4, etc.) by copying the api-1 service definition and updating:
- Container name
- Service name
- Port (internal stays 3000, external mapping only for debugging)

Then add to Nginx upstream:

```nginx
upstream api_backend {
    least_conn;
    server api-1:3000 max_fails=3 fail_timeout=10s;
    server api-2:3000 max_fails=3 fail_timeout=10s;
    server api-3:3000 max_fails=3 fail_timeout=10s;  # New
    server api-4:3000 max_fails=3 fail_timeout=10s;  # New
}
```

Redeploy:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Method 2: Docker Swarm (Advanced)

For true horizontal scaling across multiple machines:

```bash
# Initialize Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml logitrans

# Scale service
docker service scale logitrans_api=5
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api-1
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f db

# Follow only errors
docker-compose -f docker-compose.prod.yml logs -f --tail=50 | grep ERROR

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Monitor Services

```bash
# Real-time resource usage
docker stats

# Service status
docker-compose -f docker-compose.prod.yml ps

# Container details
docker-compose -f docker-compose.prod.yml ps -a
```

## Common Tasks

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api-1

# Hard restart (stop + start)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Update Configuration

```bash
# Update .env variables
nano .env.production

# Restart services to apply (no rebuild needed for env changes)
docker-compose -f docker-compose.prod.yml restart api-1 api-2
```

### Update Application Code

```bash
# Rebuild and redeploy
docker-compose -f docker-compose.prod.yml up -d --build

# Or selective rebuild
docker-compose -f docker-compose.prod.yml up -d --build api-1
```

### View Container Shell

```bash
# Access API container
docker-compose -f docker-compose.prod.yml exec api-1 sh

# Inside container, useful commands:
# npm run build
# npm test
# exit
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
docker ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Rebuild without cache
docker-compose -f docker-compose.prod.yml up -d --build --no-cache
```

### Database Connection Error

```bash
# Check if database is ready
docker-compose -f docker-compose.prod.yml exec db pg_isready

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Verify environment variables are correct
docker-compose -f docker-compose.prod.yml exec api-1 env | grep DB_
```

### High Memory Usage

```bash
# Check memory usage by service
docker stats

# Reduce database cache (in server/.env)
DB_POOL_SIZE=5  # Lower value

# Restart after change
docker-compose -f docker-compose.prod.yml restart
```

### SSL Certificate Issues

```bash
# Regenerate certificates
rm -f nginx/ssl/cert.pem nginx/ssl/key.pem
bash nginx/ssl/generate-cert.sh

# Restart Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Nginx Returns 502 Bad Gateway

This means API instances are unreachable:

```bash
# Check if API services are running
docker-compose -f docker-compose.prod.yml ps api-1 api-2

# Check API health
docker-compose -f docker-compose.prod.yml exec api-1 curl http://localhost:3000/health

# Check Nginx logs
docker-compose -f docker-compose.prod.yml logs nginx | tail -20
```

## Production Best Practices

### Security

1. **Change Default Passwords**
   ```bash
   # Update in .env.production
   DB_PASSWORD=strong_random_password
   JWT_SECRET=openssl rand -base64 32
   ```

2. **Use Real SSL Certificates**
   - Replace self-signed with Let's Encrypt or your CA
   - Update nginx/Dockerfile to copy real certificates

3. **Enable Database Authentication**
   ```bash
   # PostgreSQL connection password lookup
   echo "db:5432:logitrans_db:postgres:PASSWORD" > ~/.pgpass
   chmod 600 ~/.pgpass
   ```

4. **Restrict Database Access**
   - Only allow connections from API containers
   - Never expose PostgreSQL port to public internet

### Performance

1. **Enable Gzip Compression** (already in nginx.conf)
2. **Cache Static Assets** (already in nginx.conf)
3. **Optimize Database Queries**
   - Add indexes for frequently queried columns
   - Monitor slow queries: `DB_LOGGING=true`

4. **Monitor Load Average**
   ```bash
   docker stats --no-stream
   ```

### Backup and Recovery

1. **Automated Backups** (consider implementing)
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup-db.sh
   ```

2. **Test Restores Regularly**
   ```bash
   # Restore in staging environment
   docker-compose -f docker-compose.staging.yml exec db psql < backup.sql
   ```

## Advanced Configuration

### Custom Domain (Production)

Update `docker-compose.prod.yml`:

```yaml
nginx:
  environment:
    - VIRTUAL_HOST=app.logitrans.com
    - LETSENCRYPT_HOST=app.logitrans.com
    - LETSENCRYPT_EMAIL=admin@logitrans.com
```

Update nginx/nginx.conf:

```nginx
server_name app.logitrans.com;
```

### Rate Limiting

Add to nginx.conf in `http` block:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

location /api/ {
    limit_req zone=api_limit burst=20;
    # ... proxy configuration
}
```

### CDN Integration

For static assets:

```nginx
location ~* \.(jpg|jpeg|png|gif|css|js)$ {
    add_header Cache-Control "public, max-age=31536000";
    add_header X-Content-Type-Options "nosniff";
}
```

## Rollback Procedure

If deployment fails:

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Revert code changes
git checkout <previous-commit>

# Restart previous version
docker-compose -f docker-compose.prod.yml up -d --build
```

## Support and Debugging

### Generate Diagnostic Info

```bash
# Collect all debugging information
{
  echo "=== Docker Version ==="
  docker --version
  echo -e "\n=== Docker Compose ==="
  docker-compose --version
  echo -e "\n=== Services Status ==="
  docker-compose -f docker-compose.prod.yml ps
  echo -e "\n=== Recent Logs ==="
  docker-compose -f docker-compose.prod.yml logs --tail=50
  echo -e "\n=== Environment ==="
  docker-compose -f docker-compose.prod.yml config
} > diagnostics.txt
```

### Report Issues

When reporting issues, include:
- `diagnostics.txt` output
- `.env.production` (without sensitive values)
- Docker logs
- Nginx access/error logs

## References

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose)
- [Nginx Documentation](https://nginx.org/en/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)

---

**Last Updated**: 2026-03-14
**Version**: 1.0
**Maintained By**: LogiTrans Development Team
