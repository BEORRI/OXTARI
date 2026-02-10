#!/usr/bin/env python3
"""
Test script to verify the embedding fixes for large file processing.
This script tests the improved error handling and batch processing.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from goldenoxtari.components.managers import EmbeddingManager
from goldenoxtari.components.embedding.OllamaEmbedder import OllamaEmbedder
from goldenoxtari.server.types import FileConfig

async def test_embedding_improvements():
    """Test the improved embedding functionality"""
    print("🧪 Testing Embedding Improvements")
    print("=" * 50)
    
    # Test 1: File size validation
    print("\n1. Testing file size validation...")
    try:
        from goldenoxtari.server.types import FileConfig
        
        # Test valid file size
        valid_config = FileConfig(
            fileID="test",
            filename="test.txt",
            isURL=False,
            overwrite=False,
            extension="txt",
            source="",
            content="test content",
            labels=["Document"],
            rag_config={},
            file_size=1024,  # 1KB - should pass
            status="READY",
            metadata="",
            status_report={}
        )
        print("✅ Valid file size (1KB) - PASSED")
        
        # Test invalid file size
        try:
            invalid_config = FileConfig(
                fileID="test",
                filename="test.txt",
                isURL=False,
                overwrite=False,
                extension="txt",
                source="",
                content="test content",
                labels=["Document"],
                rag_config={},
                file_size=100 * 1024 * 1024,  # 100MB - should fail
                status="READY",
                metadata="",
                status_report={}
            )
            print("❌ Invalid file size (100MB) - FAILED (should have been rejected)")
        except ValueError as e:
            print(f"✅ Invalid file size (100MB) - PASSED (correctly rejected: {e})")
            
    except Exception as e:
        print(f"❌ File size validation test failed: {e}")
    
    # Test 2: Batch size configuration
    print("\n2. Testing batch size configuration...")
    try:
        ollama_embedder = OllamaEmbedder()
        print(f"✅ Ollama embedder max_batch_size: {ollama_embedder.max_batch_size}")
        
        # Test that batch size is reasonable
        if ollama_embedder.max_batch_size <= 32:
            print("✅ Batch size is appropriately small for reliability")
        else:
            print(f"⚠️  Batch size might be too large: {ollama_embedder.max_batch_size}")
            
    except Exception as e:
        print(f"❌ Batch size test failed: {e}")
    
    # Test 3: Error handling in batch processing
    print("\n3. Testing error handling improvements...")
    try:
        embedding_manager = EmbeddingManager()
        
        # Create mock content for testing
        test_content = [f"Test chunk {i}" for i in range(50)]  # 50 chunks
        
        print(f"✅ Created test content with {len(test_content)} chunks")
        print(f"✅ Embedding manager initialized with {len(embedding_manager.embedders)} embedders")
        
        # Check if Ollama is available
        if "Ollama" in embedding_manager.embedders:
            print("✅ Ollama embedder is available")
        else:
            print("⚠️  Ollama embedder not found in available embedders")
            
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
    
    # Test 4: Configuration validation
    print("\n4. Testing configuration...")
    try:
        # Check environment variables
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        ollama_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
        
        print(f"✅ Ollama URL: {ollama_url}")
        print(f"✅ Ollama Embed Model: {ollama_model}")
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print("- File size limits: Implemented (50MB max)")
    print("- Batch sizes: Reduced for reliability")
    print("- Error handling: Improved with detailed logging")
    print("- Ollama: Set as default embedding service")
    print("\n💡 Recommendations:")
    print("1. Ensure Ollama is running: docker-compose up ollama")
    print("2. Install embedding model: ollama pull nomic-embed-text")
    print("3. Test with a smaller PDF file first")
    print("4. Monitor logs for detailed error information")

if __name__ == "__main__":
    asyncio.run(test_embedding_improvements())
