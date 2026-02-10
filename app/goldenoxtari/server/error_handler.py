"""
Centralized error handling for Oxtari API.
Provides consistent error responses and logging.
"""

import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.websockets import WebSocketDisconnect
import traceback
from wasabi import msg

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ErrorCodes:
    """Standard error codes for consistent API responses."""
    
    # Client errors (4xx)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INVALID_REQUEST = "INVALID_REQUEST"
    
    # Server errors (5xx)
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    TIMEOUT_ERROR = "TIMEOUT_ERROR"
    
    # WebSocket errors
    WEBSOCKET_CONNECTION_ERROR = "WEBSOCKET_CONNECTION_ERROR"
    WEBSOCKET_MESSAGE_ERROR = "WEBSOCKET_MESSAGE_ERROR"

class APIError(Exception):
    """Custom exception for API errors with structured information."""
    
    def __init__(
        self,
        message: str,
        error_code: str = ErrorCodes.INTERNAL_SERVER_ERROR,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
        user_message: Optional[str] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        self.user_message = user_message or message
        super().__init__(self.message)

def create_error_response(
    error_code: str,
    message: str,
    status_code: int = 500,
    details: Optional[Dict[str, Any]] = None,
    user_message: Optional[str] = None
) -> JSONResponse:
    """Create a standardized error response."""
    
    response_data = {
        "error": True,
        "error_code": error_code,
        "message": user_message or message,
        "details": details or {},
        "timestamp": msg.timestamp
    }
    
    return JSONResponse(
        status_code=status_code,
        content=response_data
    )

def handle_api_exception(exc: APIError) -> JSONResponse:
    """Handle custom API exceptions."""
    return create_error_response(
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        user_message=exc.user_message
    )

def handle_http_exception(exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    error_code = ErrorCodes.INVALID_REQUEST
    if exc.status_code == 401:
        error_code = ErrorCodes.AUTHENTICATION_ERROR
    elif exc.status_code == 403:
        error_code = ErrorCodes.AUTHORIZATION_ERROR
    elif exc.status_code == 404:
        error_code = ErrorCodes.NOT_FOUND
    elif exc.status_code == 422:
        error_code = ErrorCodes.VALIDATION_ERROR
    elif exc.status_code == 429:
        error_code = ErrorCodes.RATE_LIMIT_EXCEEDED
    
    return create_error_response(
        error_code=error_code,
        message=str(exc.detail),
        status_code=exc.status_code
    )

def handle_generic_exception(exc: Exception, request: Optional[Request] = None) -> JSONResponse:
    """Handle unexpected exceptions with proper logging."""
    
    # Log the full exception with traceback
    logger.error(f"Unexpected error: {type(exc).__name__}: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    # Log request details if available
    if request:
        logger.error(f"Request: {request.method} {request.url}")
        logger.error(f"Headers: {dict(request.headers)}")
    
    # Don't expose internal details to client
    return create_error_response(
        error_code=ErrorCodes.INTERNAL_SERVER_ERROR,
        message="An internal server error occurred",
        status_code=500,
        user_message="Something went wrong. Please try again later."
    )

def handle_websocket_error(exc: Exception, websocket_type: str = "general") -> Dict[str, Any]:
    """Handle WebSocket errors with structured response."""
    
    error_code = ErrorCodes.WEBSOCKET_CONNECTION_ERROR
    message = "WebSocket connection error"
    
    if isinstance(exc, WebSocketDisconnect):
        error_code = ErrorCodes.WEBSOCKET_CONNECTION_ERROR
        message = f"{websocket_type} WebSocket disconnected"
    elif "JSON" in str(exc):
        error_code = ErrorCodes.WEBSOCKET_MESSAGE_ERROR
        message = "Invalid message format"
    elif "timeout" in str(exc).lower():
        error_code = ErrorCodes.TIMEOUT_ERROR
        message = "Request timeout"
    
    logger.error(f"WebSocket error ({websocket_type}): {type(exc).__name__}: {str(exc)}")
    
    return {
        "error": True,
        "error_code": error_code,
        "message": message,
        "websocket_type": websocket_type,
        "timestamp": msg.timestamp
    }

def validate_required_fields(data: Dict[str, Any], required_fields: list) -> None:
    """Validate that required fields are present in request data."""
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    
    if missing_fields:
        raise APIError(
            message=f"Missing required fields: {', '.join(missing_fields)}",
            error_code=ErrorCodes.VALIDATION_ERROR,
            status_code=400,
            details={"missing_fields": missing_fields},
            user_message="Please provide all required information."
        )

def validate_api_key(api_key: str, service_name: str) -> None:
    """Validate API key format and presence using centralized validator."""
    from goldenoxtari.components.api_key_validator import validate_service_api_key
    
    try:
        validate_service_api_key(service_name.lower(), api_key)
    except Exception as e:
        raise APIError(
            message=str(e),
            error_code=ErrorCodes.AUTHENTICATION_ERROR,
            status_code=401,
            user_message=f"Please check your {service_name} API key."
        )

def sanitize_error_message(message: str) -> str:
    """Remove sensitive information from error messages."""
    from goldenoxtari.components.api_key_validator import get_sanitized_api_key
    import re
    
    # Remove API keys (common patterns)
    message = re.sub(r'sk-[A-Za-z0-9]{20,}', '[REDACTED_OPENAI_KEY]', message)
    message = re.sub(r'sk-ant-[A-Za-z0-9\-]{20,}', '[REDACTED_ANTHROPIC_KEY]', message)
    message = re.sub(r'gsk_[A-Za-z0-9]{20,}', '[REDACTED_GROQ_KEY]', message)
    message = re.sub(r'fc-[A-Za-z0-9\-]{20,}', '[REDACTED_FIRECRAWL_KEY]', message)
    message = re.sub(r'glpat-[A-Za-z0-9\-]{20,}', '[REDACTED_GITLAB_KEY]', message)
    message = re.sub(r'(ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{36}', '[REDACTED_GITHUB_TOKEN]', message)
    message = re.sub(r'Bearer [A-Za-z0-9\-]+', 'Bearer [REDACTED_TOKEN]', message)
    
    # Remove other long alphanumeric strings that might be keys
    message = re.sub(r'[A-Za-z0-9]{32,}', '[REDACTED_KEY]', message)
    
    # Remove file paths that might contain sensitive info
    message = re.sub(r'/[A-Za-z0-9/_.-]+\.(py|js|ts|json|env)', '[REDACTED_PATH]', message)
    
    return message
