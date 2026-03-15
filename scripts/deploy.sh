#!/bin/bash

# ============================================================================
# LogiTrans Production Deployment Script
# ============================================================================
# This script automates the deployment of LogiTrans infrastructure with:
# - 2 NestJS API instances
# - Nginx load balancer with SSL/TLS
# - PostgreSQL database
# - Next.js frontend client

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# Pre-requisites Check
# ============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker found: $(docker --version)"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        # Try new docker compose subcommand
        if ! docker compose version &> /dev/null; then
            log_error "Docker Compose is not installed"
            exit 1
        fi
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    log_success "Docker Compose found"

    # Check OpenSSL for certificate generation
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is not installed - required for SSL certificates"
        exit 1
    fi
    log_success "OpenSSL found"

    echo ""
}

# ============================================================================
# SSL Certificate Setup
# ============================================================================

setup_ssl_certificates() {
    log_info "Setting up SSL certificates..."

    if [ ! -d "nginx/ssl" ]; then
        mkdir -p nginx/ssl
        log_success "Created nginx/ssl directory"
    fi

    # Run the certificate generation script
    if [ -f "nginx/ssl/generate-cert.sh" ]; then
        bash nginx/ssl/generate-cert.sh
    else
        log_error "Certificate generation script not found at nginx/ssl/generate-cert.sh"
        exit 1
    fi

    echo ""
}

# ============================================================================
# Environment Files Setup
# ============================================================================

setup_environment() {
    log_info "Setting up environment files..."

    if [ ! -f ".env.production" ]; then
        log_warning ".env.production not found, using defaults"
    else
        log_success "Using .env.production"
    fi

    # Load production environment
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '#' | xargs)
        log_success "Environment variables loaded from .env.production"
    fi

    echo ""
}

# ============================================================================
# Docker Compose Deployment
# ============================================================================

deploy_docker_compose() {
    log_info "Deploying LogiTrans infrastructure..."
    echo ""

    # Build and start services
    log_info "Building and starting services (this may take a few minutes)..."
    $COMPOSE_CMD -f docker-compose.prod.yml up -d --build

    if [ $? -ne 0 ]; then
        log_error "Docker Compose deployment failed"
        exit 1
    fi

    log_success "Services started successfully"
    echo ""
}

# ============================================================================
# Health Checks
# ============================================================================

wait_for_services() {
    log_info "Waiting for services to be ready..."

    local max_attempts=30
    local attempt=1

    # Wait for individual services
    declare -a services=("nginx" "api-1" "api-2" "client" "db")

    for service in "${services[@]}"; do
        log_info "Checking $service..."
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if $COMPOSE_CMD -f docker-compose.prod.yml exec -T "$service" true &> /dev/null; then
                log_success "$service is ready"
                break
            fi
            if [ $attempt -eq $max_attempts ]; then
                log_error "$service failed to start"
                return 1
            fi
            attempt=$((attempt + 1))
            sleep 2
        done
    done

    # Wait for database to be fully ready
    log_info "Waiting for database to be ready..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if $COMPOSE_CMD -f docker-compose.prod.yml exec -T db pg_isready -U postgres &> /dev/null; then
            log_success "Database is ready"
            break
        fi
        if [ $attempt -eq $max_attempts ]; then
            log_error "Database failed to become ready"
            return 1
        fi
        attempt=$((attempt + 1))
        sleep 2
    done

    echo ""
}

# ============================================================================
# Verify Deployment
# ============================================================================

verify_deployment() {
    log_info "Verifying deployment..."

    # Show service status
    log_info "Service status:"
    $COMPOSE_CMD -f docker-compose.prod.yml ps

    echo ""
}

# ============================================================================
# Display Information
# ============================================================================

display_info() {
    log_success "🎉 LogiTrans Deployment Complete!"
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║               LogiTrans Infrastructure Deployed               ║"
    echo "╠════════════════════════════════════════════════════════════════╣"
    echo "║                                                                ║"
    echo "║  📍 Access Points:                                              ║"
    echo "║     HTTP:  http://localhost:80                                 ║"
    echo "║     HTTPS: https://localhost:443                               ║"
    echo "║                                                                ║"
    echo "║  🔑 API Instances (Internal):                                  ║"
    echo "║     API 1: http://localhost:3001                               ║"
    echo "║     API 2: http://localhost:3002                               ║"
    echo "║                                                                ║"
    echo "║  🗄️  Database:                                                 ║"
    echo "║     Host: localhost:5432                                      ║"
    echo "║     User: $(printf '%-43s' "${DB_USERNAME:-postgres}") ║"
    echo "║                                                                ║"
    echo "║  ⚖️  Load Balancer:                                             ║"
    echo "║     Strategy: Least Connections                               ║"
    echo "║     Health Check: /health                                     ║"
    echo "║                                                                ║"
    echo "╠════════════════════════════════════════════════════════════════╣"
    echo "║  Useful Commands:                                               ║"
    echo "║                                                                ║"
    echo "║  View logs:                                                    ║"
    echo "║    $COMPOSE_CMD -f docker-compose.prod.yml logs -f            ║"
    echo "║                                                                ║"
    echo "║  Stop services:                                                ║"
    echo "║    $COMPOSE_CMD -f docker-compose.prod.yml down              ║"
    echo "║                                                                ║"
    echo "║  Scale API instances (if modified):                            ║"
    echo "║    $COMPOSE_CMD -f docker-compose.prod.yml up -d --scale api=3║"
    echo "║                                                                ║"
    echo "║  View service status:                                          ║"
    echo "║    $COMPOSE_CMD -f docker-compose.prod.yml ps                ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "⚠️  SSL Certificate Warning:"
    echo "   This deployment uses a self-signed certificate."
    echo "   Your browser will show a security warning - this is expected."
    echo ""
    echo "📖 For more information, see docs/DEPLOYMENT.md"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║          LogiTrans Production Deployment Script               ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    check_prerequisites
    setup_environment
    setup_ssl_certificates
    deploy_docker_compose
    wait_for_services
    verify_deployment
    display_info
}

# Run main function
main "$@"
