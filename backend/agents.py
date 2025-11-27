"""LangGraph multi-agent debugging system"""
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver
from langchain_ollama import ChatOllama
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from operator import add
import json

from .models import ErrorType, Patch, PatchSource, ExecutionResult
from .sandbox_executor import SandboxExecutor
from .rule_based_patcher import RuleBasedPatcher
import uuid
import difflib
from langchain_groq import ChatGroq

class DebugState(TypedDict):
    """State for the debugging agent system"""
    code: str
    error_message: str
    error_type: str
    traceback: str
    execution_result: dict
    version: int
    patches: list[dict]
    messages: Annotated[Sequence[BaseMessage], add]
    current_agent: str
    reasoning: str
    needs_llm: bool
    iterations: int
    max_iterations: int
    status: str  # "running", "success", "failed"
    traces: list[str]


class MultiAgentDebugger:
    """Multi-agent system for code debugging using LangGraph"""
    
    def __init__(self, model_name: str = "codellama:7b", temperature: float = 0.1):
        self.llm = ChatGroq(
            model_name="llama-3.3-70b-versatile",
            temperature=0.7
        )
        self.sandbox = SandboxExecutor()
        self.rule_patcher = RuleBasedPatcher()
        self.checkpointer = MemorySaver()
        
        # Build the agent graph
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph multi-agent system"""
        workflow = StateGraph(DebugState)
        
        # Add agent nodes
        workflow.add_node("error_interpreter", self._error_interpreter_agent)
        workflow.add_node("patch_generator", self._patch_generator_agent)
        workflow.add_node("validator", self._validator_agent)
        workflow.add_node("test_creator", self._test_creator_agent)
        workflow.add_node("refactor", self._refactor_agent)
        workflow.add_node("explainer", self._explainer_agent)
        
        # Define the flow
        workflow.add_edge(START, "error_interpreter")
        workflow.add_edge("error_interpreter", "patch_generator")
        workflow.add_edge("patch_generator", "validator")
        
        # Conditional edges
        workflow.add_conditional_edges(
            "validator",
            self._should_continue,
            {
                "test_creator": "test_creator",
                "refactor": "refactor",
                "explainer": "explainer",
                "end": END
            }
        )
        
        workflow.add_edge("test_creator", "explainer")
        workflow.add_edge("refactor", "explainer")
        workflow.add_edge("explainer", END)
        
        return workflow.compile(checkpointer=self.checkpointer)
    
    def _error_interpreter_agent(self, state: DebugState) -> dict:
        """Agent that interprets and categorizes errors"""
        
        # Check if this is successful execution that needs logical analysis
        is_successful = state.get('execution_result', {}).get('status') == 'success'
        
        if is_successful:
            trace = f"[Error Interpreter] Analyzing successful code for logical errors"
            
            prompt = f"""You are an expert Python code reviewer. This code executed successfully but may have logical errors or issues.

CODE THAT WAS EXECUTED:
```python
{state['code']}
```

EXECUTION OUTPUT:
Stdout: {state.get('execution_result', {}).get('stdout', '')}
Stderr: {state.get('execution_result', {}).get('stderr', '')}
Exit Code: {state.get('execution_result', {}).get('exit_code', 0)}

=== LOGICAL ERROR ANALYSIS ===

Analyze this code for:

1. ALGORITHM ERRORS:
   - Binary search: Check loop condition (should be 'while low <= high', not 'while low < high')
   - Binary search: Check mid updates (should be 'low = mid + 1' and 'high = mid - 1', not 'low = mid' or 'high = mid')
   - Sorting: Check comparison operators and swap logic
   - Recursion: Check base cases and recursive calls

2. EDGE CASES:
   - Empty arrays/lists not handled
   - Single element arrays not tested
   - Negative numbers or zero not considered
   - Off-by-one errors in boundaries

3. WRONG OUTPUT:
   - Function returns wrong value type
   - Function returns None when it should return a value
   - No output when output is expected
   - Wrong calculation or logic

4. INCOMPLETE IMPLEMENTATION:
   - Function defined but never called
   - Missing test cases or examples
   - Incomplete logic branches

5. CODE THAT RUNS BUT IS INCORRECT:
   - Loop that doesn't cover all elements
   - Wrong comparison operators (< vs <=, > vs >=)
   - Wrong arithmetic operations
   - Logic errors that don't crash but produce wrong results

Your Analysis:
1. Does this code have logical errors? [YES/NO]
2. If YES, what is wrong? [specific issue]
3. What is the correct implementation? [brief description]
4. Severity: [CRITICAL/MEDIUM/LOW/NONE]

If the code is logically correct and complete, respond with "NONE - Code is correct".
"""
        else:
            trace = f"[Error Interpreter] Analyzing error: {state['error_type']}"
            
            prompt = f"""You are an expert Python debugger. Analyze this execution error with precision.

CODE THAT WAS EXECUTED:
```python
{state['code']}
```

EXECUTION RESULT:
Error Type: {state['error_type']}
Error Message: {state['error_message']}

Full Traceback:
{state['traceback']}

=== ERROR CATEGORY ANALYSIS ===

Identify which category this error belongs to:

1. SYNTAX ERRORS (SyntaxError, IndentationError):
   - Missing colons after if/for/while/def/class
   - Wrong indentation levels
   - Missing/extra parentheses
   - Python 2 vs 3 syntax (print statements)
   - Typos in keywords

2. NAME ERRORS (NameError, UnboundLocalError):
   - Undefined variables
   - Misspelled variable names
   - Using variable before assignment
   - Missing imports

3. TYPE ERRORS (TypeError):
   - Wrong argument types (str + int)
   - Wrong number of arguments
   - Unsupported operations between types
   - List vs string operations

4. INDEX ERRORS (IndexError):
   - Array/list index out of range
   - Off-by-one errors in loops
   - Wrong loop bounds (range issues)
   - Empty list access

5. VALUE ERRORS (ValueError):
   - Invalid int() conversion
   - Wrong input format
   - Invalid function parameters

6. LOGICAL ERRORS (Wrong output, no crash):
   - Wrong algorithm implementation
   - Incorrect loop direction
   - Wrong return values
   - Missing edge cases

7. RECURSION ERRORS (RecursionError):
   - Missing base case
   - Wrong recursive parameters
   - Infinite recursion

8. RUNTIME ERRORS:
   - ZeroDivisionError
   - AttributeError (wrong object method)
   - KeyError (missing dict key)
   - FileNotFoundError

Your Analysis:
1. Error Category: [specify from above]
2. Exact Line Number: [line that caused error]
3. Root Cause: [why error occurred]
4. Minimal Fix: [what exact change is needed]

Be specific and concise. Focus on the ACTUAL error, not hypothetical issues."""

        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        reasoning = response.content
        
        return {
            "messages": messages + [response],
            "current_agent": "error_interpreter",
            "reasoning": reasoning,
            "traces": state.get("traces", []) + [trace]
        }
    
    def _patch_generator_agent(self, state: DebugState) -> dict:
        """Agent that generates code patches"""
        trace = f"[Patch Generator] Generating patch for version {state['version']}"
        
        # Check if analyzing successful code for logical errors
        is_successful = state.get('execution_result', {}).get('status') == 'success'
        
        if is_successful:
            prompt = f"""You are a precise Python code fixer. Fix logical errors in this code that executed successfully but has bugs.

ORIGINAL CODE (executed successfully but has logical errors):
```python
{state['code']}
```

EXECUTION OUTPUT:
{state.get('execution_result', {}).get('stdout', '')}

LOGICAL ERROR ANALYSIS:
{state['reasoning']}

=== FIX STRATEGIES FOR LOGICAL ERRORS ===

1. BINARY SEARCH FIXES:
   - Change 'while low < high' to 'while low <= high'
   - Change 'low = mid' to 'low = mid + 1'
   - Change 'high = mid' to 'high = mid - 1'
   - Ensure all elements can be found (not just middle elements)

2. LOOP CONDITION FIXES:
   - Use <= instead of < when including endpoint
   - Use >= instead of > when including startpoint
   - Fix range() to cover all elements: range(len(arr)) not range(len(arr)-1)

3. RECURSION FIXES:
   - Add base case at start of function
   - Ensure base case is reached
   - Fix recursive parameters to progress toward base case

4. RETURN VALUE FIXES:
   - Replace print() with return when function should return value
   - Add return statement if missing
   - Fix return value type

5. FUNCTION CALL FIXES:
   - Add function call if only definition exists
   - Add test case with sample data
   - Print the result

=== STRICT RULES ===
1. Fix the logical error identified in the analysis
2. Make MINIMAL changes
3. Keep all other code unchanged
4. Return ONLY valid Python code
5. Do NOT add comments or explanations
6. If function is only defined, add a test call at the end

FIXED CODE:"""
        else:
            prompt = f"""You are a precise Python code fixer. Fix ONLY the specific error with MINIMAL changes.

ORIGINAL CODE (that failed):
```python
{state['code']}
```

ERROR THAT OCCURRED:
{state['error_message']}

TRACEBACK:
{state['traceback']}

ERROR ANALYSIS:
{state['reasoning']}

=== FIX STRATEGIES BY ERROR TYPE ===

1. SYNTAX ERRORS:
   - Add missing colons after if/for/while/def/class
   - Fix indentation (use 4 spaces)
   - Add missing parentheses
   - Convert print statements to print() functions

2. NAME ERRORS:
   - Check for typos (ture→True, fasle→False)
   - Add missing variable initialization
   - Add missing imports (only if NameError/ImportError)

3. TYPE ERRORS:
   - Add str() around integers for string concat
   - Add int() for float→int conversions
   - Fix function arguments

4. INDEX ERRORS:
   - Add bounds check: if i < len(arr)
   - Fix range(): use len(arr) not len(arr)+1
   - Check for empty lists before access

5. VALUE ERRORS:
   - Wrap int() in try-except ValueError
   - Add input validation

6. LOGICAL ERRORS:
   - Fix algorithm logic
   - Correct loop conditions
   - Fix return values

7. RECURSION ERRORS:
   - Add base case: if n <= 0: return ...
   - Fix recursive call parameters

8. RUNTIME ERRORS:
   - ZeroDivisionError: Add if b != 0 check
   - AttributeError: Fix method name or object type
   - KeyError: Use dict.get(key, default)

=== STRICT RULES ===
1. Fix ONLY the line(s) that caused the error
2. Do NOT add imports unless error is ImportError/ModuleNotFoundError
3. Do NOT add new features or functionality
4. Do NOT modify working code
5. Make the MINIMAL change needed
6. Return ONLY valid Python code
7. Do NOT add comments or explanations
8. Keep all working parts of code unchanged

FIXED CODE:"""

        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        # Extract code from response
        fixed_code = self._extract_code(response.content, state['code'])
        
        # Generate diff
        diff = self._generate_diff(state['code'], fixed_code)
        
        patch = {
            "patch_id": str(uuid.uuid4()),
            "version_from": state['version'],
            "version_to": state['version'] + 1,
            "source": PatchSource.LLM_PATCH_GENERATOR.value,
            "reasoning": f"LLM-generated patch based on error analysis",
            "diff": diff,
            "applied": False,
            "fixed_code": fixed_code  # Store the complete fixed code
        }
        
        return {
            "code": fixed_code,
            "version": state['version'] + 1,
            "patches": state.get("patches", []) + [patch],
            "messages": messages + [response],
            "current_agent": "patch_generator",
            "traces": state.get("traces", []) + [trace]
        }
    
    def _validator_agent(self, state: DebugState) -> dict:
        """Agent that validates the patched code"""
        trace = f"[Validator] Validating patched code version {state['version']}"
        
        # Execute the patched code
        result = self.sandbox.execute(state['code'])
        
        execution_dict = {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.exit_code,
            "status": result.status.value
        }
        
        if result.status.value == "success":
            status = "success"
            trace += " - PASSED ✓"
        else:
            status = "running"
            trace += " - FAILED ✗"
            # Update error information for next iteration
            return {
                "execution_result": execution_dict,
                "error_message": result.error_message or "",
                "error_type": result.error_type.value if result.error_type else "unknown",
                "traceback": result.traceback or "",
                "current_agent": "validator",
                "status": status,
                "iterations": state.get("iterations", 0) + 1,
                "traces": state.get("traces", []) + [trace]
            }
        
        return {
            "execution_result": execution_dict,
            "current_agent": "validator",
            "status": status,
            "traces": state.get("traces", []) + [trace]
        }
    
    def _test_creator_agent(self, state: DebugState) -> dict:
        """Agent that creates test cases for the fixed code"""
        trace = f"[Test Creator] Generating test cases"
        
        prompt = f"""You are an expert at writing Python tests. Create simple test cases for this code.

Code:
```python
{state['code']}
```

Generate 2-3 simple test cases that verify the code works correctly.
Format: Just provide the test code, no explanations."""

        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        return {
            "messages": messages + [response],
            "current_agent": "test_creator",
            "traces": state.get("traces", []) + [trace]
        }
    
    def _refactor_agent(self, state: DebugState) -> dict:
        """Agent that refactors and optimizes the fixed code"""
        trace = f"[Refactor] Optimizing code"
        
        prompt = f"""You are an expert at code refactoring. Improve this working code.

Code:
```python
{state['code']}
```

Make the code more:
- Readable
- Pythonic
- Efficient

Provide ONLY the refactored code, no explanations."""

        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        refactored_code = self._extract_code(response.content, state['code'])
        
        return {
            "code": refactored_code,
            "messages": messages + [response],
            "current_agent": "refactor",
            "traces": state.get("traces", []) + [trace]
        }
    
    def _explainer_agent(self, state: DebugState) -> dict:
        """Agent that generates human-readable explanations"""
        trace = f"[Explainer] Generating explanation"
        
        prompt = f"""You are an expert at explaining code changes. Summarize what was fixed.

Original Error: {state['error_message']}
Number of patches applied: {len(state.get('patches', []))}
Final Status: {state['status']}

Provide a clear, concise summary of:
1. What was wrong
2. What was fixed
3. Why the fix works

Keep it under 100 words."""

        messages = [HumanMessage(content=prompt)]
        response = self.llm.invoke(messages)
        
        return {
            "messages": messages + [response],
            "current_agent": "explainer",
            "reasoning": state.get("reasoning", "") + "\n\n" + response.content,
            "traces": state.get("traces", []) + [trace]
        }
    
    def _should_continue(self, state: DebugState) -> str:
        """Decide which agent to call next"""
        # If successful, move to explainer
        if state.get("status") == "success":
            return "explainer"
        
        # If max iterations reached, explain and end
        if state.get("iterations", 0) >= state.get("max_iterations", 10):
            return "explainer"
        
        # If still running and within iterations, continue with error interpreter
        # (This will restart the loop)
        return "end"
    
    def _extract_code(self, response: str, fallback: str) -> str:
        """Extract Python code from LLM response"""
        # Try to extract code from markdown code blocks
        import re
        
        # Pattern for ```python ... ``` or ``` ... ```
        patterns = [
            r'```python\n(.*?)\n```',
            r'```\n(.*?)\n```',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, response, re.DOTALL)
            if match:
                return match.group(1).strip()
        
        # If no code block found, assume entire response is code
        # Remove common non-code prefixes
        lines = response.strip().split('\n')
        code_lines = []
        in_code = False
        
        for line in lines:
            # Skip explanation lines
            if any(line.startswith(prefix) for prefix in ['Here', 'The', 'This', 'I ', 'Fixed']):
                continue
            if line.strip():
                in_code = True
            if in_code:
                code_lines.append(line)
        
        if code_lines:
            return '\n'.join(code_lines)
        
        return fallback
    
    def _generate_diff(self, original: str, modified: str) -> str:
        """Generate unified diff"""
        diff = difflib.unified_diff(
            original.splitlines(keepends=True),
            modified.splitlines(keepends=True),
            fromfile='original',
            tofile='modified',
            lineterm=''
        )
        return ''.join(diff)
