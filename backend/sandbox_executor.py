"""Docker sandbox executor for running code safely"""
import json
import subprocess
from typing import Dict, Any
from .models import ExecutionResult, ExecutionStatus, ErrorType
import re


class SandboxExecutor:
    """Executes Python code in a Docker sandbox"""
    
    def __init__(self, container_name: str = "sandbox-container"):
        self.container_name = container_name
    
    def execute(self, code: str, timeout: int = 10) -> ExecutionResult:
        """
        Execute code in the Docker sandbox
        
        Args:
            code: Python code to execute
            timeout: Execution timeout in seconds
            
        Returns:
            ExecutionResult with stdout, stderr, exit_code, and error analysis
        """
        try:
            # Prepare the code as JSON
            payload = json.dumps({"code": code})
            
            # Execute in Docker with proper stdin handling
            docker_cmd = ["docker", "run", "--rm", "-i", self.container_name]
            
            result = subprocess.run(
                docker_cmd,
                input=payload,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            # Parse the response
            try:
                response = json.loads(result.stdout)
                stdout = response.get("stdout", "")
                stderr = response.get("stderr", "")
                exit_code = response.get("exit_code", result.returncode)
            except json.JSONDecodeError:
                # Fallback if response is not JSON
                stdout = result.stdout
                stderr = result.stderr
                exit_code = result.returncode
            
            # Analyze the execution
            if exit_code == 0 and not stderr:
                return ExecutionResult(
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=exit_code,
                    status=ExecutionStatus.SUCCESS
                )
            else:
                error_type, error_message, traceback = self._analyze_error(stderr)
                return ExecutionResult(
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=exit_code,
                    status=ExecutionStatus.ERROR,
                    error_type=error_type,
                    error_message=error_message,
                    traceback=traceback
                )
                
        except subprocess.TimeoutExpired:
            return ExecutionResult(
                stdout="",
                stderr="Execution timed out",
                exit_code=-1,
                status=ExecutionStatus.TIMEOUT,
                error_type=ErrorType.RUNTIME,
                error_message="Code execution exceeded time limit"
            )
        except Exception as e:
            return ExecutionResult(
                stdout="",
                stderr=str(e),
                exit_code=-1,
                status=ExecutionStatus.ERROR,
                error_type=ErrorType.RUNTIME,
                error_message=f"Failed to execute code: {str(e)}"
            )
    
    def _analyze_error(self, stderr: str) -> tuple[ErrorType, str, str]:
        """
        Analyze error message and categorize the error type
        
        Returns:
            (error_type, error_message, traceback)
        """
        if not stderr:
            return ErrorType.UNKNOWN, "", ""
        
        # Extract the main error message and traceback
        lines = stderr.strip().split('\n')
        traceback = stderr
        
        # Find the last line which usually contains the error type
        error_line = lines[-1] if lines else ""
        
        # Categorize error
        error_patterns = {
            ErrorType.SYNTAX: [r"SyntaxError", r"IndentationError", r"TabError"],
            ErrorType.IMPORT: [r"ModuleNotFoundError", r"ImportError"],
            ErrorType.NAME: [r"NameError"],
            ErrorType.TYPE: [r"TypeError"],
            ErrorType.ATTRIBUTE: [r"AttributeError"],
            ErrorType.INDEX: [r"IndexError"],
            ErrorType.KEY: [r"KeyError"],
            ErrorType.VALUE: [r"ValueError"],
        }
        
        error_type = ErrorType.RUNTIME
        for err_type, patterns in error_patterns.items():
            if any(re.search(pattern, error_line) for pattern in patterns):
                error_type = err_type
                break
        
        # Extract clean error message
        error_message = error_line
        
        return error_type, error_message, traceback
    
    def test_connection(self) -> bool:
        """Test if Docker sandbox is accessible"""
        try:
            test_code = "print('test')"
            result = self.execute(test_code, timeout=5)
            return result.status == ExecutionStatus.SUCCESS
        except Exception:
            return False
