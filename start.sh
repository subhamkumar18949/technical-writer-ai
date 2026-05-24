#!/bin/bash
set -e

echo "==> Starting Ollama server..."
OLLAMA_HOST=0.0.0.0:11434 ollama serve &
OLLAMA_PID=$!

# Wait until Ollama is ready to accept requests
echo "==> Waiting for Ollama to be ready..."
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 1
done
echo "==> Ollama is up"

# Pull the base model (skipped automatically if already cached in the volume)
echo "==> Pulling llama3.1:8b (skipped if cached)..."
ollama pull llama3.1:8b

# Create all five custom models from Modelfiles
echo "==> Creating techwriter-docs..."
ollama create techwriter-docs -f /app/Modelfile.docs

echo "==> Creating techwriter-ux..."
ollama create techwriter-ux -f /app/Modelfile.ux

echo "==> Creating techwriter-web..."
ollama create techwriter-web -f /app/Modelfile.web

echo "==> Creating techwriter-blog..."
ollama create techwriter-blog -f /app/Modelfile.blog

echo "==> Creating techwriter-humanizer..."
ollama create techwriter-humanizer -f /app/Modelfile.humanizer

echo "==> All models ready. TechWriter AI is live."

# Keep Ollama running
wait $OLLAMA_PID
