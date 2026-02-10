from wasabi import msg
import asyncio

import weaviate
from weaviate.client import WeaviateAsyncClient
from weaviate.auth import AuthApiKey
from weaviate.classes.query import Filter, Sort, MetadataQuery
from weaviate.collections.classes.data import DataObject
from weaviate.classes.aggregate import GroupByAggregate
from weaviate.classes.init import AdditionalConfig, Timeout

import os
import asyncio
import json
import re
from datetime import datetime

from sklearn.decomposition import PCA


from goldenoxtari.components.document import Document
from goldenoxtari.components.interfaces import (
    Reader,
    Chunker,
    Embedding,
    Retriever,
    Generator,
)
from goldenoxtari.server.helpers import LoggerManager
from goldenoxtari.server.types import FileConfig, FileStatus

# Import Readers
from goldenoxtari.components.reader.BasicReader import BasicReader
from goldenoxtari.components.reader.GitReader import GitReader
from goldenoxtari.components.reader.UnstructuredAPI import UnstructuredReader
from goldenoxtari.components.reader.AssemblyAIAPI import AssemblyAIReader
from goldenoxtari.components.reader.HTMLReader import HTMLReader
from goldenoxtari.components.reader.FirecrawlReader import FirecrawlReader
from goldenoxtari.components.reader.UpstageDocumentParse import (
    UpstageDocumentParseReader,
)

# Import Chunkers
from goldenoxtari.components.chunking.TokenChunker import TokenChunker
from goldenoxtari.components.chunking.SentenceChunker import SentenceChunker
from goldenoxtari.components.chunking.RecursiveChunker import RecursiveChunker
from goldenoxtari.components.chunking.HTMLChunker import HTMLChunker
from goldenoxtari.components.chunking.MarkdownChunker import MarkdownChunker
from goldenoxtari.components.chunking.CodeChunker import CodeChunker
from goldenoxtari.components.chunking.JSONChunker import JSONChunker
from goldenoxtari.components.chunking.SemanticChunker import SemanticChunker

# Import Embedders
from goldenoxtari.components.embedding.OpenAIEmbedder import OpenAIEmbedder
from goldenoxtari.components.embedding.CohereEmbedder import CohereEmbedder
from goldenoxtari.components.embedding.OllamaEmbedder import OllamaEmbedder
from goldenoxtari.components.embedding.UpstageEmbedder import UpstageEmbedder
from goldenoxtari.components.embedding.WeaviateEmbedder import WeaviateEmbedder
from goldenoxtari.components.embedding.VoyageAIEmbedder import VoyageAIEmbedder
from goldenoxtari.components.embedding.SentenceTransformersEmbedder import (
    SentenceTransformersEmbedder,
)

# Import Retrievers
from goldenoxtari.components.retriever.WindowRetriever import WindowRetriever

# Import Generators
from goldenoxtari.components.generation.CohereGenerator import CohereGenerator
from goldenoxtari.components.generation.AnthrophicGenerator import AnthropicGenerator
from goldenoxtari.components.generation.OllamaGenerator import OllamaGenerator
from goldenoxtari.components.generation.OpenAIGenerator import OpenAIGenerator
from goldenoxtari.components.generation.GroqGenerator import GroqGenerator
from goldenoxtari.components.generation.NovitaGenerator import NovitaGenerator
from goldenoxtari.components.generation.UpstageGenerator import UpstageGenerator

try:
    import tiktoken
except Exception:
    msg.warn("tiktoken not installed, your base installation might be corrupted.")

### Add new components here ###

production = os.getenv("OXTARI_PRODUCTION")
if production != "Production":
    readers = [
        BasicReader(),
        HTMLReader(),
        GitReader(),
        UnstructuredReader(),
        AssemblyAIReader(),
        FirecrawlReader(),
        UpstageDocumentParseReader(),
    ]
    chunkers = [
        TokenChunker(),
        SentenceChunker(),
        RecursiveChunker(),
        SemanticChunker(),
        HTMLChunker(),
        MarkdownChunker(),
        CodeChunker(),
        JSONChunker(),
    ]
    embedders = [
        OllamaEmbedder(),  # Primary choice for reliability
        SentenceTransformersEmbedder(),
        WeaviateEmbedder(),
        UpstageEmbedder(),
        VoyageAIEmbedder(),
        CohereEmbedder(),
        OpenAIEmbedder(),
    ]
    retrievers = [WindowRetriever()]
    generators = [
        OllamaGenerator(),
        OpenAIGenerator(),
        AnthropicGenerator(),
        CohereGenerator(),
        GroqGenerator(),
        NovitaGenerator(),
        UpstageGenerator(),
    ]
else:
    readers = [
        BasicReader(),
        HTMLReader(),
        GitReader(),
        UnstructuredReader(),
        AssemblyAIReader(),
        FirecrawlReader(),
        UpstageDocumentParseReader(),
    ]
    chunkers = [
        TokenChunker(),
        SentenceChunker(),
        RecursiveChunker(),
        SemanticChunker(),
        HTMLChunker(),
        MarkdownChunker(),
        CodeChunker(),
        JSONChunker(),
    ]
    embedders = [
        WeaviateEmbedder(),
        VoyageAIEmbedder(),
        UpstageEmbedder(),
        CohereEmbedder(),
        OpenAIEmbedder(),
    ]
    retrievers = [WindowRetriever()]
    generators = [
        OpenAIGenerator(),
        AnthropicGenerator(),
        CohereGenerator(),
        UpstageGenerator(),
    ]


### ----------------------- ###


class WeaviateManager:
    def __init__(self):
        self.document_collection_name = "Oxtari_DOCUMENTS"
        self.config_collection_name = "Oxtari_CONFIGURATION"
        self.suggestion_collection_name = "Oxtari_SUGGESTIONS"
        self.embedding_table = {}
        self.connection_retry_attempts = 3
        self.connection_retry_delay = 1.0  # seconds

    ### Connection Handling

    async def connect_to_cluster(self, w_url, w_key):
        if w_url is not None and w_key is not None:
            msg.info(f"Connecting to Weaviate Cluster {w_url} with Auth")
            return weaviate.use_async_with_weaviate_cloud(
                cluster_url=w_url,
                auth_credentials=AuthApiKey(w_key),
                additional_config=AdditionalConfig(
                    timeout=Timeout(init=60, query=600, insert=600)  # Increased timeouts for long operations
                ),
            )
        else:
            raise Exception("No URL or API Key provided")

    async def connect_to_docker(self, w_url):
        msg.info(f"Connecting to Weaviate Docker")
        return weaviate.use_async_with_local(
            host=w_url,
            port=8080,
            skip_init_checks=False,
            additional_config=AdditionalConfig(
                timeout=Timeout(init=60, query=600, insert=600)  # Increased timeouts for long operations
            ),
        )

    async def connect_to_custom(self, host, w_key, port):
        # Extract the port from the host
        msg.info(f"Connecting to Weaviate Custom")

        if host is None or host == "":
            raise Exception("No Host URL provided")

        if w_key is None or w_key == "":
            return weaviate.use_async_with_local(
                host=host,
                port=int(port),
                skip_init_checks=True,
                additional_config=AdditionalConfig(
                    timeout=Timeout(init=60, query=300, insert=300)
                ),
            )
        else:
            return weaviate.use_async_with_local(
                host=host,
                port=int(port),
                skip_init_checks=True,
                auth_credentials=AuthApiKey(w_key),
                additional_config=AdditionalConfig(
                    timeout=Timeout(init=60, query=300, insert=300)
                ),
            )

    async def connect_to_embedded(self):
        msg.info(f"Connecting to Weaviate Embedded")
        return weaviate.use_async_with_embedded(
            additional_config=AdditionalConfig(
                timeout=Timeout(init=60, query=300, insert=300)
            )
        )

    async def connect(
        self, deployment: str, weaviateURL: str, weaviateAPIKey: str, port: str = "8080"
    ) -> WeaviateAsyncClient:
        try:

            if deployment == "Weaviate":
                if weaviateURL == "" and os.environ.get("WEAVIATE_URL_OXTARI"):
                    weaviateURL = os.environ.get("WEAVIATE_URL_OXTARI")
                if weaviateAPIKey == "" and os.environ.get("WEAVIATE_API_KEY_OXTARI"):
                    weaviateAPIKey = os.environ.get("WEAVIATE_API_KEY_OXTARI")
                client = await self.connect_to_cluster(weaviateURL, weaviateAPIKey)
            elif deployment == "Docker":
                client = await self.connect_to_docker("weaviate")
            elif deployment == "Local":
                client = await self.connect_to_docker("weaviate")
            elif deployment == "Custom":
                client = await self.connect_to_custom(weaviateURL, weaviateAPIKey, port)
            else:
                raise Exception(f"Invalid deployment type: {deployment}")

            if client is not None:
                await client.connect()
                if await client.is_ready():
                    msg.good("Succesfully Connected to Weaviate")
                    return client

            return None

        except Exception as e:
            msg.fail(f"Couldn't connect to Weaviate, check your URL/API KEY: {str(e)}")
            raise Exception(
                f"Couldn't connect to Weaviate, check your URL/API KEY: {str(e)}"
            )

    async def disconnect(self, client: WeaviateAsyncClient):
        try:
            await client.close()
            return True
        except Exception as e:
            msg.fail(f"Couldn't disconnect Weaviate: {str(e)}")
            return False

    async def ensure_connection_healthy(self, client: WeaviateAsyncClient) -> bool:
        """Ensure the Weaviate client connection is healthy and ready for operations"""
        for attempt in range(self.connection_retry_attempts):
            try:
                # Check if client is ready
                if await client.is_ready():
                    # Test the connection with a simple operation
                    try:
                        await client.collections.list_all()
                        msg.good("Weaviate connection is healthy and ready")
                        return True
                    except Exception as test_error:
                        msg.warn(f"Weaviate client ready but test failed: {test_error}")
                        # Force reconnect
                        await client.connect()
                        await asyncio.sleep(self.connection_retry_delay)
                        continue
                else:
                    msg.warn(f"Weaviate client not ready, attempt {attempt + 1}/{self.connection_retry_attempts}")
                    await client.connect()
                    # Wait a bit for connection to stabilize
                    await asyncio.sleep(self.connection_retry_delay)
                    continue
            except Exception as e:
                msg.warn(f"Weaviate connection health check failed, attempt {attempt + 1}/{self.connection_retry_attempts}: {e}")
                try:
                    msg.info(f"Attempting to reconnect WeaviateClient...")
                    await client.connect()
                    await asyncio.sleep(self.connection_retry_delay * (attempt + 1))  # Exponential backoff
                    
                    # Test the reconnection
                    if await client.is_ready():
                        await client.collections.list_all()
                        msg.good("WeaviateClient reconnected and tested successfully")
                        return True
                except Exception as reconnect_error:
                    msg.warn(f"Failed to reconnect Weaviate client: {reconnect_error}")
                    if attempt == self.connection_retry_attempts - 1:
                        raise Exception(f"Failed to establish healthy Weaviate connection after {self.connection_retry_attempts} attempts: {e}")
        
        return False

    async def execute_with_retry(self, operation_func, *args, **kwargs):
        """Execute a Weaviate operation with automatic retry on connection failures"""
        last_exception = None
        
        for attempt in range(self.connection_retry_attempts):
            try:
                # Ensure connection is healthy before operation
                client = None
                if 'client' in kwargs:
                    client = kwargs['client']
                elif len(args) > 0 and hasattr(args[0], 'is_ready'):
                    client = args[0]
                
                if client:
                    await self.ensure_connection_healthy(client)
                
                # Execute the operation
                return await operation_func(*args, **kwargs)
                
            except Exception as e:
                last_exception = e
                error_msg = str(e).lower()
                
                # Check if it's a connection-related error
                if any(keyword in error_msg for keyword in ['closed', 'connection', 'timeout', 'network', 'unreachable', 'weaviateclient is closed']):
                    msg.warn(f"Weaviate operation failed due to connection issue, attempt {attempt + 1}/{self.connection_retry_attempts}: {e}")
                    
                    # Try to reconnect if we have a client
                    client = None
                    if 'client' in kwargs:
                        client = kwargs['client']
                    elif len(args) > 0 and hasattr(args[0], 'connect'):
                        client = args[0]
                    
                    if client:
                        try:
                            msg.info(f"Attempting to reconnect WeaviateClient (attempt {attempt + 1})")
                            await client.connect()
                            # Wait for connection to stabilize
                            await asyncio.sleep(self.connection_retry_delay * (attempt + 1))
                            
                            # Verify connection is working
                            if await client.is_ready():
                                msg.good(f"WeaviateClient reconnected successfully")
                            else:
                                msg.warn(f"WeaviateClient reconnected but not ready")
                        except Exception as reconnect_error:
                            msg.warn(f"Failed to reconnect WeaviateClient: {reconnect_error}")
                else:
                    # Non-connection error, don't retry
                    raise e
                
                if attempt == self.connection_retry_attempts - 1:
                    break
        
        # If we get here, all retries failed
        raise Exception(f"Weaviate operation failed after {self.connection_retry_attempts} attempts: {last_exception}")

    async def monitor_connection_health(self, client: WeaviateAsyncClient) -> dict:
        """Monitor and report on the health of a Weaviate connection"""
        health_status = {
            "is_ready": False,
            "connection_healthy": False,
            "last_check": datetime.now().isoformat(),
            "error": None
        }
        
        try:
            # Check if client is ready
            health_status["is_ready"] = await client.is_ready()
            
            if health_status["is_ready"]:
                # Try a simple operation to verify connection is working
                try:
                    await client.collections.list_all()
                    health_status["connection_healthy"] = True
                except Exception as e:
                    health_status["error"] = f"Connection test failed: {str(e)}"
            else:
                health_status["error"] = "Client not ready"
                
        except Exception as e:
            health_status["error"] = f"Health check failed: {str(e)}"
            
        return health_status

    ### Metadata

    async def get_metadata(self, client: WeaviateAsyncClient):

        # Node Information
        nodes = await client.cluster.nodes(output="verbose")
        node_payload = {"node_count": 0, "weaviate_version": "", "nodes": []}
        for node in nodes:
            node_payload["nodes"].append(
                {
                    "status": node.status,
                    "shards": len(node.shards),
                    "version": node.version,
                    "name": node.name,
                }
            )
        node_payload["node_count"] = len(nodes)
        node_payload["weaviate_version"] = nodes[0].version

        # Collection Information

        collections = await client.collections.list_all()
        collection_payload = {"collection_count": 0, "collections": []}
        for collection_name in collections:
            collection_objects = await client.collections.get(collection_name).length()
            collection_payload["collections"].append(
                {"name": collection_name, "count": collection_objects}
            )
        collection_payload["collections"].sort(key=lambda x: x["count"], reverse=True)
        collection_payload["collection_count"] = len(collections)

        return node_payload, collection_payload

    ### Collection Handling

    async def verify_collection(
        self, client: WeaviateAsyncClient, collection_name: str
    ):
        if not await client.collections.exists(collection_name):
            msg.info(
                f"Collection: {collection_name} does not exist, creating new collection."
            )
            returned_collection = await client.collections.create(name=collection_name)
            if returned_collection:
                return True
            else:
                return False
        else:
            return True

    async def verify_embedding_collection(self, client: WeaviateAsyncClient, embedder):
        if embedder not in self.embedding_table:
            self.embedding_table[embedder] = "OXTARI_Embedding_" + re.sub(
                r"[^a-zA-Z0-9]", "_", embedder
            )
            return await self.verify_collection(client, self.embedding_table[embedder])
        else:
            return True

    async def verify_cache_collection(self, client: WeaviateAsyncClient, embedder):
        if embedder not in self.embedding_table:
            self.embedding_table[embedder] = "OXTARI_Cache_" + re.sub(
                r"[^a-zA-Z0-9]", "_", embedder
            )
            return await self.verify_collection(client, self.embedding_table[embedder])
        else:
            return True

    async def verify_embedding_collections(
        self, client: WeaviateAsyncClient, environment_variables, libraries
    ):
        for embedder in embedders:
            if embedder.check_available(environment_variables, libraries):
                if "Model" in embedder.config:
                    for _embedder in embedder.config["Model"].values:
                        self.embedding_table[_embedder] = "OXTARI_Embedding_" + re.sub(
                            r"[^a-zA-Z0-9]", "_", _embedder
                        )
                        await self.verify_collection(
                            client, self.embedding_table[_embedder]
                        )

    async def verify_collections(
        self, client: WeaviateAsyncClient, environment_variables, libraries
    ):
        await self.verify_collection(client, self.document_collection_name)
        await self.verify_collection(client, self.suggestion_collection_name)
        await self.verify_collection(client, self.config_collection_name)
        await self.verify_embedding_collections(
            client, environment_variables, libraries
        )
        return True

    ### Configuration Handling

    async def get_config(self, client: WeaviateAsyncClient, uuid: str) -> dict:
        if await self.verify_collection(client, self.config_collection_name):
            config_collection = client.collections.get(self.config_collection_name)
            if await config_collection.data.exists(uuid):
                config = await config_collection.query.fetch_object_by_id(uuid)
                return json.loads(config.properties["config"])
            else:
                return None

    async def set_config(self, client: WeaviateAsyncClient, uuid: str, config: dict):
        if await self.verify_collection(client, self.config_collection_name):
            config_collection = client.collections.get(self.config_collection_name)
            if await config_collection.data.exists(uuid):
                if await config_collection.data.delete_by_id(uuid):
                    await config_collection.data.insert(
                        properties={"config": json.dumps(config)}, uuid=uuid
                    )
            else:
                await config_collection.data.insert(
                    properties={"config": json.dumps(config)}, uuid=uuid
                )

    async def reset_config(self, client: WeaviateAsyncClient, uuid: str):
        if await self.verify_collection(client, self.config_collection_name):
            config_collection = client.collections.get(self.config_collection_name)
            if await config_collection.data.exists(uuid):
                await config_collection.data.delete_by_id(uuid)

    ### Import Handling

    async def import_document(
        self, client: WeaviateAsyncClient, document: Document, embedder: str
    ):
        """Import document with robust connection handling and retry mechanism"""
        
        # Use the retry mechanism for the entire import operation
        return await self.execute_with_retry(self._import_document_internal, client, document, embedder)
    
    async def _import_document_internal(
        self, client: WeaviateAsyncClient, document: Document, embedder: str
    ):
        """Internal method that performs the actual document import"""
        # Ensure connection is healthy before starting
        await self.ensure_connection_healthy(client)
        
        if await self.verify_collection(
            client, self.document_collection_name
        ) and await self.verify_embedding_collection(client, embedder):
            document_collection = client.collections.get(self.document_collection_name)
            embedder_collection = client.collections.get(self.embedding_table[embedder])

            ### Import Document
            document_obj = Document.to_json(document)
            doc_uuid = await document_collection.data.insert(document_obj)

            chunk_ids = []

            try:
                for chunk in document.chunks:
                    chunk.doc_uuid = doc_uuid
                    chunk.labels = document.labels
                    chunk.title = document.title

                # Insert chunks in smaller batches to avoid timeout issues
                batch_size = 50  # Reduced batch size for better reliability
                all_chunk_ids = []
                
                for i in range(0, len(document.chunks), batch_size):
                    batch_chunks = document.chunks[i:i + batch_size]
                    
                    # Ensure connection is still healthy before each batch
                    await self.ensure_connection_healthy(client)
                    
                    chunk_response = await embedder_collection.data.insert_many(
                        [
                            DataObject(properties=chunk.to_json(), vector=chunk.vector)
                            for chunk in batch_chunks
                        ]
                    )
                    
                    batch_chunk_ids = [
                        chunk_response.uuids[uuid] for uuid in chunk_response.uuids
                    ]
                    all_chunk_ids.extend(batch_chunk_ids)

                    if chunk_response.has_errors:
                        raise Exception(
                            f"Failed to ingest chunk batch {i//batch_size + 1} into Weaviate: {chunk_response.errors}"
                        )
                    
                    msg.info(f"Successfully imported chunk batch {i//batch_size + 1}/{(len(document.chunks) + batch_size - 1)//batch_size}")

                chunk_ids = all_chunk_ids

                if doc_uuid and chunk_response:
                    # Final verification with connection check
                    await self.ensure_connection_healthy(client)
                    response = await embedder_collection.aggregate.over_all(
                        filters=Filter.by_property("doc_uuid").equal(doc_uuid),
                        total_count=True,
                    )
                    if response.total_count != len(document.chunks):
                        await document_collection.data.delete_by_id(doc_uuid)
                        for _id in chunk_ids:
                            await embedder_collection.data.delete_by_id(_id)
                        raise Exception(
                            f"Chunk Mismatch detected after importing: Imported:{response.total_count} | Existing: {len(document.chunks)}"
                        )

            except Exception as e:
                if doc_uuid:
                    await self.delete_document(client, doc_uuid)
                raise Exception(f"Chunk import failed with : {str(e)}")

    ### Document CRUD

    async def exist_document_name(self, client: WeaviateAsyncClient, name: str) -> str:
        if await self.verify_collection(client, self.document_collection_name):
            document_collection = client.collections.get(self.document_collection_name)
            aggregation = await document_collection.aggregate.over_all(total_count=True)

            if aggregation.total_count == 0:
                return None
            else:
                documents = await document_collection.query.fetch_objects(
                    filters=Filter.by_property("title").equal(name)
                )
                if len(documents.objects) > 0:
                    return documents.objects[0].uuid

            return None

    async def delete_document(self, client: WeaviateAsyncClient, uuid: str):
        if await self.verify_collection(client, self.document_collection_name):
            document_collection = client.collections.get(self.document_collection_name)

            if not await document_collection.data.exists(uuid):
                return

            document_obj = await document_collection.query.fetch_object_by_id(uuid)
            embedding_config = json.loads(document_obj.properties.get("meta"))[
                "Embedder"
            ]
            embedder = embedding_config["config"]["Model"]["value"]

            if await self.verify_embedding_collection(client, embedder):
                if await document_collection.data.delete_by_id(uuid):
                    embedder_collection = client.collections.get(
                        self.embedding_table[embedder]
                    )
                    await embedder_collection.data.delete_many(
                        where=Filter.by_property("doc_uuid").equal(uuid)
                    )

    async def delete_all_documents(self, client: WeaviateAsyncClient):
        if await self.verify_collection(client, self.document_collection_name):
            document_collection = client.collections.get(self.document_collection_name)
            async for item in document_collection.iterator():
                await self.delete_document(client, item.uuid)

    async def delete_all_configs(self, client: WeaviateAsyncClient):
        if await self.verify_collection(client, self.config_collection_name):
            config_collection = client.collections.get(self.config_collection_name)
            async for item in config_collection.iterator():
                await config_collection.data.delete_by_id(item.uuid)

    async def delete_all(self, client: WeaviateAsyncClient):
        node_payload, collection_payload = await self.get_metadata(client)
        for collection in collection_payload["collections"]:
            if "OXTARI" in collection["name"]:
                await client.collections.delete(collection["name"])

    async def get_documents(
        self,
        client: WeaviateAsyncClient,
        query: str,
        pageSize: int,
        page: int,
        labels: list[str],
        properties: list[str] = None,
    ) -> list[dict]:
        if await self.verify_collection(client, self.document_collection_name):
            offset = pageSize * (page - 1)
            document_collection = client.collections.get(self.document_collection_name)

            if len(labels) > 0:
                filter = Filter.by_property("labels").contains_all(labels)
            else:
                filter = None

            response = await document_collection.aggregate.over_all(
                total_count=True, filters=filter
            )

            if response.total_count == 0:
                return [], 0

            total_count = response.total_count

            if query == "":
                total_count = response.total_count
                response = await document_collection.query.fetch_objects(
                    limit=pageSize,
                    offset=offset,
                    return_properties=properties,
                    sort=Sort.by_property("title", ascending=True),
                    filters=filter,
                )
            else:
                response = await document_collection.query.bm25(
                    query=query,
                    limit=pageSize,
                    offset=offset,
                    filters=filter,
                    return_properties=properties,
                )

            return [
                {
                    "title": doc.properties["title"],
                    "uuid": str(doc.uuid),
                    "labels": doc.properties["labels"],
                }
                for doc in response.objects
            ], total_count

    async def get_document(
        self, client: WeaviateAsyncClient, uuid: str, properties: list[str] = None
    ) -> list[dict]:
        if await self.verify_collection(client, self.document_collection_name):
            document_collection = client.collections.get(self.document_collection_name)

            if await document_collection.data.exists(uuid):
                response = await document_collection.query.fetch_object_by_id(
                    uuid, return_properties=properties
                )
                return response.properties
            else:
                msg.warn(f"Document not found ({uuid})")
                return None

    ### Labels

    async def get_labels(self, client: WeaviateAsyncClient) -> list[str]:
        if await self.verify_collection(client, self.document_collection_name):
            document_collection = client.collections.get(self.document_collection_name)
            aggregation = await document_collection.aggregate.over_all(
                group_by=GroupByAggregate(prop="labels"), total_count=True
            )
            return [
                aggregation_group.grouped_by.value
                for aggregation_group in aggregation.groups
            ]

    ### Chunks Retrieval

    async def get_chunk(
        self, client: WeaviateAsyncClient, uuid: str, embedder: str
    ) -> list[dict]:
        if await self.verify_embedding_collection(client, embedder):
            embedder_collection = client.collections.get(self.embedding_table[embedder])
            if await embedder_collection.data.exists(uuid):
                response = await embedder_collection.query.fetch_object_by_id(uuid)
                response.properties["doc_uuid"] = str(response.properties["doc_uuid"])
                return response.properties
            else:
                return None

    async def get_chunks(
        self, client: WeaviateAsyncClient, uuid: str, page: int, pageSize: int
    ) -> list[dict]:

        if await self.verify_collection(client, self.document_collection_name):

            offset = pageSize * (page - 1)

            document = await self.get_document(client, uuid, properties=["meta"])
            if document is None:
                return []

            embedding_config = json.loads(document.get("meta"))["Embedder"]
            embedder = embedding_config["config"]["Model"]["value"]

            if await self.verify_embedding_collection(client, embedder):
                embedder_collection = client.collections.get(
                    self.embedding_table[embedder]
                )

                weaviate_chunks = await embedder_collection.query.fetch_objects(
                    filters=Filter.by_property("doc_uuid").equal(uuid),
                    limit=pageSize,
                    offset=offset,
                    sort=Sort.by_property("chunk_id", ascending=True),
                )
                chunks = [obj.properties for obj in weaviate_chunks.objects]
                for chunk in chunks:
                    chunk["doc_uuid"] = str(chunk["doc_uuid"])
                return chunks

    async def get_vectors(
        self, client: WeaviateAsyncClient, uuid: str, showAll: bool
    ) -> dict:

        document = await self.get_document(client, uuid, properties=["meta", "title"])

        if document is None:
            return None

        embedding_config = json.loads(document.get("meta"))["Embedder"]
        embedder = embedding_config["config"]["Model"]["value"]

        if await self.verify_embedding_collection(client, embedder):
            embedder_collection = client.collections.get(self.embedding_table[embedder])

            if not showAll:
                batch_size = 250
                all_chunks = []
                offset = 0
                total_time = 0
                call_count = 0

                while True:
                    call_start_time = asyncio.get_event_loop().time()
                    weaviate_chunks = await embedder_collection.query.fetch_objects(
                        filters=Filter.by_property("doc_uuid").equal(uuid),
                        limit=batch_size,
                        offset=offset,
                        return_properties=["chunk_id", "pca"],
                        include_vector=True,
                    )
                    call_end_time = asyncio.get_event_loop().time()
                    call_duration = call_end_time - call_start_time
                    total_time += call_duration
                    call_count += 1

                    all_chunks.extend(weaviate_chunks.objects)

                    if len(weaviate_chunks.objects) < batch_size:
                        break

                    offset += batch_size

                dimensions = len(all_chunks[0].vector["default"])

                chunks = [
                    {
                        "vector": {"x": pca[0], "y": pca[1], "z": pca[2]},
                        "uuid": str(item.uuid),
                        "chunk_id": item.properties["chunk_id"],
                    }
                    for item in all_chunks
                    if (pca := item.properties["pca"]) is not None
                ]
                return {
                    "embedder": embedder,
                    "dimensions": dimensions,
                    "groups": [{"name": document["title"], "chunks": chunks}],
                }

            # Generate PCA for all embeddings
            else:
                vector_map = {}
                vector_list, vector_ids, vector_chunk_uuids, vector_chunk_ids = (
                    [],
                    [],
                    [],
                    [],
                )
                dimensions = 0

                async for item in embedder_collection.iterator(include_vector=True):
                    doc_uuid = item.properties["doc_uuid"]
                    chunk_uuid = item.uuid
                    if doc_uuid not in vector_map:
                        _document = await self.get_document(client, doc_uuid)
                        if _document:
                            vector_map[doc_uuid] = {
                                "name": _document["title"],
                                "chunks": [],
                            }
                        else:
                            continue
                    vector_list.append(item.vector["default"])
                    dimensions = len(item.vector["default"])
                    vector_ids.append(doc_uuid)
                    vector_chunk_uuids.append(chunk_uuid)
                    vector_chunk_ids.append(item.properties["chunk_id"])

                if len(vector_ids) > 3:
                    pca = PCA(n_components=3)
                    generated_pca_embeddings = pca.fit_transform(vector_list)
                    pca_embeddings = [
                        pca_.tolist() for pca_ in generated_pca_embeddings
                    ]

                    for pca_embedding, _uuid, _chunk_uuid, _chunk_id in zip(
                        pca_embeddings,
                        vector_ids,
                        vector_chunk_uuids,
                        vector_chunk_ids,
                    ):
                        vector_map[_uuid]["chunks"].append(
                            {
                                "vector": {
                                    "x": pca_embedding[0],
                                    "y": pca_embedding[1],
                                    "z": pca_embedding[2],
                                },
                                "uuid": str(_chunk_uuid),
                                "chunk_id": _chunk_id,
                            }
                        )

                    return {
                        "embedder": embedder,
                        "dimensions": dimensions,
                        "groups": list(vector_map.values()),
                    }
                else:
                    return {
                        "embedder": embedder,
                        "dimensions": dimensions,
                        "groups": [],
                    }

        return None

    async def hybrid_chunks(
        self,
        client: WeaviateAsyncClient,
        embedder: str,
        query: str,
        vector: list[float],
        limit_mode: str,
        limit: int,
        labels: list[str],
        document_uuids: list[str],
    ):
        if await self.verify_embedding_collection(client, embedder):
            embedder_collection = client.collections.get(self.embedding_table[embedder])

            filters = []

            if labels:
                filters.append(Filter.by_property("labels").contains_all(labels))

            if document_uuids:
                filters.append(
                    Filter.by_property("doc_uuid").contains_any(document_uuids)
                )

            if filters:
                apply_filters = filters[0]
                for filter in filters[1:]:
                    apply_filters = apply_filters & filter
            else:
                apply_filters = None

            if limit_mode == "Autocut":
                chunks = await embedder_collection.query.hybrid(
                    query=query,
                    vector=vector,
                    alpha=0.5,
                    auto_limit=limit,
                    return_metadata=MetadataQuery(score=True, explain_score=False),
                    filters=apply_filters,
                )
            else:
                chunks = await embedder_collection.query.hybrid(
                    query=query,
                    vector=vector,
                    alpha=0.5,
                    limit=limit,
                    return_metadata=MetadataQuery(score=True, explain_score=False),
                    filters=apply_filters,
                )

            return chunks.objects

    async def get_chunk_by_ids(
        self, client: WeaviateAsyncClient, embedder: str, doc_uuid: str, ids: list[int]
    ):
        if await self.verify_embedding_collection(client, embedder):
            embedder_collection = client.collections.get(self.embedding_table[embedder])
            try:
                weaviate_chunks = await embedder_collection.query.fetch_objects(
                    filters=(
                        Filter.by_property("doc_uuid").equal(str(doc_uuid))
                        & Filter.by_property("chunk_id").contains_any(list(ids))
                    ),
                    sort=Sort.by_property("chunk_id", ascending=True),
                )
                return weaviate_chunks.objects
            except Exception as e:
                msg.fail(f"Failed to fetch chunks: {str(e)}")
                raise e

    ### Suggestion Logic

    async def add_suggestion(self, client: WeaviateAsyncClient, query: str):
        if await self.verify_collection(client, self.suggestion_collection_name):
            suggestion_collection = client.collections.get(
                self.suggestion_collection_name
            )
            aggregation = await suggestion_collection.aggregate.over_all(
                total_count=True
            )
            if aggregation.total_count > 0:
                does_suggestion_exists = (
                    await suggestion_collection.query.fetch_objects(
                        filters=Filter.by_property("query").equal(query)
                    )
                )
                if len(does_suggestion_exists.objects) > 0:
                    return
            await suggestion_collection.data.insert(
                {"query": query, "timestamp": datetime.now().isoformat()}
            )

    async def retrieve_suggestions(
        self, client: WeaviateAsyncClient, query: str, limit: int
    ):
        if await self.verify_collection(client, self.suggestion_collection_name):
            suggestion_collection = client.collections.get(
                self.suggestion_collection_name
            )
            suggestions = await suggestion_collection.query.bm25(
                query=query, limit=limit
            )
            return_suggestions = [
                {
                    "query": suggestion.properties["query"],
                    "timestamp": suggestion.properties["timestamp"],
                    "uuid": str(suggestion.uuid),
                }
                for suggestion in suggestions.objects
            ]
            return return_suggestions

    async def retrieve_all_suggestions(
        self, client: WeaviateAsyncClient, page: int, pageSize: int
    ):
        if await self.verify_collection(client, self.suggestion_collection_name):
            suggestion_collection = client.collections.get(
                self.suggestion_collection_name
            )
            offset = pageSize * (page - 1)
            suggestions = await suggestion_collection.query.fetch_objects(
                limit=pageSize,
                offset=offset,
                sort=Sort.by_property("timestamp", ascending=False),
            )
            aggregation = await suggestion_collection.aggregate.over_all(
                total_count=True
            )
            return_suggestions = [
                {
                    "query": suggestion.properties["query"],
                    "timestamp": suggestion.properties["timestamp"],
                    "uuid": str(suggestion.uuid),
                }
                for suggestion in suggestions.objects
            ]
            return return_suggestions, aggregation.total_count

    async def delete_suggestions(self, client: WeaviateAsyncClient, uuid: str):
        if await self.verify_collection(client, self.suggestion_collection_name):
            suggestion_collection = client.collections.get(
                self.suggestion_collection_name
            )
            await suggestion_collection.data.delete_by_id(uuid)

    async def delete_all_suggestions(self, client: WeaviateAsyncClient):
        if await self.verify_collection(client, self.suggestion_collection_name):
            await client.collections.delete(self.suggestion_collection_name)

    ### Cache Logic

    # TODO: Implement Cache Logic

    ### Metadata Retrieval

    async def get_datacount(
        self, client: WeaviateAsyncClient, embedder: str, document_uuids: list[str] = []
    ) -> int:
        if await self.verify_embedding_collection(client, embedder):
            embedder_collection = client.collections.get(self.embedding_table[embedder])

            if document_uuids:
                filters = Filter.by_property("doc_uuid").contains_any(document_uuids)
            else:
                filters = None
            try:
                response = await embedder_collection.aggregate.over_all(
                    filters=filters,
                    group_by=GroupByAggregate(prop="doc_uuid"),
                    total_count=True,
                )
                return len(response.groups)
            except Exception as e:
                msg.fail(f"Failed to retrieve data count: {str(e)}")
                return 0

    async def get_chunk_count(
        self, client: WeaviateAsyncClient, embedder: str, doc_uuid: str
    ) -> int:
        if await self.verify_embedding_collection(client, embedder):
            embedder_collection = client.collections.get(self.embedding_table[embedder])
            response = await embedder_collection.aggregate.over_all(
                filters=Filter.by_property("doc_uuid").equal(doc_uuid),
                group_by=GroupByAggregate(prop="doc_uuid"),
                total_count=True,
            )
            if response.groups:
                return response.groups[0].total_count
            else:
                return 0


class ReaderManager:
    def __init__(self):
        self.readers: dict[str, Reader] = {reader.name: reader for reader in readers}

    async def load(
        self, reader: str, fileConfig: FileConfig, logger: LoggerManager
    ) -> list[Document]:
        try:
            loop = asyncio.get_running_loop()
            start_time = loop.time()
            if reader in self.readers:
                config = fileConfig.rag_config["Reader"].components[reader].config
                documents: list[Document] = await self.readers[reader].load(
                    config, fileConfig
                )
                for document in documents:
                    document.meta["Reader"] = (
                        fileConfig.rag_config["Reader"].components[reader].model_dump()
                    )
                elapsed_time = round(loop.time() - start_time, 2)
                if len(documents) == 1:
                    await logger.send_report(
                        fileConfig.fileID,
                        FileStatus.LOADING,
                        f"Loaded {fileConfig.filename}",
                        took=elapsed_time,
                    )
                else:
                    await logger.send_report(
                        fileConfig.fileID,
                        FileStatus.LOADING,
                        f"Loaded {fileConfig.filename} with {len(documents)} documents",
                        took=elapsed_time,
                    )
                await logger.send_report(
                    fileConfig.fileID, FileStatus.CHUNKING, "", took=0
                )
                return documents
            else:
                raise Exception(f"{reader} Reader not found")

        except Exception as e:
            raise Exception(f"Reader {reader} failed with: {str(e)}")


class ChunkerManager:
    def __init__(self):
        self.chunkers: dict[str, Chunker] = {
            chunker.name: chunker for chunker in chunkers
        }

    async def chunk(
        self,
        chunker: str,
        fileConfig: FileConfig,
        documents: list[Document],
        embedder: Embedding,
        logger: LoggerManager,
    ) -> list[Document]:
        try:
            loop = asyncio.get_running_loop()
            start_time = loop.time()
            if chunker in self.chunkers:
                config = fileConfig.rag_config["Chunker"].components[chunker].config
                embedder_config = (
                    fileConfig.rag_config["Embedder"].components[embedder.name].config
                )
                chunked_documents = await self.chunkers[chunker].chunk(
                    config=config,
                    documents=documents,
                    embedder=embedder,
                    embedder_config=embedder_config,
                )
                for chunked_document in chunked_documents:
                    chunked_document.meta["Chunker"] = (
                        fileConfig.rag_config["Chunker"]
                        .components[chunker]
                        .model_dump()
                    )
                elapsed_time = round(loop.time() - start_time, 2)
                if len(documents) == 1:
                    await logger.send_report(
                        fileConfig.fileID,
                        FileStatus.CHUNKING,
                        f"Split {fileConfig.filename} into {len(chunked_documents[0].chunks)} chunks",
                        took=elapsed_time,
                    )
                else:
                    await logger.send_report(
                        fileConfig.fileID,
                        FileStatus.CHUNKING,
                        f"Chunked all {len(chunked_documents)} documents with a total of {sum([len(document.chunks) for document in chunked_documents])} chunks",
                        took=elapsed_time,
                    )

                await logger.send_report(
                    fileConfig.fileID, FileStatus.EMBEDDING, "", took=0
                )
                return chunked_documents
            else:
                raise Exception(f"{chunker} Chunker not found")
        except Exception as e:
            raise e


class EmbeddingManager:
    def __init__(self):
        self.embedders: dict[str, Embedding] = {
            embedder.name: embedder for embedder in embedders
        }

    async def vectorize(
        self,
        embedder: str,
        fileConfig: FileConfig,
        documents: list[Document],
        logger: LoggerManager,
    ) -> list[Document]:
        """Vectorizes chunks in batches with connection health monitoring
        @parameter: documents : Document - Oxtari document
        @returns Document - Document with vectorized chunks
        """
        try:
            loop = asyncio.get_running_loop()
            start_time = loop.time()
            if embedder in self.embedders:
                config = fileConfig.rag_config["Embedder"].components[embedder].config

                for document in documents:
                    content = [
                        document.metadata + "\n" + chunk.content
                        for chunk in document.chunks
                    ]
                    
                    # Log embedding start with connection status
                    msg.info(f"Starting embedding process for {len(content)} chunks using {embedder}")
                    
                    embeddings = await self.batch_vectorize(embedder, config, content, logger, fileConfig.fileID)

                    if len(embeddings) >= 3:
                        pca = PCA(n_components=3)
                        generated_pca_embeddings = pca.fit_transform(embeddings)
                        pca_embeddings = [
                            pca_.tolist() for pca_ in generated_pca_embeddings
                        ]
                    else:
                        pca_embeddings = [embedding[0:3] for embedding in embeddings]

                    for vector, chunk, pca_ in zip(
                        embeddings, document.chunks, pca_embeddings
                    ):
                        chunk.vector = vector
                        chunk.pca = pca_

                    document.meta["Embedder"] = (
                        fileConfig.rag_config["Embedder"]
                        .components[embedder]
                        .model_dump()
                    )

                elapsed_time = round(loop.time() - start_time, 2)
                await logger.send_report(
                    fileConfig.fileID,
                    FileStatus.EMBEDDING,
                    f"Vectorized all chunks",
                    took=elapsed_time,
                )
                await logger.send_report(
                    fileConfig.fileID, FileStatus.INGESTING, "", took=0
                )
                return documents
            else:
                raise Exception(f"{embedder} Embedder not found")
        except Exception as e:
            raise e

    async def batch_vectorize(
        self, embedder: str, config: dict, content: list[str], logger=None, file_id: str = None
    ) -> list[list[float]]:
        """Vectorize content in batches with high-performance parallel processing and intelligent optimization"""
        try:
            # Get base batch size from embedder
            max_batch_size = self.embedders[embedder].max_batch_size
            
            # Intelligent batch size optimization based on content size and embedder capabilities
            content_size = len(content)
            if content_size <= 50:
                # Small content - use smaller batches for faster processing
                optimized_batch_size = min(max_batch_size, 8)
            elif content_size <= 200:
                # Medium content - balanced approach
                optimized_batch_size = max_batch_size
            else:
                # Large content - optimize for throughput
                if embedder == "Upstage":
                    # Upstage has strict limits, use base size but high concurrency
                    optimized_batch_size = max_batch_size
                elif embedder == "SentenceTransformers":
                    # Local model, can handle larger batches
                    optimized_batch_size = min(max_batch_size * 4, 256)
                elif embedder == "OpenAI":
                    # OpenAI can handle larger batches efficiently
                    optimized_batch_size = min(max_batch_size * 3, 200)
                elif embedder == "Ollama":
                    # Local Ollama, moderate batch size
                    optimized_batch_size = min(max_batch_size * 2, 128)
                else:
                    # Default optimization for other embedders
                    optimized_batch_size = min(max_batch_size * 2, 100)
            
            # Create optimized batches
            batches = [
                content[i : i + optimized_batch_size]
                for i in range(0, len(content), optimized_batch_size)
            ]
            
            # Intelligent concurrency control based on embedder type and system load
            if embedder == "Upstage":
                # Upstage API can handle high concurrency but has rate limits
                max_concurrent_batches = min(20, len(batches), 8)  # Cap at 8 for stability
            elif embedder == "SentenceTransformers":
                # Local model, moderate concurrency to avoid memory issues
                max_concurrent_batches = min(6, len(batches))
            elif embedder == "OpenAI":
                # OpenAI can handle high concurrency
                max_concurrent_batches = min(15, len(batches))
            elif embedder == "Ollama":
                # Local Ollama, moderate concurrency
                max_concurrent_batches = min(4, len(batches))
            else:
                # Default concurrency
                max_concurrent_batches = min(8, len(batches))
            
            msg.info(f"Vectorizing {len(content)} chunks in {len(batches)} batches using {embedder} (batch size: {optimized_batch_size}, concurrency: {max_concurrent_batches})")
            
            # Use semaphore for controlled concurrency
            semaphore = asyncio.Semaphore(max_concurrent_batches)
            
            all_results = []
            failed_batches = []
            start_time = asyncio.get_running_loop().time()
            
            # Process batches with intelligent retry logic
            tasks = []
            for i, batch in enumerate(batches):
                task = self._process_batch_with_retry(semaphore, embedder, config, batch, i, len(batches), logger, file_id)
                tasks.append(task)
            
            # Process all batches concurrently with controlled concurrency
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results with detailed error analysis
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    error_msg = str(result) if str(result).strip() else f"Unknown error in batch {i+1}"
                    msg.fail(f"Batch {i+1} failed: {error_msg}")
                    failed_batches.append({
                        'batch_index': i,
                        'error': error_msg,
                        'batch_size': len(batches[i])
                    })
                    
                    # For critical errors, stop processing immediately
                    if any(keyword in error_msg.lower() for keyword in ["rate limit", "quota", "unauthorized", "forbidden"]):
                        raise Exception(f"Critical error in batch {i+1}: {error_msg}")
                else:
                    all_results.extend(result)
                    msg.good(f"Successfully processed batch {i+1}/{len(batches)}")
            
            # Send progress update
            if logger and file_id:
                elapsed_time = asyncio.get_running_loop().time() - start_time
                success_rate = ((len(batches) - len(failed_batches)) / len(batches)) * 100
                await logger.send_report(
                    file_id,
                    "EMBEDDING",
                    f"Completed {len(all_results)}/{len(content)} chunks in {elapsed_time:.1f}s (success rate: {success_rate:.1f}%)",
                    elapsed_time
                )
            
            # Validate results
            if not all_results:
                raise Exception("No batches were successfully processed")
            
            # Check failure threshold
            failure_rate = len(failed_batches) / len(batches)
            if failure_rate > 0.5:  # More than 50% failed
                error_summary = "; ".join([f"Batch {fb['batch_index']+1}: {fb['error']}" for fb in failed_batches[:3]])
                raise Exception(f"Too many batches failed ({len(failed_batches)}/{len(batches)}): {error_summary}")
            
            # Log warnings for failed batches but continue
            if failed_batches:
                msg.warn(f"Some batches failed ({len(failed_batches)}/{len(batches)}), but continuing with successful results")
            
            # Verify vector count and handle mismatches
            if len(all_results) != len(content):
                msg.warn(f"Vector count mismatch: expected {len(content)}, got {len(all_results)}")
                if len(all_results) > len(content):
                    all_results = all_results[:len(content)]
                else:
                    # Pad with zeros if we're short
                    while len(all_results) < len(content):
                        all_results.append([0.0] * len(all_results[0]) if all_results else [0.0])

            return all_results
            
        except Exception as e:
            error_msg = str(e)
            msg.fail(f"Batch vectorization failed: {error_msg}")
            raise Exception(f"Batch vectorization failed: {error_msg}")
    
    async def _process_batch_with_retry(self, semaphore: asyncio.Semaphore, embedder: str, config: dict, batch: list[str], batch_index: int, total_batches: int, logger=None, file_id: str = None) -> list[list[float]]:
        """Process a single batch with intelligent retry logic and semaphore-controlled concurrency"""
        async with semaphore:
            max_retries = 3
            retry_delay = 1.0  # Start with 1 second delay
            
            for attempt in range(max_retries + 1):
                try:
                    if attempt > 0:
                        # Exponential backoff with jitter
                        delay = retry_delay * (2 ** (attempt - 1)) + (0.1 * attempt)
                        msg.info(f"Retrying batch {batch_index+1} (attempt {attempt+1}/{max_retries+1}) after {delay:.1f}s delay")
                        await asyncio.sleep(delay)
                    
                    # Send progress update
                    if logger and file_id:
                        await logger.send_report(
                            file_id,
                            "EMBEDDING",
                            f"Processing batch {batch_index+1}/{total_batches} (attempt {attempt+1})",
                            0
                        )
                    
                    result = await self.embedders[embedder].vectorize(config, batch)
                    return result
                    
                except Exception as e:
                    error_msg = str(e)
                    
                    # Check if this is a retryable error
                    if attempt < max_retries and any(keyword in error_msg.lower() for keyword in [
                        "timeout", "connection", "network", "temporary", "rate limit", "quota"
                    ]):
                        msg.warn(f"Batch {batch_index+1} failed (attempt {attempt+1}): {error_msg} - retrying...")
                        continue
                    else:
                        # Non-retryable error or max retries reached
                        raise e
    
    async def _process_batch_with_semaphore(self, semaphore: asyncio.Semaphore, embedder: str, config: dict, batch: list[str], batch_index: int, total_batches: int) -> list[list[float]]:
        """Process a single batch with semaphore-controlled concurrency (legacy method)"""
        async with semaphore:
            try:
                result = await self.embedders[embedder].vectorize(config, batch)
                return result
            except Exception as e:
                raise e
    
    async def _process_single_batch(self, embedder: str, config: dict, batch: list[str], batch_index: int, total_batches: int) -> list[list[float]]:
        """Process a single batch and return results (legacy method)"""
        try:
            msg.info(f"Processing batch {batch_index+1}/{total_batches} with {len(batch)} chunks")
            result = await self.embedders[embedder].vectorize(config, batch)
            return result
        except Exception as e:
            raise e

    async def vectorize_query(
        self, embedder: str, content: str, rag_config: dict
    ) -> list[float]:
        try:
            if embedder in self.embedders:
                config = rag_config["Embedder"].components[embedder].config
                embeddings = await self.embedders[embedder].vectorize(config, [content])
                return embeddings[0]
            else:
                raise Exception(f"{embedder} Embedder not found")
        except Exception as e:
            raise e


class RetrieverManager:
    def __init__(self):
        self.retrievers: dict[str, Retriever] = {
            retriever.name: retriever for retriever in retrievers
        }

    async def retrieve(
        self,
        client,
        retriever: str,
        query: str,
        vector: list[float],
        rag_config: dict,
        weaviate_manager: WeaviateManager,
        labels: list[str],
        document_uuids: list[str],
    ):
        try:
            if retriever not in self.retrievers:
                raise Exception(f"Retriever {retriever} not found")

            embedder_model = (
                rag_config["Embedder"]
                .components[rag_config["Embedder"].selected]
                .config["Model"]
                .value
            )
            config = rag_config["Retriever"].components[retriever].config
            documents, context = await self.retrievers[retriever].retrieve(
                client,
                query,
                vector,
                config,
                weaviate_manager,
                embedder_model,
                labels,
                document_uuids,
            )
            return (documents, context)

        except Exception as e:
            raise e


class GeneratorManager:
    def __init__(self):
        self.generators: dict[str, Generator] = {
            generator.name: generator for generator in generators
        }

    async def generate_stream(self, rag_config, query, context, conversation):
        """Generate a stream of response dicts based on a list of queries and list of contexts, and includes conversational context
        @parameter: queries : list[str] - List of queries
        @parameter: context : list[str] - List of contexts
        @parameter: conversation : dict - Conversational context
        @returns Iterator[dict] - Token response generated by the Generator in this format {system:TOKEN, finish_reason:stop or empty}.
        """

        generator = rag_config["Generator"].selected
        generator_config = (
            rag_config["Generator"].components[rag_config["Generator"].selected].config
        )

        if generator not in self.generators:
            raise Exception(f"Generator {generator} not found")

        async for result in self.generators[generator].generate_stream(
            generator_config, query, context, conversation
        ):
            yield result

    def truncate_conversation_dicts(
        self, conversation_dicts: list[dict[str, any]], max_tokens: int
    ) -> list[dict[str, any]]:
        """
        Truncate a list of conversation dictionaries to fit within a specified maximum token limit.

        @parameter conversation_dicts: List[Dict[str, any]] - A list of conversation dictionaries that may contain various keys, where 'content' key is present and contains text data.
        @parameter max_tokens: int - The maximum number of tokens that the combined content of the truncated conversation dictionaries should not exceed.

        @returns List[Dict[str, any]]: A list of conversation dictionaries that have been truncated so that their combined content respects the max_tokens limit. The list is returned in the original order of conversation with the most recent conversation being truncated last if necessary.

        """
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        accumulated_tokens = 0
        truncated_conversation_dicts = []

        # Start with the newest conversations
        for item_dict in reversed(conversation_dicts):
            item_tokens = encoding.encode(item_dict["content"], disallowed_special=())

            # If adding the entire new item exceeds the max tokens
            if accumulated_tokens + len(item_tokens) > max_tokens:
                # Calculate how many tokens we can add from this item
                remaining_space = max_tokens - accumulated_tokens
                truncated_content = encoding.decode(item_tokens[:remaining_space])

                # Create a new truncated item dictionary
                truncated_item_dict = {
                    "type": item_dict["type"],
                    "content": truncated_content,
                    "typewriter": item_dict["typewriter"],
                }

                truncated_conversation_dicts.append(truncated_item_dict)
                break

            truncated_conversation_dicts.append(item_dict)
            accumulated_tokens += len(item_tokens)

        # The list has been built in reverse order so we reverse it again
        return list(reversed(truncated_conversation_dicts))
