"""
Structured Logging Module
Provides consistent, JSON-structured logging across the application.
"""
import logging
import sys
from datetime import datetime
from typing import Optional
from backend.core.config import settings

class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs structured log entries."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add any extra fields
        if hasattr(record, 'extra_data'):
            log_entry.update(record.extra_data)
        
        # Format as readable string for console
        timestamp = log_entry["timestamp"][:19]
        level = log_entry["level"]
        message = log_entry["message"]
        location = f"{log_entry['module']}:{log_entry['line']}"
        
        return f"{timestamp} | {level:8} | {location:30} | {message}"

def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance."""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(StructuredFormatter())
        logger.addHandler(console_handler)
        
        # Set level from config
        level = getattr(logging, settings.log_level.upper(), logging.INFO)
        logger.setLevel(level)
    
    return logger

# Create application logger
app_logger = get_logger("open_alpha")

# Convenience functions
def log_info(message: str, **kwargs):
    """Log info message with optional extra data."""
    app_logger.info(message, extra={"extra_data": kwargs} if kwargs else {})

def log_error(message: str, **kwargs):
    """Log error message with optional extra data."""
    app_logger.error(message, extra={"extra_data": kwargs} if kwargs else {})

def log_warning(message: str, **kwargs):
    """Log warning message with optional extra data."""
    app_logger.warning(message, extra={"extra_data": kwargs} if kwargs else {})

def log_debug(message: str, **kwargs):
    """Log debug message with optional extra data."""
    app_logger.debug(message, extra={"extra_data": kwargs} if kwargs else {})
