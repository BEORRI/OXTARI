#!/bin/bash

echo "=========================================="
echo "DEPLOYMENT READINESS CHECKLIST"
echo "=========================================="
echo ""

# Check 1: Docker services
echo "1️⃣  Docker Services Status"
echo "-----------------------------------"
if docker compose ps &>/dev/null; then
    docker compose ps --format "table {{.Service}}\t{{.Status}}" 2>/dev/null || docker compose ps
    echo ""
else
    echo "❌ Docker Compose not running"
    echo ""
fi

# Check 2: Environment variables in docker-compose.yml
echo "2️⃣  Environment Variables in docker-compose.yml"
echo "-----------------------------------"
if grep -q "WEAVIATE_URL_OXTARI" docker-compose.yml; then
    echo "✅ WEAVIATE_URL_OXTARI defined"
else
    echo "❌ WEAVIATE_URL_OXTARI missing"
fi

if grep -q "OLLAMA_URL" docker-compose.yml; then
    echo "✅ OLLAMA_URL defined"
else
    echo "❌ OLLAMA_URL missing"
fi

if grep -q "OLLAMA_MODEL" docker-compose.yml; then
    echo "✅ OLLAMA_MODEL defined"
else
    echo "❌ OLLAMA_MODEL missing"
fi

if grep -q "OLLAMA_EMBED_MODEL" docker-compose.yml; then
    echo "✅ OLLAMA_EMBED_MODEL defined"
else
    echo "❌ OLLAMA_EMBED_MODEL missing"
fi
echo ""

# Check 3: .env.example exists
echo "3️⃣  Environment Template (.env.example)"
echo "-----------------------------------"
if [ -f .env.example ]; then
    echo "✅ .env.example exists"
    echo "   Lines: $(wc -l < .env.example)"
else
    echo "❌ .env.example missing"
fi
echo ""

# Check 4: Dockerfile includes all dependencies
echo "4️⃣  Dockerfile Dependencies"
echo "-----------------------------------"
if [ -f Dockerfile ]; then
    echo "✅ Dockerfile exists"
    if grep -q "pip install -e" Dockerfile; then
        echo "✅ Python packages installed via pip"
    fi
    if grep -q "curl" Dockerfile; then
        echo "✅ curl installed (for health checks)"
    fi
else
    echo "❌ Dockerfile missing"
fi
echo ""

# Check 5: Entrypoint scripts
echo "5️⃣  Automated Setup Scripts"
echo "-----------------------------------"
if [ -f docker-entrypoint-ollama.sh ]; then
    echo "✅ Ollama entrypoint exists"
    if [ -x docker-entrypoint-ollama.sh ]; then
        echo "✅ Ollama entrypoint is executable"
    else
        echo "⚠️  Ollama entrypoint not executable"
    fi
else
    echo "❌ Ollama entrypoint missing"
fi

if [ -f start-docker.sh ]; then
    echo "✅ Start script exists"
    if [ -x start-docker.sh ]; then
        echo "✅ Start script is executable"
    else
        echo "⚠️  Start script not executable"
    fi
else
    echo "❌ Start script missing"
fi
echo ""

# Check 6: Health checks
echo "6️⃣  Health Check Configuration"
echo "-----------------------------------"
if grep -q "healthcheck:" docker-compose.yml; then
    echo "✅ Health checks configured"
    echo "   Weaviate: $(grep -A 5 'weaviate:' docker-compose.yml | grep -c 'healthcheck')"
    echo "   Ollama: $(grep -A 10 'ollama:' docker-compose.yml | grep -c 'healthcheck')"
    echo "   API: $(grep -A 10 'api:' docker-compose.yml | grep -c 'healthcheck')"
else
    echo "❌ No health checks found"
fi
echo ""

# Check 7: Service dependencies
echo "7️⃣  Service Dependencies"
echo "-----------------------------------"
if grep -q "depends_on:" docker-compose.yml; then
    echo "✅ Service dependencies configured"
    if grep -q "condition: service_healthy" docker-compose.yml; then
        echo "✅ Health-based dependencies"
    else
        echo "⚠️  No health-based dependencies"
    fi
else
    echo "❌ No service dependencies"
fi
echo ""

# Check 8: Test if services are accessible
echo "8️⃣  Service Accessibility"
echo "-----------------------------------"
if curl -s http://localhost:8080/v1/.well-known/ready &>/dev/null; then
    echo "✅ Weaviate accessible (port 8080)"
else
    echo "❌ Weaviate not accessible"
fi

if curl -s http://localhost:11434/api/tags &>/dev/null; then
    echo "✅ Ollama accessible (port 11434)"
else
    echo "❌ Ollama not accessible"
fi

if curl -s http://localhost:8000/api/health &>/dev/null; then
    echo "✅ API accessible (port 8000)"
else
    echo "❌ API not accessible"
fi
echo ""

# Check 9: Docker connection code
echo "9️⃣  Docker Connection Code"
echo "-----------------------------------"
if grep -q "async def connect_to_docker" goldenoxtari/components/managers.py; then
    echo "✅ connect_to_docker method exists"
    if grep -A 5 "async def connect_to_docker" goldenoxtari/components/managers.py | grep -q "port=8080"; then
        echo "✅ Port 8080 specified"
    else
        echo "⚠️  Port not specified"
    fi
else
    echo "❌ connect_to_docker method missing"
fi
echo ""

# Check 10: Documentation
echo "🔟 Documentation"
echo "-----------------------------------"
[ -f DOCKER_QUICKSTART.md ] && echo "✅ DOCKER_QUICKSTART.md" || echo "❌ DOCKER_QUICKSTART.md missing"
[ -f DOCKER_DEPLOY.md ] && echo "✅ DOCKER_DEPLOY.md" || echo "❌ DOCKER_DEPLOY.md missing"
[ -f DOCKER_ARCHITECTURE.md ] && echo "✅ DOCKER_ARCHITECTURE.md" || echo "❌ DOCKER_ARCHITECTURE.md missing"
echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
