"""
Hybrid debugging orchestrator that combines rule-based and LLM-based approaches
Tries rule-based fixes first, then escalates to LLM agents
"""
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from .models import (
    DebugSession, CodeVersion, Patch, ExecutionResult,
    ExecutionStatus, PatchSource, ErrorType
)
from .sandbox_executor import SandboxExecutor
from .rule_based_patcher import RuleBasedPatcher
from .agents import MultiAgentDebugger


class HybridDebugOrchestrator:
    """
    Main orchestrator that manages the debugging workflow:
    1. Execute code in sandbox
    2. Try rule-based fixes
    3. If rule-based fails, use LLM agents
    4. Track all versions and patches
    5. Repeat until success or max iterations
    """
    
    def __init__(self, llm_model: str = "codellama:7b"):
        self.sandbox = SandboxExecutor()
        self.rule_patcher = RuleBasedPatcher()
        self.llm_debugger = MultiAgentDebugger(model_name=llm_model)
        self.sessions: Dict[str, DebugSession] = {}
    
    async def start_debug_session(
        self,
        code: str,
        max_iterations: int = 10
    ) -> DebugSession:
        """
        Start a new debugging session
        
        Args:
            code: Python code to debug
            max_iterations: Maximum number of fix attempts
            
        Returns:
            DebugSession object with session_id
        """
        session_id = str(uuid.uuid4())
        
        # Create initial session
        session = DebugSession(
            session_id=session_id,
            original_code=code,
            current_version=0,
            max_iterations=max_iterations,
            status="running"
        )
        
        # Create first version
        initial_version = CodeVersion(
            version=0,
            code=code,
            timestamp=datetime.now()
        )
        
        # Execute initial code
        result = self.sandbox.execute(code)
        initial_version.execution_result = result
        
        session.versions.append(initial_version)
        session.traces.append(f"[Session Created] ID: {session_id}")
        session.traces.append(f"[Initial Execution] Status: {result.status.value}")
        
        # Store session
        self.sessions[session_id] = session
        
        # Always run debug loop, even if code executes successfully
        # This catches logical errors, suboptimal code, etc.
        if result.status == ExecutionStatus.SUCCESS:
            session.traces.append("[Analysis] Code executed successfully, but analyzing for logical errors...")
        
        # Return session immediately - debug loop will run separately
        return session
    
    async def run_debug_loop_for_session(self, session_id: str):
        """Run the debug loop for an existing session (for background tasks)"""
        session = self.sessions.get(session_id)
        if session and session.status == "running":
            await self._debug_loop(session)
    
    async def _debug_loop(self, session: DebugSession):
        """
        Main debugging loop:
        1. Analyze current error
        2. Try rule-based fix
        3. If rule-based fails, use LLM
        4. Execute fixed code
        5. Repeat
        """
        while (
            session.current_iteration < session.max_iterations and
            session.status == "running"
        ):
            session.current_iteration += 1
            current_version = session.versions[-1]
            exec_result = current_version.execution_result
            
            # On first iteration, always analyze even if successful
            # On subsequent iterations, stop if successful
            if session.current_iteration > 1 and exec_result and exec_result.status == ExecutionStatus.SUCCESS:
                session.status = "success"
                session.final_code = current_version.code
                session.completed_at = datetime.now()
                session.traces.append(f"[Success] Code fixed in {session.current_iteration - 1} iterations!")
                break
            
            # Log current status
            if exec_result:
                session.traces.append(
                    f"[Iteration {session.current_iteration}] "
                    f"Status: {exec_result.status.value}, "
                    f"Error: {exec_result.error_type.value if exec_result.error_type else 'none'}"
                )
            else:
                session.traces.append(f"[Iteration {session.current_iteration}] No execution result")
            
            # Step 1: Determine strategy
            patch = None
            fixed_code = None
            
            # If first iteration and code runs successfully, always use LLM for analysis
            if session.current_iteration == 1 and exec_result and exec_result.status == ExecutionStatus.SUCCESS:
                session.traces.append("[Strategy] First execution successful - analyzing with LLM for logical errors...")
                patch, fixed_code = await self._llm_fix(
                    current_version.code,
                    exec_result,
                    session.current_version
                )
            # Otherwise, try rule-based fix first
            elif exec_result and exec_result.error_message:
                session.traces.append("[Strategy] Attempting rule-based fix...")
                patch = self.rule_patcher.generate_patch(
                    exec_result.error_message,
                    current_version.code,
                    session.current_version
                )
                if patch:
                    # For rule-based patches, extract fixed code from diff
                    fixed_code = self._apply_patch(current_version.code, patch)
                
                # Step 2: If rule-based fails, use LLM
                if not patch:
                    session.traces.append("[Strategy] Rule-based fix not applicable, using LLM agents...")
                    patch, fixed_code = await self._llm_fix(
                        current_version.code,
                        exec_result,
                        session.current_version
                    )
            else:
                # No error message and not first iteration - shouldn't happen
                session.traces.append("[Warning] No error to fix and not first iteration")
                session.status = "success"
                session.final_code = current_version.code
                session.completed_at = datetime.now()
                break
            
            # Step 3: Apply patch if generated
            if patch and fixed_code:
                session.traces.append(f"[Patch Generated] Source: {patch.source.value}")
                session.traces.append(f"[Reasoning] {patch.reasoning}")
                
                # Use the fixed code directly
                new_code = fixed_code
                patch.applied = True
                session.patches.append(patch)
                
                # Create new version
                new_version = CodeVersion(
                    version=session.current_version + 1,
                    code=new_code,
                    timestamp=datetime.now()
                )
                
                # Execute new version
                session.traces.append(f"[Execution] Testing version {new_version.version}...")
                new_result = self.sandbox.execute(new_code)
                new_version.execution_result = new_result
                
                session.versions.append(new_version)
                session.current_version += 1
                
                # Check if fixed
                if new_result.status == ExecutionStatus.SUCCESS:
                    session.status = "success"
                    session.final_code = new_code
                    session.completed_at = datetime.now()
                    session.traces.append(
                        f"[Success] Code fixed! Final version: {new_version.version}"
                    )
                    break
                else:
                    session.traces.append(
                        f"[Continue] Still has errors, continuing to iteration {session.current_iteration + 1}..."
                    )
            else:
                # No patch generated
                # If this was first iteration with successful code, LLM verified it's correct
                if session.current_iteration == 1 and exec_result and exec_result.status == ExecutionStatus.SUCCESS:
                    session.traces.append("[Analysis Complete] LLM verified code is logically correct")
                    session.status = "success"
                    session.final_code = current_version.code
                    session.completed_at = datetime.now()
                else:
                    session.traces.append("[Failed] Unable to generate patch")
                    session.status = "failed"
                    session.completed_at = datetime.now()
                break
        
        # Check if max iterations reached
        if session.current_iteration >= session.max_iterations and session.status == "running":
            session.status = "max_iterations"
            session.completed_at = datetime.now()
            session.traces.append(
                f"[Max Iterations] Reached maximum of {session.max_iterations} iterations"
            )
    
    async def _llm_fix(
        self,
        code: str,
        exec_result: ExecutionResult,
        version: int
    ) -> tuple[Optional[Patch], Optional[str]]:
        """
        Use LLM agents to generate a fix
        
        Args:
            code: Current code
            exec_result: Execution result with error
            version: Current version number
            
        Returns:
            Tuple of (Patch object or None, fixed_code or None)
        """
        try:
            # Prepare state for LangGraph agents
            initial_state = {
                "code": code,
                "error_message": exec_result.error_message or "",
                "error_type": exec_result.error_type.value if exec_result.error_type else "unknown",
                "traceback": exec_result.traceback or "",
                "execution_result": {
                    "stdout": exec_result.stdout,
                    "stderr": exec_result.stderr,
                    "exit_code": exec_result.exit_code,
                    "status": exec_result.status.value
                },
                "version": version,
                "patches": [],
                "messages": [],
                "current_agent": "",
                "reasoning": "",
                "needs_llm": True,
                "iterations": 0,
                "max_iterations": 1,  # Single pass through agents
                "status": "running",
                "traces": []
            }
            
            # Run the agent graph
            config = {"configurable": {"thread_id": str(uuid.uuid4())}}
            final_state = await self.llm_debugger.graph.ainvoke(initial_state, config)
            
            # Extract the generated patch
            if final_state.get("patches"):
                patch_dict = final_state["patches"][-1]
                
                # Extract fixed code if available
                fixed_code = patch_dict.get("fixed_code", final_state.get("code"))
                
                return Patch(
                    patch_id=patch_dict["patch_id"],
                    version_from=patch_dict["version_from"],
                    version_to=patch_dict["version_to"],
                    source=PatchSource(patch_dict["source"]),
                    reasoning=patch_dict["reasoning"],
                    diff=patch_dict["diff"],
                    applied=False,
                    error_analysis=final_state.get("reasoning", "LLM analyzed the code"),
                    fix_strategy=patch_dict.get("fix_strategy", "Applied LLM-suggested fix"),
                    error_category=final_state.get("error_type", "unknown")
                ), fixed_code
            
            # If no patch in standard format, try to extract fixed code
            if final_state.get("code") and final_state["code"] != code:
                import difflib
                diff = ''.join(difflib.unified_diff(
                    code.splitlines(keepends=True),
                    final_state["code"].splitlines(keepends=True),
                    fromfile='original',
                    tofile='modified',
                    lineterm=''
                ))
                
                patch = Patch(
                    patch_id=str(uuid.uuid4()),
                    version_from=version,
                    version_to=version + 1,
                    source=PatchSource.LLM_PATCH_GENERATOR,
                    reasoning=final_state.get("reasoning", "LLM-generated fix"),
                    diff=diff,
                    applied=False,
                    error_analysis=final_state.get("reasoning", "Analyzed by LLM agents"),
                    fix_strategy="Applied automated code transformation",
                    error_category=final_state.get("error_type", "logic")
                )
                return patch, final_state["code"]
            
        except Exception as e:
            # Log error but don't crash
            print(f"LLM fix error: {e}")
        
        return None, None
    
    def _apply_patch(self, original_code: str, patch: Patch) -> str:
        """
        Apply a patch to code
        
        Since our LLM agents generate complete fixed code, we extract it directly.
        For rule-based patches, we parse the diff.
        """
        # For LLM-generated patches, we need to extract the fixed code
        # The patch diff contains the unified diff format
        
        if not patch.diff:
            return original_code
        
        # Parse unified diff to get the new code
        lines = patch.diff.split('\n')
        new_code_lines = []
        in_content = False
        
        for line in lines:
            if line.startswith('@@'):
                in_content = True
                continue
            if in_content:
                if line.startswith('+') and not line.startswith('+++'):
                    # This is an added line
                    new_code_lines.append(line[1:])
                elif not line.startswith('-') and not line.startswith('\\'):
                    # This is a context line (unchanged)
                    new_code_lines.append(line[1:] if line.startswith(' ') else line)
        
        # If we successfully parsed the diff, return the new code
        if new_code_lines:
            result = '\n'.join(new_code_lines)
            # Clean up any empty trailing lines
            return result.strip() + '\n'
        
        # Fallback: return original if parsing failed
        return original_code
    
    def get_session(self, session_id: str) -> Optional[DebugSession]:
        """Get a debug session by ID"""
        return self.sessions.get(session_id)
    
    def get_session_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get the current status of a debugging session"""
        session = self.get_session(session_id)
        if not session:
            return None
        
        return {
            "session_id": session.session_id,
            "status": session.status,
            "current_version": session.current_version,
            "current_iteration": session.current_iteration,
            "max_iterations": session.max_iterations,
            "total_patches": len(session.patches),
            "latest_trace": session.traces[-1] if session.traces else None
        }
