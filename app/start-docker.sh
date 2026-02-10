#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Oxtari Docker Deployment Script    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed.${NC}"
        exit 1
    fi
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

echo -e "${GREEN}✓ Docker Compose is available${NC}"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
    else
        echo -e "${YELLOW}⚠ .env.example not found. Creating minimal .env...${NC}"
        cat > .env << EOF
# Weaviate Configuration
WEAVIATE_URL_OXTARI=http://weaviate:8080
WEAVIATE_API_KEY_OXTARI=

# Ollama Configuration
OLLAMA_URL=http://ollama:11434
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text

# Default Deployment Mode
DEFAULT_DEPLOYMENT=Docker
EOF
        echo -e "${GREEN}✓ Created minimal .env file${NC}"
    fi
fi

# Make entrypoint script executable
if [ -f docker-entrypoint-ollama.sh ]; then
    chmod +x docker-entrypoint-ollama.sh
    echo -e "${GREEN}✓ Entrypoint script is executable${NC}"
fi

echo ""
echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start services
$DOCKER_COMPOSE up -d

echo ""
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
echo -e "${YELLOW}This may take several minutes on first run (downloading models)...${NC}"
echo ""

# Function to check service health
check_health() {
    local service=$1
    local endpoint=$2
    local max_attempts=60
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$endpoint" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service is healthy${NC}"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            echo -e "${YELLOW}  Still waiting for $service... (${attempt}/${max_attempts})${NC}"
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $service failed to become healthy${NC}"
    return 1
}

# Wait for Weaviate
check_health "Weaviate" "http://localhost:8080/v1/.well-known/ready"

# Wait for Ollama
check_health "Ollama" "http://localhost:11434/api/tags"

# Show Ollama models
echo ""
echo -e "${BLUE}Installed Ollama models:${NC}"
docker exec ollama ollama list 2>/dev/null || echo -e "${YELLOW}Could not list models${NC}"

# Wait for API
check_health "API" "http://localhost:8000/api/health"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All services are running! 🎉        ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Access Oxtari at:${NC}      http://localhost:8000"
echo -e "${BLUE}Weaviate API at:${NC}       http://localhost:8080"
echo -e "${BLUE}Ollama API at:${NC}         http://localhost:11434"
echo ""
echo -e "${YELLOW}To view logs:${NC}          $DOCKER_COMPOSE logs -f"
echo -e "${YELLOW}To stop services:${NC}     $DOCKER_COMPOSE down"
echo -e "${YELLOW}To restart services:${NC}  $DOCKER_COMPOSE restart"
echo ""

