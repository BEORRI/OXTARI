#!/bin/bash
set -e

# Start Ollama in the background
/bin/ollama serve &

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    sleep 2
done
echo "Ollama is ready!"

# Pull default models if they don't exist
DEFAULT_MODEL="${OLLAMA_MODEL:-llama3.2}"
DEFAULT_EMBED_MODEL="${OLLAMA_EMBED_MODEL:-nomic-embed-text}"

echo "Checking for model: ${DEFAULT_MODEL}"
if ! ollama list | grep -q "${DEFAULT_MODEL}"; then
    echo "Pulling ${DEFAULT_MODEL}..."
    ollama pull "${DEFAULT_MODEL}"
else
    echo "Model ${DEFAULT_MODEL} already exists"
fi

echo "Checking for embedding model: ${DEFAULT_EMBED_MODEL}"
if ! ollama list | grep -q "${DEFAULT_EMBED_MODEL}"; then
    echo "Pulling ${DEFAULT_EMBED_MODEL}..."
    ollama pull "${DEFAULT_EMBED_MODEL}"
else
    echo "Model ${DEFAULT_EMBED_MODEL} already exists"
fi

echo "All models ready!"

# Keep the container running
wait

