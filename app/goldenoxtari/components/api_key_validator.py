"""
Centralized API key validation utilities.
Provides consistent validation for different service API keys.
"""

import re
from typing import Dict, Optional, Tuple


class APIKeyValidator:
    """Centralized API key validation for different services."""
    
    # Service-specific validation patterns
    VALIDATION_PATTERNS = {
        "openai": {
            "pattern": r"^sk-[A-Za-z0-9]{20,}$",
            "min_length": 20,
            "description": "OpenAI API key must start with 'sk-' followed by alphanumeric characters"
        },
        "anthropic": {
            "pattern": r"^sk-ant-[A-Za-z0-9\-]{20,}$",
            "min_length": 20,
            "description": "Anthropic API key must start with 'sk-ant-' followed by alphanumeric characters and hyphens"
        },
        "cohere": {
            "pattern": r"^[A-Za-z0-9]{40,}$",
            "min_length": 40,
            "description": "Cohere API key must be at least 40 alphanumeric characters"
        },
        "groq": {
            "pattern": r"^gsk_[A-Za-z0-9]{20,}$",
            "min_length": 20,
            "description": "Groq API key must start with 'gsk_' followed by alphanumeric characters"
        },
        "voyage": {
            "pattern": r"^[A-Za-z0-9\-]{20,}$",
            "min_length": 20,
            "description": "Voyage API key must be at least 20 alphanumeric characters and hyphens"
        },
        "upstage": {
            "pattern": r"^[A-Za-z0-9\-]{20,}$",
            "min_length": 20,
            "description": "Upstage API key must be at least 20 alphanumeric characters and hyphens"
        },
        "unstructured": {
            "pattern": r"^[A-Za-z0-9\-]{20,}$",
            "min_length": 20,
            "description": "Unstructured API key must be at least 20 alphanumeric characters and hyphens"
        },
        "assemblyai": {
            "pattern": r"^[A-Za-z0-9]{32,}$",
            "min_length": 32,
            "description": "AssemblyAI API key must be at least 32 alphanumeric characters"
        },
        "firecrawl": {
            "pattern": r"^fc-[A-Za-z0-9\-]{20,}$",
            "min_length": 20,
            "description": "Firecrawl API key must start with 'fc-' followed by alphanumeric characters and hyphens"
        },
        "github": {
            "pattern": r"^(ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{36}$",
            "min_length": 40,
            "description": "GitHub token must start with 'ghp_', 'gho_', 'ghu_', 'ghs_', or 'ghr_' followed by 36 alphanumeric characters"
        },
        "gitlab": {
            "pattern": r"^glpat-[A-Za-z0-9\-]{20,}$",
            "min_length": 20,
            "description": "GitLab token must start with 'glpat-' followed by alphanumeric characters and hyphens"
        }
    }
    
    @classmethod
    def validate_api_key(cls, service: str, api_key: str) -> Tuple[bool, Optional[str]]:
        """
        Validate an API key for a specific service.
        
        Args:
            service: The service name (e.g., 'openai', 'anthropic')
            api_key: The API key to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not api_key or not api_key.strip():
            return False, f"{service.title()} API key is required"
        
        api_key = api_key.strip()
        
        if service not in cls.VALIDATION_PATTERNS:
            # Generic validation for unknown services
            if len(api_key) < 10:
                return False, f"{service.title()} API key appears to be too short"
            return True, None
        
        pattern_info = cls.VALIDATION_PATTERNS[service]
        
        # Check minimum length
        if len(api_key) < pattern_info["min_length"]:
            return False, f"{service.title()} API key must be at least {pattern_info['min_length']} characters long"
        
        # Check pattern
        if not re.match(pattern_info["pattern"], api_key):
            return False, pattern_info["description"]
        
        return True, None
    
    @classmethod
    def validate_multiple_keys(cls, keys: Dict[str, str]) -> Dict[str, Tuple[bool, Optional[str]]]:
        """
        Validate multiple API keys at once.
        
        Args:
            keys: Dictionary mapping service names to API keys
            
        Returns:
            Dictionary mapping service names to validation results
        """
        results = {}
        for service, api_key in keys.items():
            results[service] = cls.validate_api_key(service, api_key)
        return results
    
    @classmethod
    def get_required_keys_for_config(cls, config: dict) -> list:
        """
        Get list of required API keys for a given configuration.
        
        Args:
            config: Configuration dictionary
            
        Returns:
            List of required service names
        """
        required_keys = []
        
        # Check for common service configurations
        if "OpenAI" in str(config):
            required_keys.append("openai")
        if "Anthropic" in str(config):
            required_keys.append("anthropic")
        if "Cohere" in str(config):
            required_keys.append("cohere")
        if "Groq" in str(config):
            required_keys.append("groq")
        if "Voyage" in str(config):
            required_keys.append("voyage")
        if "Upstage" in str(config):
            required_keys.append("upstage")
        if "Unstructured" in str(config):
            required_keys.append("unstructured")
        if "AssemblyAI" in str(config):
            required_keys.append("assemblyai")
        if "Firecrawl" in str(config):
            required_keys.append("firecrawl")
        if "GitHub" in str(config):
            required_keys.append("github")
        if "GitLab" in str(config):
            required_keys.append("gitlab")
        
        return required_keys
    
    @classmethod
    def sanitize_api_key(cls, api_key: str, show_chars: int = 4) -> str:
        """
        Sanitize an API key for logging (show only first and last few characters).
        
        Args:
            api_key: The API key to sanitize
            show_chars: Number of characters to show at the beginning and end
            
        Returns:
            Sanitized API key string
        """
        if not api_key or len(api_key) <= show_chars * 2:
            return "[REDACTED]"
        
        return f"{api_key[:show_chars]}...{api_key[-show_chars:]}"


def validate_service_api_key(service: str, api_key: str) -> None:
    """
    Validate an API key and raise an exception if invalid.
    
    Args:
        service: The service name
        api_key: The API key to validate
        
    Raises:
        Exception: If the API key is invalid
    """
    is_valid, error_message = APIKeyValidator.validate_api_key(service, api_key)
    if not is_valid:
        raise Exception(error_message)


def get_sanitized_api_key(api_key: str) -> str:
    """
    Get a sanitized version of an API key for logging.
    
    Args:
        api_key: The API key to sanitize
        
    Returns:
        Sanitized API key string
    """
    return APIKeyValidator.sanitize_api_key(api_key)
