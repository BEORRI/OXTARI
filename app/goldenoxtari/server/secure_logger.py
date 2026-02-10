"""
Secure logging utility to prevent sensitive data from appearing in logs.
Provides sanitized logging functions that automatically redact sensitive information.
"""

import logging
import re
import os
from typing import Any, Dict, Optional
from wasabi import msg
from goldenoxtari.components.api_key_validator import get_sanitized_api_key


class SecureLogger:
    """Secure logger that automatically sanitizes sensitive data."""
    
    # Patterns for sensitive data
    SENSITIVE_PATTERNS = [
        # API Keys
        (r'sk-[A-Za-z0-9]{20,}', '[REDACTED_OPENAI_KEY]'),
        (r'sk-ant-[A-Za-z0-9\-]{20,}', '[REDACTED_ANTHROPIC_KEY]'),
        (r'gsk_[A-Za-z0-9]{20,}', '[REDACTED_GROQ_KEY]'),
        (r'fc-[A-Za-z0-9\-]{20,}', '[REDACTED_FIRECRAWL_KEY]'),
        (r'glpat-[A-Za-z0-9\-]{20,}', '[REDACTED_GITLAB_KEY]'),
        (r'(ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{36}', '[REDACTED_GITHUB_TOKEN]'),
        (r'Bearer [A-Za-z0-9\-]+', 'Bearer [REDACTED_TOKEN]'),
        
        # Passwords and secrets
        (r'password["\']?\s*[:=]\s*["\']?[^"\'\s]+', 'password="[REDACTED]"'),
        (r'secret["\']?\s*[:=]\s*["\']?[^"\'\s]+', 'secret="[REDACTED]"'),
        (r'token["\']?\s*[:=]\s*["\']?[^"\'\s]+', 'token="[REDACTED]"'),
        
        # URLs with credentials
        (r'https?://[^:]+:[^@]+@', 'https://[REDACTED_CREDENTIALS]@'),
        
        # File paths with sensitive info
        (r'/[A-Za-z0-9/_.-]*\.(env|key|pem|p12|pfx)', '[REDACTED_PATH]'),
        
        # Long alphanumeric strings (potential keys)
        (r'\b[A-Za-z0-9]{32,}\b', '[REDACTED_KEY]'),
    ]
    
    @classmethod
    def sanitize_message(cls, message: str) -> str:
        """Sanitize a log message by removing sensitive data."""
        if not message:
            return message
        
        sanitized = message
        
        # Apply all sensitive patterns
        for pattern, replacement in cls.SENSITIVE_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize a dictionary by removing sensitive keys and values."""
        if not isinstance(data, dict):
            return data
        
        sanitized = {}
        sensitive_keys = {
            'api_key', 'apikey', 'api-key', 'access_key', 'access_key_id',
            'secret_key', 'secret_access_key', 'password', 'passwd', 'pwd',
            'token', 'auth_token', 'bearer_token', 'jwt', 'session_id',
            'private_key', 'privatekey', 'private-key', 'certificate',
            'credentials', 'auth', 'authorization'
        }
        
        for key, value in data.items():
            key_lower = key.lower().replace('_', '').replace('-', '')
            
            # Skip sensitive keys entirely
            if any(sensitive_key in key_lower for sensitive_key in sensitive_keys):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, str):
                # Sanitize string values
                sanitized[key] = cls.sanitize_message(value)
            elif isinstance(value, dict):
                # Recursively sanitize nested dictionaries
                sanitized[key] = cls.sanitize_dict(value)
            elif isinstance(value, list):
                # Sanitize list items
                sanitized[key] = [
                    cls.sanitize_dict(item) if isinstance(item, dict) 
                    else cls.sanitize_message(item) if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
    
    @classmethod
    def info(cls, message: str, **kwargs):
        """Log info message with sanitization."""
        sanitized_message = cls.sanitize_message(message)
        sanitized_kwargs = cls.sanitize_dict(kwargs) if kwargs else {}
        msg.info(sanitized_message, **sanitized_kwargs)
    
    @classmethod
    def good(cls, message: str, **kwargs):
        """Log success message with sanitization."""
        sanitized_message = cls.sanitize_message(message)
        sanitized_kwargs = cls.sanitize_dict(kwargs) if kwargs else {}
        msg.good(sanitized_message, **sanitized_kwargs)
    
    @classmethod
    def warn(cls, message: str, **kwargs):
        """Log warning message with sanitization."""
        sanitized_message = cls.sanitize_message(message)
        sanitized_kwargs = cls.sanitize_dict(kwargs) if kwargs else {}
        msg.warn(sanitized_message, **sanitized_kwargs)
    
    @classmethod
    def fail(cls, message: str, **kwargs):
        """Log error message with sanitization."""
        sanitized_message = cls.sanitize_message(message)
        sanitized_kwargs = cls.sanitize_dict(kwargs) if kwargs else {}
        msg.fail(sanitized_message, **sanitized_kwargs)


def setup_secure_logging():
    """Set up secure logging configuration."""
    # Configure Python logging to use sanitized messages
    class SecureLogFormatter(logging.Formatter):
        def format(self, record):
            # Get the original message
            original_message = record.getMessage()
            
            # Sanitize the message
            sanitized_message = SecureLogger.sanitize_message(original_message)
            
            # Update the record with sanitized message
            record.msg = sanitized_message
            record.args = ()
            
            return super().format(record)
    
    # Apply the formatter to all handlers
    for handler in logging.root.handlers:
        handler.setFormatter(SecureLogFormatter())
    
    # Set up logging level based on environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    logging.getLogger().setLevel(getattr(logging, log_level, logging.INFO))


# Convenience functions for backward compatibility
def secure_info(message: str, **kwargs):
    """Log info message with automatic sanitization."""
    SecureLogger.info(message, **kwargs)


def secure_good(message: str, **kwargs):
    """Log success message with automatic sanitization."""
    SecureLogger.good(message, **kwargs)


def secure_warn(message: str, **kwargs):
    """Log warning message with automatic sanitization."""
    SecureLogger.warn(message, **kwargs)


def secure_fail(message: str, **kwargs):
    """Log error message with automatic sanitization."""
    SecureLogger.fail(message, **kwargs)
