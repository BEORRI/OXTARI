import os
import requests
from wasabi import msg
import aiohttp
from urllib.parse import urljoin

from goldenoxtari.components.interfaces import Embedding
from goldenoxtari.components.types import InputConfig
from goldenoxtari.components.util import get_environment


class OllamaEmbedder(Embedding):

    def __init__(self):
        super().__init__()
        self.name = "Ollama"
        self.url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.description = f"Vectorizes documents and queries using Ollama. If your Ollama instance is not running on {self.url}, you can change the URL by setting the OLLAMA_URL environment variable."
        models = get_models(self.url)
        
        # Ollama is slower than API-based embedders, so use smaller batches
        self.max_batch_size = 16  # Reduced for Ollama's processing capacity

        self.config = {
            "Model": InputConfig(
                type="dropdown",
                value=os.getenv("OLLAMA_EMBED_MODEL") or models[0],
                description=f"Select a installed Ollama model from {self.url}. You can change the URL by setting the OLLAMA_URL environment variable. ",
                values=models,
            ),
        }

    async def vectorize(self, config: dict, content: list[str]) -> list[float]:
        """Vectorize content using Ollama with improved error handling"""
        try:
            model = config.get("Model").value
            
            # Validate model name
            if not model or "Couldn't connect" in model or "No Ollama Model" in model:
                raise Exception(f"Invalid Ollama model: {model}. Please ensure Ollama is running and has embedding models installed.")

            # Ensure model has the :latest tag if it's missing
            if not model.endswith(':latest') and ':' not in model:
                model = f"{model}:latest"
            
            data = {"model": model, "input": content}
            
            # Add timeout - Ollama can be slow for local processing
            # Set timeout based on batch size: ~20 seconds per item for safety
            timeout_seconds = max(300, len(content) * 20)  # Minimum 5 minutes, or 20s per item
            timeout = aiohttp.ClientTimeout(total=timeout_seconds)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                try:
                    # Debug logging
                    msg.info(f"Calling Ollama embedding API with model: {model}, content count: {len(content)}")
                    
                    async with session.post(urljoin(self.url, "/api/embed"), json=data) as response:
                        if response.status == 404:
                            raise Exception(f"Model '{model}' not found. Please ensure the model is installed in Ollama.")
                        elif response.status == 500:
                            error_text = await response.text()
                            raise Exception(f"Ollama server error: {error_text}")
                        
                        response.raise_for_status()
                        result_data = await response.json()
                        
                        embeddings = result_data.get("embeddings", [])
                        if not embeddings:
                            raise Exception("No embeddings returned from Ollama")
                        
                        # Validate embedding count
                        if len(embeddings) != len(content):
                            raise Exception(f"Embedding count mismatch: expected {len(content)}, got {len(embeddings)}")
                        
                        msg.good(f"Successfully generated {len(embeddings)} embeddings from Ollama")
                        return embeddings
                        
                except aiohttp.ClientError as e:
                    if "Connection refused" in str(e):
                        raise Exception(f"Cannot connect to Ollama at {self.url}. Please ensure Ollama is running.")
                    elif "timeout" in str(e).lower():
                        raise Exception(f"Ollama request timed out. Try reducing batch size or check if Ollama is responsive.")
                    else:
                        raise Exception(f"Ollama connection error: {str(e)}")
                        
        except Exception as e:
            error_msg = str(e)
            msg.fail(f"Ollama vectorization failed: {error_msg}")
            raise Exception(f"Ollama vectorization failed: {error_msg}")


def get_models(url: str):
    try:
        response = requests.get(urljoin(url, "/api/tags"))
        models = [model.get("name") for model in response.json().get("models")]
        if len(models) > 0:
            return models
        else:
            msg.info("No Ollama Model detected")
            return ["No Ollama Model detected"]
    except Exception as e:
        msg.info(f"Couldn't connect to Ollama {url}")
        return [f"Couldn't connect to Ollama {url}"]
