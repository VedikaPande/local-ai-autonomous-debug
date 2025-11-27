#!/usr/bin/env python3
"""
Verification script to check all dependencies and services
Run this before starting the system to ensure everything is set up correctly
"""
import sys
import subprocess
import json
from pathlib import Path

def check_command(cmd, name, version_flag="--version"):
    """Check if a command exists and is accessible"""
    try:
        result = subprocess.run(
            [cmd, version_flag],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print(f"✅ {name}: {result.stdout.strip().split()[0]}")
            return True
        else:
            print(f"❌ {name}: Command failed")
            return False
    except FileNotFoundError:
        print(f"❌ {name}: Not found")
        return False
    except Exception as e:
        print(f"⚠️  {name}: Error - {str(e)}")
        return False


def check_docker_running():
    """Check if Docker daemon is running"""
    try:
        result = subprocess.run(
            ["docker", "ps"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print("✅ Docker: Running")
            return True
        else:
            print("❌ Docker: Not running (start Docker Desktop)")
            return False
    except Exception as e:
        print(f"❌ Docker: Error - {str(e)}")
        return False


def check_docker_image():
    """Check if sandbox container image exists"""
    try:
        result = subprocess.run(
            ["docker", "images", "-q", "sandbox-container"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.stdout.strip():
            print("✅ Docker Image: sandbox-container exists")
            return True
        else:
            print("❌ Docker Image: sandbox-container not found")
            print("   Run: cd sandbox && docker build -t sandbox-container .")
            return False
    except Exception as e:
        print(f"❌ Docker Image: Error - {str(e)}")
        return False


def check_ollama_service():
    """Check if Ollama is running"""
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama: Service running")
            return True
        else:
            print("❌ Ollama: Service not responding")
            return False
    except Exception as e:
        print("❌ Ollama: Not accessible")
        print("   Run: ollama serve")
        return False


def check_ollama_model():
    """Check if required model is available"""
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            data = response.json()
            models = [m.get("name", "") for m in data.get("models", [])]
            if any("codellama:7b" in m for m in models):
                print("✅ Ollama Model: codellama:7b available")
                return True
            else:
                print("❌ Ollama Model: codellama:7b not found")
                print("   Run: ollama pull codellama:7b")
                return False
    except Exception as e:
        print(f"⚠️  Ollama Model: Cannot check - {str(e)}")
        return False


def check_python_packages():
    """Check if Python packages are installed"""
    try:
        import langchain
        import langgraph
        import fastapi
        import uvicorn
        print("✅ Python Packages: All required packages installed")
        return True
    except ImportError as e:
        print(f"❌ Python Packages: Missing - {str(e)}")
        print("   Run: uv sync")
        return False


def check_node_modules():
    """Check if Node modules are installed"""
    frontend_path = Path(__file__).parent / "frontend" / "node_modules"
    if frontend_path.exists():
        print("✅ Node Modules: Installed")
        return True
    else:
        print("❌ Node Modules: Not installed")
        print("   Run: cd frontend && npm install")
        return False


def check_sandbox_test():
    """Test the Docker sandbox with a simple execution"""
    try:
        test_payload = json.dumps({"code": "print(1+1)"})
        cmd = f'echo \'{test_payload}\' | docker run --rm -i sandbox-container'
        
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if response.get("stdout", "").strip() == "2":
                print("✅ Sandbox Test: Passed")
                return True
        
        print("❌ Sandbox Test: Failed")
        return False
    except Exception as e:
        print(f"❌ Sandbox Test: Error - {str(e)}")
        return False


def check_file_structure():
    """Check if key files exist"""
    base_path = Path(__file__).parent
    required_files = [
        "backend/server.py",
        "backend/orchestrator.py",
        "backend/agents.py",
        "backend/models.py",
        "backend/sandbox_executor.py",
        "backend/rule_based_patcher.py",
        "frontend/src/App.jsx",
        "frontend/package.json",
        "sandbox/Dockerfile",
        "sandbox/executor.py",
    ]
    
    all_exist = True
    for file in required_files:
        file_path = base_path / file
        if file_path.exists():
            continue
        else:
            print(f"❌ Missing: {file}")
            all_exist = False
    
    if all_exist:
        print("✅ File Structure: All key files present")
    return all_exist


def main():
    print("=" * 60)
    print("🔍 AI Debugging Sandbox - System Verification")
    print("=" * 60)
    print()
    
    checks = {
        "Python": lambda: check_command("python", "Python"),
        "UV": lambda: check_command("uv", "UV Package Manager"),
        "Node.js": lambda: check_command("node", "Node.js"),
        "NPM": lambda: check_command("npm", "NPM"),
        "Docker": lambda: check_command("docker", "Docker"),
        "Docker Running": check_docker_running,
        "Docker Image": check_docker_image,
        "Ollama": lambda: check_command("ollama", "Ollama"),
        "Ollama Service": check_ollama_service,
        "Ollama Model": check_ollama_model,
        "Python Packages": check_python_packages,
        "Node Modules": check_node_modules,
        "File Structure": check_file_structure,
        "Sandbox Test": check_sandbox_test,
    }
    
    results = {}
    print("Running checks...")
    print("-" * 60)
    
    for name, check_func in checks.items():
        results[name] = check_func()
    
    print()
    print("=" * 60)
    print("📊 Summary")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 All checks passed! System is ready.")
        print("\n🚀 Start the system with:")
        print("   Windows: .\\start.bat")
        print("   Linux/Mac: ./start.sh")
        print("   Manual: See QUICKSTART.md")
        return 0
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        print("\n📖 See QUICKSTART.md for detailed setup instructions.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
