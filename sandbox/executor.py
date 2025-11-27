import subprocess
import sys
import json
import time
import tempfile
import os
import shutil
from pathlib import Path
from typing import NamedTuple

class ExecutionResult(NamedTuple):
    success: bool
    stdout: str
    stderr: str
    execution_time: float

class CodeExecutor:
    """Docker-based code executor for multiple programming languages"""
    
    def __init__(self, timeout: int = 10, use_docker: bool = True):
        self.timeout = timeout
        self.use_docker = use_docker
        self.docker_image = "multi-lang-executor:latest"
        
        # Language configurations
        self.language_configs = {
            'python': {
                'extension': '.py',
                'compile_cmd': None,
                'run_cmd': ['python', '{filename}'],
                'wrapper': self._python_wrapper
            },
            'cpp': {
                'extension': '.cpp',
                'compile_cmd': ['g++', '-o', '{output}', '{filename}', '-std=c++17'],
                'run_cmd': ['./{output}'],
                'wrapper': self._cpp_wrapper
            },
            'c': {
                'extension': '.c',
                'compile_cmd': ['gcc', '-o', '{output}', '{filename}'],
                'run_cmd': ['./{output}'],
                'wrapper': self._c_wrapper
            },
            'java': {
                'extension': '.java',
                'compile_cmd': ['javac', '{filename}'],
                'run_cmd': ['java', '{classname}'],
                'wrapper': self._java_wrapper
            }
        }
    def _python_wrapper(self, code: str) -> str:
        """Wrap Python code with safety measures"""
        indented_code = '\n'.join('    ' + line if line.strip() else line for line in code.split('\n'))
        
        return f"""import sys
import signal

# Set recursion limit to prevent infinite recursion
sys.setrecursionlimit(1000)

# Timeout handler
def timeout_handler(signum, frame):
    raise TimeoutError("Code execution timeout")

# Set up timeout signal
signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm({self.timeout - 2})

try:
    # User code starts here (indented)
{indented_code}
    
except TimeoutError:
    print("Execution timed out", file=sys.stderr)
    sys.exit(124)
except Exception as e:
    import traceback
    print(f"Error: {{type(e).__name__}}: {{e}}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
finally:
    signal.alarm(0)
"""

    def _cpp_wrapper(self, code: str) -> str:
        """Wrap C++ code with basic includes"""
        return f"""#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <climits>
using namespace std;

{code}
"""

    def _c_wrapper(self, code: str) -> str:
        """Wrap C code with basic includes"""
        return f"""#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>

{code}
"""

    def _java_wrapper(self, code: str) -> str:
        """Wrap Java code in a Main class if needed"""
        if 'class ' in code and 'public static void main' in code:
            return code
        
        return f"""public class Main {{
    public static void main(String[] args) {{
{chr(10).join('        ' + line if line.strip() else line for line in code.split(chr(10)))}
    }}
}}
"""

    def _extract_java_classname(self, code: str) -> str:
        """Extract class name from Java code"""
        lines = code.split('\n')
        for line in lines:
            if 'public class' in line:
                parts = line.strip().split()
                if 'class' in parts:
                    class_idx = parts.index('class')
                    if class_idx + 1 < len(parts):
                        return parts[class_idx + 1].replace('{', '').strip()
        return 'Main'
        """Check if Docker is available and running"""
        try:
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def _check_docker_available(self) -> bool:
        """Check if Docker is available and running"""
        try:
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def _execute_in_docker(self, code: str, language: str = 'python') -> ExecutionResult:
        """Execute code in a Docker container"""
        start_time = time.time()
        
        if language not in self.language_configs:
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Unsupported language: {language}",
                execution_time=0.0
            )
        
        config = self.language_configs[language]
        
        try:
                # Create temporary directory for code execution
            with tempfile.TemporaryDirectory() as temp_dir:
                # Convert Windows path to Unix-style for Docker
                temp_dir_unix = temp_dir.replace('\\', '/')
                if temp_dir_unix[1] == ':':
                    # Convert C:\path to /c/path format for Docker on Windows
                    temp_dir_unix = f"/{temp_dir_unix[0].lower()}{temp_dir_unix[2:]}"
                
                # Prepare code with wrapper
                wrapped_code = config['wrapper'](code)                # Create source file
                if language == 'java':
                    classname = self._extract_java_classname(wrapped_code)
                    filename = f"{classname}.java"
                else:
                    filename = f"usercode{config['extension']}"
                
                code_file = Path(temp_dir) / filename
                code_file.write_text(wrapped_code, encoding='utf-8')
                
                # Prepare Docker command
                docker_cmd = [
                    "docker", "run",
                    "--rm",
                    "--network", "none",
                    "--memory", "512m",
                    "--cpus", "1.0",
                    "--user", "coderunner",  # Use our custom user instead of nobody
                    "-v", f"{temp_dir_unix}:/code:rw",  # Use Unix-style path for Docker
                    "-w", "/code",
                    self.docker_image
                ]
                
                # Add compilation step if needed
                if config['compile_cmd']:
                    output_name = filename.replace(config['extension'], '')
                    if language == 'java':
                        compile_cmd = [cmd.format(filename=filename, output=output_name, classname=classname) 
                                     for cmd in config['compile_cmd']]
                        run_cmd = [cmd.format(filename=filename, output=output_name, classname=classname) 
                                 for cmd in config['run_cmd']]
                    else:
                        compile_cmd = [cmd.format(filename=filename, output=output_name) 
                                     for cmd in config['compile_cmd']]
                        run_cmd = [cmd.format(filename=filename, output=output_name) 
                                 for cmd in config['run_cmd']]
                    
                    # Compile and run
                    full_cmd = docker_cmd + ["bash", "-c", f"{' '.join(compile_cmd)} && {' '.join(run_cmd)}"]
                else:
                    # Direct execution (Python)
                    run_cmd = [cmd.format(filename=filename) for cmd in config['run_cmd']]
                    full_cmd = docker_cmd + run_cmd
                
                # Execute in Docker
                try:
                    print(f"DEBUG: Running command: {' '.join(full_cmd)}")  # Debug output
                    result = subprocess.run(
                        full_cmd,
                        capture_output=True,
                        text=True,
                        timeout=self.timeout + 10  # Extra time for compilation
                    )
                    print(f"DEBUG: Return code: {result.returncode}")  # Debug output
                    print(f"DEBUG: Stdout: {result.stdout[:200]}...")  # Debug output
                    print(f"DEBUG: Stderr: {result.stderr[:200]}...")  # Debug output
                except subprocess.CalledProcessError as e:
                    print(f"DEBUG: CalledProcessError: {e}")
                    execution_time = time.time() - start_time
                    return ExecutionResult(
                        success=False,
                        stdout="",
                        stderr=f"Process error: {e}",
                        execution_time=execution_time
                    )
                
                execution_time = time.time() - start_time
                
                return ExecutionResult(
                    success=(result.returncode == 0),
                    stdout=result.stdout,
                    stderr=result.stderr,
                    execution_time=execution_time
                )
                
        except subprocess.TimeoutExpired:
            execution_time = time.time() - start_time
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Docker execution timed out after {self.timeout} seconds",
                execution_time=execution_time
            )
        except Exception as e:
            execution_time = time.time() - start_time
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Docker execution failed: {str(e)}",
                execution_time=execution_time
            )
    
    def _execute_locally(self, code: str) -> ExecutionResult:
        """Fallback: Execute code locally without Docker"""
        start_time = time.time()
        
        try:
            # Create temporary file for user code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                # Indent all user code to fit inside the try block
                indented_code = '\n'.join('    ' + line if line.strip() else line for line in code.split('\n'))
                
                # Add basic safety limits
                safe_code = f"""import sys

# Set recursion limit to prevent infinite recursion
sys.setrecursionlimit(1000)

try:
    # User code starts here (indented)
{indented_code}
    
except Exception as e:
    import traceback
    print(f"Error: {{type(e).__name__}}: {{e}}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
"""
                f.write(safe_code)
                temp_file = f.name
            
            try:
                # Execute the code
                result = subprocess.run(
                    [sys.executable, temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                    cwd=Path(temp_file).parent  # Run in temp directory
                )
                
                execution_time = time.time() - start_time
                
                return ExecutionResult(
                    success=(result.returncode == 0),
                    stdout=result.stdout,
                    stderr=result.stderr,
                    execution_time=execution_time
                )
                
            except subprocess.TimeoutExpired:
                execution_time = time.time() - start_time
                return ExecutionResult(
                    success=False,
                    stdout="",
                    stderr=f"Execution timed out after {self.timeout} seconds",
                    execution_time=execution_time
                )
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file)
                except OSError:
                    pass
                    
        except Exception as e:
            execution_time = time.time() - start_time
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Execution failed: {str(e)}",
                execution_time=execution_time
            )
    
    def _execute_locally(self, code: str, language: str = 'python') -> ExecutionResult:
        """Fallback: Execute code locally without Docker"""
        start_time = time.time()
        
        if language not in self.language_configs:
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Unsupported language: {language}",
                execution_time=0.0
            )
        
        config = self.language_configs[language]
        
        try:
            # Create temporary file for user code
            with tempfile.TemporaryDirectory() as temp_dir:
                # Prepare code with wrapper
                wrapped_code = config['wrapper'](code)
                
                # Create source file
                if language == 'java':
                    classname = self._extract_java_classname(wrapped_code)
                    filename = f"{classname}.java"
                else:
                    filename = f"usercode{config['extension']}"
                
                code_file = Path(temp_dir) / filename
                code_file.write_text(wrapped_code, encoding='utf-8')
                
                # Change to temp directory for execution
                original_cwd = os.getcwd()
                os.chdir(temp_dir)
                
                try:
                    # Compilation step if needed
                    if config['compile_cmd']:
                        output_name = filename.replace(config['extension'], '')
                        if language == 'java':
                            compile_cmd = [cmd.format(filename=filename, output=output_name, classname=classname) 
                                         for cmd in config['compile_cmd']]
                            run_cmd = [cmd.format(filename=filename, output=output_name, classname=classname) 
                                     for cmd in config['run_cmd']]
                        else:
                            compile_cmd = [cmd.format(filename=filename, output=output_name) 
                                         for cmd in config['compile_cmd']]
                            run_cmd = [cmd.format(filename=filename, output=output_name) 
                                     for cmd in config['run_cmd']]
                        
                        # Compile first
                        compile_result = subprocess.run(
                            compile_cmd,
                            capture_output=True,
                            text=True,
                            timeout=self.timeout
                        )
                        
                        if compile_result.returncode != 0:
                            execution_time = time.time() - start_time
                            return ExecutionResult(
                                success=False,
                                stdout=compile_result.stdout,
                                stderr=f"Compilation failed:\n{compile_result.stderr}",
                                execution_time=execution_time
                            )
                        
                        # Run the compiled program
                        result = subprocess.run(
                            run_cmd,
                            capture_output=True,
                            text=True,
                            timeout=self.timeout
                        )
                    else:
                        # Direct execution (Python)
                        run_cmd = [cmd.format(filename=filename) for cmd in config['run_cmd']]
                        result = subprocess.run(
                            run_cmd,
                            capture_output=True,
                            text=True,
                            timeout=self.timeout
                        )
                    
                    execution_time = time.time() - start_time
                    
                    return ExecutionResult(
                        success=(result.returncode == 0),
                        stdout=result.stdout,
                        stderr=result.stderr,
                        execution_time=execution_time
                    )
                    
                finally:
                    os.chdir(original_cwd)
                
        except subprocess.TimeoutExpired:
            execution_time = time.time() - start_time
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Execution timed out after {self.timeout} seconds",
                execution_time=execution_time
            )
        except Exception as e:
            execution_time = time.time() - start_time
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Execution failed: {str(e)}",
                execution_time=execution_time
            )
    
    def execute_code(self, code: str, language: str = 'python') -> ExecutionResult:
        """Execute code in the specified language, preferring Docker if available"""
        
        # For now, let's try a simple test first
        if language == 'python' and self.use_docker and self._check_docker_available():
            try:
                # Simple test - run Python directly
                start_time = time.time()
                result = subprocess.run(
                    ["docker", "run", "--rm", self.docker_image, "python", "-c", code],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout
                )
                execution_time = time.time() - start_time
                
                return ExecutionResult(
                    success=(result.returncode == 0),
                    stdout=result.stdout,
                    stderr=result.stderr,
                    execution_time=execution_time
                )
            except Exception as e:
                print(f"Simple Docker test failed: {e}")
        
        # Try Docker first if enabled and available
        if self.use_docker and self._check_docker_available():
            try:
                return self._execute_in_docker(code, language)
            except Exception as e:
                # If Docker fails, fall back to local execution
                print(f"Docker execution failed, falling back to local: {e}")
        
        # Fallback to local execution
        return self._execute_locally(code, language)

# Legacy functions for backward compatibility
def limit_resources():
    """Placeholder for Unix resource limits (not available on Windows)"""
    pass

def set_recursion_limit():
    """Set Python recursion limit"""
    sys.setrecursionlimit(1000)

def run():
    """Legacy run function"""
    data = json.loads(sys.stdin.read())
    code = data["code"]
    
    executor = CodeExecutor()
    result = executor.execute_code(code)
    
    output = {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "exit_code": 0 if result.success else -1,
        "execution_time": result.execution_time
    }
    
    print(json.dumps(output))

if __name__ == "__main__":
    run()
