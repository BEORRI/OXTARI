#!/bin/bash
echo "Testing Docker deployment connection..."
curl -s -X POST http://localhost:8000/api/connect \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{"credentials": {"deployment": "Docker", "url": "", "key": ""}, "port": "8080"}' | python3 -m json.tool
