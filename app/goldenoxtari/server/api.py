from fastapi import FastAPI, WebSocket, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import asyncio

from goldenoxtari.server.helpers import LoggerManager, BatchManager
from goldenoxtari.server.error_handler import (
    APIError, ErrorCodes, handle_api_exception, handle_http_exception, 
    handle_generic_exception, handle_websocket_error, validate_required_fields,
    validate_api_key, sanitize_error_message
)
from weaviate.client import WeaviateAsyncClient

import os
from pathlib import Path

from dotenv import load_dotenv
from starlette.websockets import WebSocketDisconnect
from wasabi import msg  # type: ignore[import]
from goldenoxtari.server.secure_logger import SecureLogger, setup_secure_logging

from goldenoxtari import oxtari_manager

from goldenoxtari.server.types import (
    ResetPayload,
    QueryPayload,
    GeneratePayload,
    Credentials,
    GetDocumentPayload,
    ConnectPayload,
    DatacountPayload,
    GetSuggestionsPayload,
    GetAllSuggestionsPayload,
    DeleteSuggestionPayload,
    GetContentPayload,
    SetThemeConfigPayload,
    SetUserConfigPayload,
    SearchQueryPayload,
    SetRAGConfigPayload,
    GetChunkPayload,
    GetVectorPayload,
    DataBatchPayload,
    ChunksPayload,
)

load_dotenv()

# Check if runs in production
production_key = os.environ.get("OXTARI_PRODUCTION")
tag = os.environ.get("OXTARI_GOOGLE_TAG", "")


if production_key:
    SecureLogger.info(f"Oxtari runs in {production_key} mode")
    production = production_key
else:
    production = "Local"

manager = oxtari_manager.OxtariManager()

client_manager = oxtari_manager.ClientManager()

### Lifespan


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Set up secure logging
    setup_secure_logging()
    SecureLogger.info("Starting Oxtari server with secure logging enabled")
    yield
    SecureLogger.info("Shutting down Oxtari server")
    await client_manager.disconnect()


# FastAPI App
app = FastAPI(lifespan=lifespan)

# Global exception handlers
@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return handle_api_exception(exc)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return handle_http_exception(exc)

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return handle_generic_exception(exc, request)

# Configure CORS based on environment
allowed_origins = []
if production == "Local" or production == "Demo":
    # Development/Demo: Allow localhost and common development ports
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
else:
    # Production: Only allow specific origins
    allowed_origins = [
        "https://oxtari.vercel.app",
        "https://oxtari.weaviate.io"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Custom middleware for additional security checks
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # Allow public access to health check
    if request.url.path == "/api/health":
        return await call_next(request)

    # Security headers
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Only add HSTS in production
    if production != "Local":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response


BASE_DIR = Path(__file__).resolve().parent

# Serve the assets (JS, CSS, images, etc.)
app.mount(
    "/static/_next",
    StaticFiles(directory=BASE_DIR / "frontend/out/_next"),
    name="next-assets",
)

# Serve the main page and other static files
app.mount("/static", StaticFiles(directory=BASE_DIR / "frontend/out"), name="app")


@app.get("/")
@app.head("/")
async def serve_frontend():
    return FileResponse(os.path.join(BASE_DIR, "frontend/out/index.html"))


# Serve specific images from root path for compatibility
@app.get("/new-logo.png")
async def serve_new_logo():
    file_path = os.path.join(BASE_DIR, "frontend/out/new-logo.png")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/OXTARI.jpg")
async def serve_oxtari_jpg():
    file_path = os.path.join(BASE_DIR, "frontend/out/OXTARI.jpg")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/Oxtari.png")
async def serve_oxtari_png():
    file_path = os.path.join(BASE_DIR, "frontend/out/Oxtari.png")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/OXTARI2.png")
async def serve_oxtari2_png():
    file_path = os.path.join(BASE_DIR, "frontend/out/OXTARI2.png")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

# Catch-all route for other image files in public directory
@app.get("/{filename:path}.{extension:(png|jpg|jpeg|svg|ico|gif|webp)}")
async def serve_public_images(filename: str, extension: str):
    """Serve image files from the public directory"""
    file_path = os.path.join(BASE_DIR, f"frontend/out/{filename}.{extension}")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")


### INITIAL ENDPOINTS


# Define health check endpoint
@app.get("/api/health")
async def health_check():

    await client_manager.clean_up()

    if production == "Local":
        deployments = await manager.get_deployments()
    else:
        deployments = {"WEAVIATE_URL_OXTARI": "", "WEAVIATE_API_KEY_OXTARI": ""}

    return JSONResponse(
        content={
            "message": "Alive!",
            "production": production,
            "gtag": tag,
            "deployments": deployments,
            "default_deployment": os.getenv("DEFAULT_DEPLOYMENT", ""),
        }
    )


@app.post("/api/connect")
async def connect_to_oxtari(payload: ConnectPayload):
    try:
        client = await client_manager.connect(payload.credentials, payload.port)
        if isinstance(
            client, WeaviateAsyncClient
        ):  # Check if client is an AsyncClient object
            config = await manager.load_rag_config(client)
            user_config = await manager.load_user_config(client)
            theme, themes = await manager.load_theme_config(client)
            return JSONResponse(
                status_code=200,
                content={
                    "connected": True,
                    "error": "",
                    "rag_config": config,
                    "user_config": user_config,
                    "theme": theme,
                    "themes": themes,
                },
            )
        else:
            raise TypeError(
                "Couldn't connect to Weaviate, client is not an AsyncClient object"
            )
    except Exception as e:
        msg.fail(f"Failed to connect to Weaviate {str(e)}")
        return JSONResponse(
            status_code=400,
            content={
                "connected": False,
                "error": f"Failed to connect to Weaviate {str(e)}",
                "rag_config": {},
                "theme": {},
                "themes": {},
            },
        )


### WEBSOCKETS


@app.websocket("/ws/generate_stream")
async def websocket_generate_stream(websocket: WebSocket):
    # Allow WebSocket connections from any origin for remote access
    origin = websocket.headers.get("origin")
    if origin:
        # Accept connections from any origin for remote access
        await websocket.accept()
    else:
        await websocket.accept()
    while True:  # Start a loop to keep the connection alive.
        try:
            data = await websocket.receive_text()
            
            # Handle ping messages for heartbeat
            try:
                ping_data = data
                if isinstance(ping_data, str):
                    import json
                    ping_json = json.loads(ping_data)
                    if ping_json.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                        continue
            except:
                pass  # Not a ping message, continue with normal processing
            
            # Parse and validate the JSON string using Pydantic model
            payload = GeneratePayload.model_validate_json(data)

            SecureLogger.good(f"Received generate stream call for query")

            full_text = ""
            async for chunk in manager.generate_stream_answer(
                payload.rag_config,
                payload.query,
                payload.context,
                payload.conversation,
            ):
                full_text += chunk["message"]
                if chunk["finish_reason"] == "stop":
                    chunk["full_text"] = full_text
                await websocket.send_json(chunk)

        except WebSocketDisconnect:
            SecureLogger.warn("WebSocket connection closed by client")
            break  # Break out of the loop when the client disconnects

        except Exception as e:
            error_response = handle_websocket_error(e, "generate_stream")
            SecureLogger.fail(f"WebSocket Error: {sanitize_error_message(str(e))}")
            try:
                await websocket.send_json({
                    "message": error_response["message"],
                    "finish_reason": "stop",
                    "full_text": error_response["message"],
                    "error": True,
                    "error_code": error_response["error_code"]
                })
            except:
                pass  # Connection might be closed
        SecureLogger.good("Successfully streamed answer")


@app.websocket("/ws/import_files")
async def websocket_import_files(websocket: WebSocket):

    if production == "Demo":
        return

    # Allow WebSocket connections from any origin for remote access
    origin = websocket.headers.get("origin")
    if origin:
        # Accept connections from any origin for remote access
        await websocket.accept()
    else:
        await websocket.accept()
    logger = LoggerManager(websocket)
    batcher = BatchManager()

    while True:
        try:
            data = await websocket.receive_text()
            
            # Handle ping messages for heartbeat
            try:
                ping_data = data
                if isinstance(ping_data, str):
                    import json
                    ping_json = json.loads(ping_data)
                    if ping_json.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                        continue
            except:
                pass  # Not a ping message, continue with normal processing
            
            batch_data = DataBatchPayload.model_validate_json(data)
            fileConfig = batcher.add_batch(batch_data)
            if fileConfig is not None:
                client = await client_manager.connect(batch_data.credentials)
                await asyncio.create_task(
                    manager.import_document(client, fileConfig, logger)
                )

        except WebSocketDisconnect:
            SecureLogger.warn("Import WebSocket connection closed by client")
            break
        except Exception as e:
            error_response = handle_websocket_error(e, "import_files")
            SecureLogger.fail(f"Import WebSocket Error: {sanitize_error_message(str(e))}")
            try:
                await websocket.send_text(str(error_response))
            except:
                pass  # Connection might be closed
            break


### CONFIG ENDPOINTS


# Get Configuration
@app.post("/api/get_rag_config")
async def retrieve_rag_config(payload: Credentials):
    try:
        client = await client_manager.connect(payload)
        config = await manager.load_rag_config(client)
        return JSONResponse(
            status_code=200, content={"rag_config": config, "error": ""}
        )

    except Exception as e:
        msg.warn(f"Could not retrieve configuration: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "rag_config": {},
                "error": f"Could not retrieve rag configuration: {str(e)}",
            },
        )


@app.post("/api/set_rag_config")
async def update_rag_config(payload: SetRAGConfigPayload):
    if production == "Demo":
        return JSONResponse(
            content={
                "status": "200",
                "status_msg": "Config can't be updated in Production Mode",
            }
        )

    try:
        client = await client_manager.connect(payload.credentials)
        await manager.set_rag_config(client, payload.rag_config.model_dump())
        return JSONResponse(
            content={
                "status": 200,
            }
        )
    except Exception as e:
        msg.warn(f"Failed to set new RAG Config {str(e)}")
        return JSONResponse(
            content={
                "status": 400,
                "status_msg": f"Failed to set new RAG Config {str(e)}",
            }
        )


@app.post("/api/get_user_config")
async def retrieve_user_config(payload: Credentials):
    try:
        client = await client_manager.connect(payload)
        config = await manager.load_user_config(client)
        return JSONResponse(
            status_code=200, content={"user_config": config, "error": ""}
        )

    except Exception as e:
        msg.warn(f"Could not retrieve user configuration: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "user_config": {},
                "error": f"Could not retrieve rag configuration: {str(e)}",
            },
        )


@app.post("/api/set_user_config")
async def update_user_config(payload: SetUserConfigPayload):
    if production == "Demo":
        return JSONResponse(
            content={
                "status": "200",
                "status_msg": "Config can't be updated in Production Mode",
            }
        )

    try:
        client = await client_manager.connect(payload.credentials)
        await manager.set_user_config(client, payload.user_config)
        return JSONResponse(
            content={
                "status": 200,
                "status_msg": "User config updated",
            }
        )
    except Exception as e:
        msg.warn(f"Failed to set new RAG Config {str(e)}")
        return JSONResponse(
            content={
                "status": 400,
                "status_msg": f"Failed to set new RAG Config {str(e)}",
            }
        )


# Get Configuration
@app.post("/api/get_theme_config")
async def retrieve_theme_config(payload: Credentials):
    try:
        client = await client_manager.connect(payload)
        theme, themes = await manager.load_theme_config(client)
        return JSONResponse(
            status_code=200, content={"theme": theme, "themes": themes, "error": ""}
        )

    except Exception as e:
        msg.warn(f"Could not retrieve configuration: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "theme": None,
                "themes": None,
                "error": f"Could not retrieve theme configuration: {str(e)}",
            },
        )


@app.post("/api/set_theme_config")
async def update_theme_config(payload: SetThemeConfigPayload):
    if production == "Demo":
        return JSONResponse(
            content={
                "status": "200",
                "status_msg": "Config can't be updated in Production Mode",
            }
        )

    try:
        client = await client_manager.connect(payload.credentials)
        await manager.set_theme_config(
            client, {"theme": payload.theme, "themes": payload.themes}
        )
        return JSONResponse(
            content={
                "status": 200,
            }
        )
    except Exception as e:
        msg.warn(f"Failed to set new RAG Config {str(e)}")
        return JSONResponse(
            content={
                "status": 400,
                "status_msg": f"Failed to set new RAG Config {str(e)}",
            }
        )


### RAG ENDPOINTS


# Receive query and return chunks and query answer
@app.post("/api/query")
async def query(payload: QueryPayload):
    msg.good(f"Received query: {payload.query}")
    try:
        # Validate required fields
        validate_required_fields(payload.model_dump(), ["query", "credentials"])
        
        client = await client_manager.connect(payload.credentials)
        documents_uuid = [document.uuid for document in payload.documentFilter]
        documents, context = await manager.retrieve_chunks(
            client, payload.query, payload.RAG, payload.labels, documents_uuid
        )

        return JSONResponse(
            content={"error": "", "documents": documents, "context": context}
        )
    except APIError:
        # Re-raise APIError to be handled by global handler
        raise
    except Exception as e:
        # Sanitize error message before logging
        sanitized_error = sanitize_error_message(str(e))
        msg.warn(f"Query failed: {sanitized_error}")
        
        # Raise as APIError for consistent handling
        raise APIError(
            message=f"Query processing failed: {sanitized_error}",
            error_code=ErrorCodes.EXTERNAL_SERVICE_ERROR,
            status_code=500,
            user_message="Unable to process your query. Please try again."
        )


### DOCUMENT ENDPOINTS


# Retrieve specific document based on UUID
@app.post("/api/get_document")
async def get_document(payload: GetDocumentPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        document = await manager.weaviate_manager.get_document(
            client,
            payload.uuid,
            properties=[
                "title",
                "extension",
                "fileSize",
                "labels",
                "source",
                "meta",
                "metadata",
            ],
        )
        if document is not None:
            document["content"] = ""
            msg.good(f"Succesfully retrieved document: {document['title']}")
            return JSONResponse(
                content={
                    "error": "",
                    "document": document,
                }
            )
        else:
            msg.warn(f"Could't retrieve document")
            return JSONResponse(
                content={
                    "error": "Couldn't retrieve requested document",
                    "document": None,
                }
            )
    except Exception as e:
        msg.fail(f"Document retrieval failed: {str(e)}")
        return JSONResponse(
            content={
                "error": str(e),
                "document": None,
            }
        )


@app.post("/api/get_datacount")
async def get_document_count(payload: DatacountPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        document_uuids = [document.uuid for document in payload.documentFilter]
        datacount = await manager.weaviate_manager.get_datacount(
            client, payload.embedding_model, document_uuids
        )
        return JSONResponse(
            content={
                "datacount": datacount,
            }
        )
    except Exception as e:
        msg.fail(f"Document Count retrieval failed: {str(e)}")
        return JSONResponse(
            content={
                "datacount": 0,
            }
        )


@app.post("/api/get_labels")
async def get_labels(payload: Credentials):
    try:
        client = await client_manager.connect(payload)
        labels = await manager.weaviate_manager.get_labels(client)
        return JSONResponse(
            content={
                "labels": labels,
            }
        )
    except Exception as e:
        msg.fail(f"Document Labels retrieval failed: {str(e)}")
        return JSONResponse(
            content={
                "labels": [],
            }
        )


# Retrieve specific document based on UUID
@app.post("/api/get_content")
async def get_content(payload: GetContentPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        content, maxPage = await manager.get_content(
            client, payload.uuid, payload.page - 1, payload.chunkScores
        )
        msg.good(f"Succesfully retrieved content from {payload.uuid}")
        return JSONResponse(
            content={"error": "", "content": content, "maxPage": maxPage}
        )
    except Exception as e:
        msg.fail(f"Document retrieval failed: {str(e)}")
        return JSONResponse(
            content={
                "error": str(e),
                "document": None,
            }
        )


# Retrieve specific document based on UUID
@app.post("/api/get_vectors")
async def get_vectors(payload: GetVectorPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        vector_groups = await manager.weaviate_manager.get_vectors(
            client, payload.uuid, payload.showAll
        )
        return JSONResponse(
            content={
                "error": "",
                "vector_groups": vector_groups,
            }
        )
    except Exception as e:
        msg.fail(f"Vector retrieval failed: {str(e)}")
        return JSONResponse(
            content={
                "error": str(e),
                "payload": {"embedder": "None", "vectors": []},
            }
        )


# Retrieve specific document based on UUID
@app.post("/api/get_chunks")
async def get_chunks(payload: ChunksPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        chunks = await manager.weaviate_manager.get_chunks(
            client, payload.uuid, payload.page, payload.pageSize
        )
        return JSONResponse(
            content={
                "error": "",
                "chunks": chunks,
            }
        )
    except Exception as e:
        msg.fail(f"Chunk retrieval failed: {str(e)}")
        return JSONResponse(
            content={
                "error": str(e),
                "chunks": None,
            }
        )


# Retrieve specific document based on UUID
@app.post("/api/get_chunk")
async def get_chunk(payload: GetChunkPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        chunk = await manager.weaviate_manager.get_chunk(
            client, payload.uuid, payload.embedder
        )
        return JSONResponse(
            content={
                "error": "",
                "chunk": chunk,
            }
        )
    except Exception as e:
        msg.fail(f"Chunk retrieval failed: {str(e)}")
        return JSONResponse(
            content={
                "error": str(e),
                "chunk": None,
            }
        )


## Retrieve and search documents imported to Weaviate
@app.post("/api/get_all_documents")
async def get_all_documents(payload: SearchQueryPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        documents, total_count = await manager.weaviate_manager.get_documents(
            client,
            payload.query,
            payload.pageSize,
            payload.page,
            payload.labels,
            properties=["title", "extension", "fileSize", "labels", "source", "meta"],
        )
        labels = await manager.weaviate_manager.get_labels(client)

        msg.good(f"Succesfully retrieved document: {len(documents)} documents")
        return JSONResponse(
            content={
                "documents": documents,
                "labels": labels,
                "error": "",
                "totalDocuments": total_count,
            }
        )
    except Exception as e:
        msg.fail(f"Retrieving all documents failed: {str(e)}")
        return JSONResponse(
            content={
                "documents": [],
                "label": [],
                "error": f"All Document retrieval failed: {str(e)}",
                "totalDocuments": 0,
            }
        )


# Delete specific document based on UUID
@app.post("/api/delete_document")
async def delete_document(payload: GetDocumentPayload):
    if production == "Demo":
        msg.warn("Can't delete documents when in Production Mode")
        return JSONResponse(status_code=200, content={})

    try:
        client = await client_manager.connect(payload.credentials)
        msg.info(f"Deleting {payload.uuid}")
        await manager.weaviate_manager.delete_document(client, payload.uuid)
        return JSONResponse(status_code=200, content={})

    except Exception as e:
        msg.fail(f"Deleting Document with ID {payload.uuid} failed: {str(e)}")
        return JSONResponse(status_code=400, content={})


### ADMIN


@app.post("/api/reset")
async def reset_oxtari(payload: ResetPayload):
    if production == "Demo":
        return JSONResponse(status_code=200, content={})

    try:
        client = await client_manager.connect(payload.credentials)
        if payload.resetMode == "ALL":
            await manager.weaviate_manager.delete_all(client)
        elif payload.resetMode == "DOCUMENTS":
            await manager.weaviate_manager.delete_all_documents(client)
        elif payload.resetMode == "CONFIG":
            await manager.weaviate_manager.delete_all_configs(client)
        elif payload.resetMode == "SUGGESTIONS":
            await manager.weaviate_manager.delete_all_suggestions(client)

        msg.info(f"Resetting Oxtari in ({payload.resetMode}) mode")

        return JSONResponse(status_code=200, content={})

    except Exception as e:
        msg.warn(f"Failed to reset Oxtari {str(e)}")
        return JSONResponse(status_code=500, content={})


# Get Status meta data
@app.post("/api/get_meta")
async def get_meta(payload: Credentials):
    try:
        client = await client_manager.connect(payload)
        node_payload, collection_payload = await manager.weaviate_manager.get_metadata(
            client
        )
        return JSONResponse(
            content={
                "error": "",
                "node_payload": node_payload,
                "collection_payload": collection_payload,
            }
        )
    except Exception as e:
        return JSONResponse(
            content={
                "error": f"Couldn't retrieve metadata {str(e)}",
                "node_payload": {},
                "collection_payload": {},
            }
        )


### Suggestions


@app.post("/api/get_suggestions")
async def get_suggestions(payload: GetSuggestionsPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        suggestions = await manager.weaviate_manager.retrieve_suggestions(
            client, payload.query, payload.limit
        )
        return JSONResponse(
            content={
                "suggestions": suggestions,
            }
        )
    except Exception:
        return JSONResponse(
            content={
                "suggestions": [],
            }
        )


@app.post("/api/get_all_suggestions")
async def get_all_suggestions(payload: GetAllSuggestionsPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        suggestions, total_count = (
            await manager.weaviate_manager.retrieve_all_suggestions(
                client, payload.page, payload.pageSize
            )
        )
        return JSONResponse(
            content={
                "suggestions": suggestions,
                "total_count": total_count,
            }
        )
    except Exception:
        return JSONResponse(
            content={
                "suggestions": [],
                "total_count": 0,
            }
        )


@app.post("/api/delete_suggestion")
async def delete_suggestion(payload: DeleteSuggestionPayload):
    try:
        client = await client_manager.connect(payload.credentials)
        await manager.weaviate_manager.delete_suggestions(client, payload.uuid)
        return JSONResponse(
            content={
                "status": 200,
            }
        )
    except Exception:
        return JSONResponse(
            content={
                "status": 400,
            }
        )
