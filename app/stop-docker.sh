#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Stopping Oxtari Services           ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Docker Compose is available
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    exit 1
fi

# Show current status
echo -e "${BLUE}Current services:${NC}"
$DOCKER_COMPOSE ps
echo ""

# Ask if user wants to remove volumes
read -p "Do you want to remove data volumes (this will delete all data)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Stopping services and removing volumes...${NC}"
    $DOCKER_COMPOSE down -v
    echo -e "${GREEN}✓ Services stopped and volumes removed${NC}"
else
    echo -e "${YELLOW}Stopping services (keeping volumes)...${NC}"
    $DOCKER_COMPOSE down
    echo -e "${GREEN}✓ Services stopped (data preserved)${NC}"
fi

echo ""
echo -e "${GREEN}All services have been stopped.${NC}"
echo ""

