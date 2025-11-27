"""
FastAPI backend server for the debugging sandbox
Provides REST API endpoints for the frontend
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models import (
    CodeSubmission, SessionResponse, DebugSession,
    CodeVersion, Patch
)
from backend.orchestrator import HybridDebugOrchestrator

app = FastAPI(
    title="AI Debugging Sandbox API",
    description="Local AI-Supervised Autonomous Debugging System",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global orchestrator instance
orchestrator = HybridDebugOrchestrator(llm_model="codellama:7b")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Debugging Sandbox API",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/api/debug", response_model=SessionResponse)
async def submit_code(submission: CodeSubmission, background_tasks: BackgroundTasks):
    """
    Submit code for debugging
    
    Returns immediately with session_id, debugging happens in background
    """
    try:
        # Validate code is not empty
        if not submission.code.strip():
            raise HTTPException(status_code=400, detail="Code cannot be empty")
        
        # Create the debug session (returns immediately)
        session = await orchestrator.start_debug_session(
            code=submission.code,
            max_iterations=submission.max_iterations
        )
        
        # If session needs debugging, start the loop in background
        if session.status == "running":
            background_tasks.add_task(
                orchestrator.run_debug_loop_for_session,
                session.session_id
            )
        
        return SessionResponse(
            session_id=session.session_id,
            status=session.status,
            message=f"Debugging session started. Current status: {session.status}"
        )
    
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error starting debug session: {str(e)}")


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """
    Get complete session information including all versions and patches
    """
    session = orchestrator.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Serialize versions
    versions = []
    for version in session.versions:
        version_data = {
            "version": version.version,
            "code": version.code,
            "timestamp": version.timestamp.isoformat(),
            "execution_result": None
        }
        
        if version.execution_result:
            version_data["execution_result"] = {
                "stdout": version.execution_result.stdout,
                "stderr": version.execution_result.stderr,
                "exit_code": version.execution_result.exit_code,
                "status": version.execution_result.status.value,
                "error_type": version.execution_result.error_type.value if version.execution_result.error_type else None,
                "error_message": version.execution_result.error_message,
                "traceback": version.execution_result.traceback
            }
        
        versions.append(version_data)
    
    # Serialize patches
    patches = []
    for patch in session.patches:
        patches.append({
            "patch_id": patch.patch_id,
            "version_from": patch.version_from,
            "version_to": patch.version_to,
            "source": patch.source.value,
            "reasoning": patch.reasoning,
            "diff": patch.diff,
            "applied": patch.applied,
            "timestamp": patch.timestamp.isoformat(),
            "error_analysis": patch.error_analysis,
            "fix_strategy": patch.fix_strategy,
            "error_category": patch.error_category
        })
    
    return {
        "session_id": session.session_id,
        "status": session.status,
        "original_code": session.original_code,
        "final_code": session.final_code,
        "current_version": session.current_version,
        "current_iteration": session.current_iteration,
        "max_iterations": session.max_iterations,
        "created_at": session.created_at.isoformat(),
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        "versions": versions,
        "patches": patches,
        "traces": session.traces
    }


@app.get("/api/session/{session_id}/status")
async def get_session_status(session_id: str):
    """
    Get quick status of a session (for polling)
    """
    status = orchestrator.get_session_status(session_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return status


@app.get("/api/session/{session_id}/versions")
async def get_versions(session_id: str):
    """
    Get all code versions with execution results
    """
    session = orchestrator.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    versions = []
    for version in session.versions:
        version_data = {
            "version": version.version,
            "code": version.code,
            "timestamp": version.timestamp.isoformat(),
            "execution_result": None
        }
        
        if version.execution_result:
            version_data["execution_result"] = {
                "stdout": version.execution_result.stdout,
                "stderr": version.execution_result.stderr,
                "exit_code": version.execution_result.exit_code,
                "status": version.execution_result.status.value,
                "error_type": version.execution_result.error_type.value if version.execution_result.error_type else None,
                "error_message": version.execution_result.error_message,
                "traceback": version.execution_result.traceback
            }
        
        versions.append(version_data)
    
    return {
        "session_id": session_id,
        "versions": versions
    }


@app.get("/api/session/{session_id}/version/{version_number}")
async def get_version(session_id: str, version_number: int):
    """
    Get a specific code version
    """
    session = orchestrator.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if version_number < 0 or version_number >= len(session.versions):
        raise HTTPException(status_code=404, detail="Version not found")
    
    version = session.versions[version_number]
    
    return {
        "version": version.version,
        "code": version.code,
        "timestamp": version.timestamp.isoformat(),
        "execution_result": {
            "stdout": version.execution_result.stdout,
            "stderr": version.execution_result.stderr,
            "exit_code": version.execution_result.exit_code,
            "status": version.execution_result.status.value,
            "error_type": version.execution_result.error_type.value if version.execution_result.error_type else None,
            "error_message": version.execution_result.error_message,
        } if version.execution_result else None
    }


@app.get("/api/session/{session_id}/patches")
async def get_patches(session_id: str):
    """
    Get all patches applied in the session
    """
    session = orchestrator.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    patches = []
    for patch in session.patches:
        patches.append({
            "patch_id": patch.patch_id,
            "version_from": patch.version_from,
            "version_to": patch.version_to,
            "source": patch.source.value,
            "reasoning": patch.reasoning,
            "diff": patch.diff,
            "applied": patch.applied,
            "timestamp": patch.timestamp.isoformat()
        })
    
    return {
        "session_id": session_id,
        "patches": patches
    }


@app.get("/api/session/{session_id}/diff/{version_from}/{version_to}")
async def get_version_diff(session_id: str, version_from: int, version_to: int):
    """
    Get diff between two versions
    """
    session = orchestrator.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if version_from < 0 or version_from >= len(session.versions):
        raise HTTPException(status_code=404, detail="Version 'from' not found")
    
    if version_to < 0 or version_to >= len(session.versions):
        raise HTTPException(status_code=404, detail="Version 'to' not found")
    
    import difflib
    
    code_from = session.versions[version_from].code
    code_to = session.versions[version_to].code
    
    diff = ''.join(difflib.unified_diff(
        code_from.splitlines(keepends=True),
        code_to.splitlines(keepends=True),
        fromfile=f'version_{version_from}',
        tofile=f'version_{version_to}',
        lineterm=''
    ))
    
    return {
        "session_id": session_id,
        "version_from": version_from,
        "version_to": version_to,
        "diff": diff,
        "code_from": code_from,
        "code_to": code_to
    }


@app.get("/api/session/{session_id}/traces")
async def get_traces(session_id: str):
    """
    Get all execution traces and logs
    """
    session = orchestrator.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "traces": session.traces
    }


@app.get("/api/sessions")
async def list_sessions():
    """
    List all debugging sessions
    """
    sessions = []
    for session_id, session in orchestrator.sessions.items():
        sessions.append({
            "session_id": session.session_id,
            "status": session.status,
            "created_at": session.created_at.isoformat(),
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "current_iteration": session.current_iteration,
            "max_iterations": session.max_iterations
        })
    
    return {
        "total": len(sessions),
        "sessions": sessions
    }


@app.post("/api/execute")
async def execute_code(code_submission: CodeSubmission):
    """
    Execute arbitrary code in the specified language and return results
    """
    from sandbox.executor import CodeExecutor
    
    try:
        # Use Docker-based execution with custom image
        executor = CodeExecutor(timeout=10, use_docker=True)
        executor.docker_image = "multi-lang-executor:latest"  # Use our multi-language image
        result = executor.execute_code(code_submission.code, code_submission.language)
        
        return {
            "success": True,
            "language": code_submission.language,
            "result": {
                "status": "success" if result.success else "error",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "execution_time": result.execution_time
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "language": code_submission.language,
            "result": {
                "status": "error",
                "stdout": "",
                "stderr": str(e),
                "execution_time": 0.0
            }
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
