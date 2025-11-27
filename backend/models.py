"""Data models for the debugging system"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class ErrorType(str, Enum):
    SYNTAX = "syntax"
    IMPORT = "import"
    NAME = "name"
    TYPE = "type"
    ATTRIBUTE = "attribute"
    INDEX = "index"
    KEY = "key"
    VALUE = "value"
    RUNTIME = "runtime"
    LOGIC = "logic"
    UNKNOWN = "unknown"


class PatchSource(str, Enum):
    RULE_BASED = "rule_based"
    LLM_ERROR_INTERPRETER = "llm_error_interpreter"
    LLM_PATCH_GENERATOR = "llm_patch_generator"
    LLM_VALIDATOR = "llm_validator"
    LLM_REFACTOR = "llm_refactor"
    LLM_TEST_CREATOR = "llm_test_creator"


class ExecutionStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"


class ExecutionResult(BaseModel):
    stdout: str = ""
    stderr: str = ""
    exit_code: int
    status: ExecutionStatus
    error_type: Optional[ErrorType] = None
    error_message: Optional[str] = None
    traceback: Optional[str] = None


class CodeVersion(BaseModel):
    version: int
    code: str
    timestamp: datetime = Field(default_factory=datetime.now)
    execution_result: Optional[ExecutionResult] = None


class Patch(BaseModel):
    patch_id: str
    version_from: int
    version_to: int
    source: PatchSource
    reasoning: str
    diff: str
    timestamp: datetime = Field(default_factory=datetime.now)
    applied: bool = False
    error_analysis: Optional[str] = None  # Detailed error analysis
    fix_strategy: Optional[str] = None    # How the fix was applied
    error_category: Optional[str] = None  # Category of error (syntax, logic, etc.)


class DebugSession(BaseModel):
    session_id: str
    original_code: str
    current_version: int = 0
    versions: List[CodeVersion] = []
    patches: List[Patch] = []
    traces: List[str] = []
    max_iterations: int = 10
    current_iteration: int = 0
    status: str = "running"  # running, success, failed, max_iterations
    final_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


class CodeSubmission(BaseModel):
    code: str
    language: str = "python"  # Default to Python for backward compatibility
    max_iterations: int = 10


class SessionResponse(BaseModel):
    session_id: str
    status: str
    message: str
