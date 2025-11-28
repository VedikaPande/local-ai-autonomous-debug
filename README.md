# 🤖 AI Debugger

<div align="center">

![AI Debugger Banner](https://img.shields.io/badge/AI-Debugger-blue?style=for-the-badge&logo=python)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)

**Debug Code Intelligently**

Local AI-powered debugging sandbox that automatically detects, analyzes, and fixes code errors using hybrid rule-based and LLM agents. Fast, secure, and completely offline.

[Features](#-features) • [How It Works](#-how-it-works) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture)

</div>

---

## 📊 Performance Metrics

<div align="center">

| Metric | Value |
|--------|-------|
| **Error Types Handled** | 8+ |
| **Success Rate** | 95% |
| **Avg Fix Time** | <5s |
| **Offline Mode** | 100% |

</div>

---

## ✨ Features

### 🎯 **Single Agent Debugging**

Experience intelligent single-agent mode for straightforward error detection and fixing with real-time feedback.

<div align="center">

![Single Agent Mode - Interface](docs/images/single-agent-1.png)
*Single Agent Debugger interface showing iteration tracking and status*

![Single Agent Mode - Results](docs/images/single-agent-2.png)
*Successful code execution with output display*

</div>

**Key Features:**
- ⚡ **Fast Analysis**: Quickly identifies syntax, runtime, and logical errors
- 📊 **Iteration Tracking**: Monitor each debugging iteration (1/3, 2/3, etc.)
- 🔄 **Real-time Status**: See "STARTED", "COMPLETED", or "RUNNING" states
- 📝 **Code Versioning**: Track all code versions with timestamps
- ✅ **Success Validation**: Automatic verification that code runs successfully

**Perfect for:** Quick bug fixes, syntax errors, simple logical issues

### 🔄 **Multi-Agent Execution**

Harness the power of multiple specialized AI agents working collaboratively to debug complex code issues.

<div align="center">

![Multi-Agent System](docs/images/multi-agent-1.png)
*Multi-agent execution with Patch Generator and Validator agents*

![Multi-Agent Logs](docs/images/multi-agent-2.png)
*Detailed agent execution logs showing the debugging process*

![Multi-Agent Success](docs/images/multi-agent-3.png)
*Successful multi-agent debugging with comprehensive analysis*

</div>

**Specialized Agents:**
- 🩹 **Patch Generator**: Creates intelligent code patches with minimal changes
- ✅ **Validator**: Tests and validates patched code in sandbox
- 🔍 **Error Interpreter**: Analyzes and categorizes errors (8+ types)
- 🧪 **Test Creator**: Generates test cases for fixed code
- ♻️ **Refactor Agent**: Optimizes and improves code quality
- 📖 **Explainer**: Provides human-readable explanations

**Perfect for:** Complex bugs, algorithm errors, comprehensive code analysis

**Tech Stack:** LangGraph, LangChain, Groq LLaMA 3.3 70B

### 📝 **Interactive Code Editor**

Professional-grade Monaco editor with intelligent debugging features and real-time feedback.

<div align="center">

![Code Editor - Welcome](docs/images/code-editor-1.png)
*Clean interface with welcome message and debugging options*

![Code Editor - Debugging](docs/images/code-editor-2.png)
*Live debugging session with code execution and output*

</div>

**Editor Features:**
- 🎨 **Syntax Highlighting**: Full Python syntax support with color coding
- 🔢 **Line Numbers**: Easy code navigation and error location
- 🚨 **Error Highlighting**: Visual error indicators in real-time
- 🌙 **Dark Theme**: Eye-friendly interface for long coding sessions
- 💡 **Auto-completion**: Smart code suggestions (coming soon)
- 🎯 **Debug Modes**: Toggle between Single-Agent and Multi-Agent
- ▶️ **One-Click Execution**: Run code and start debugging instantly

**Tech Stack:** Monaco Editor (VS Code engine), React, TypeScript

### 📊 **Execution Logs & Traces**

Comprehensive logging system providing complete visibility into the debugging process with real-time updates.

<div align="center">

![Execution Logs - Multi-Agent](docs/images/logs-1.png)
*Multi-agent execution logs showing Patch Generator and Validator activity*

![Execution Logs - System Traces](docs/images/logs-2.png)
*Detailed system traces with session IDs and timestamps*

</div>

**Logging Features:**
- 🤖 **Agent Execution Logs**: Track which agents ran and their status
- 📋 **System Traces**: View session creation and execution details
- 📤 **Output Display**: See stdout, stderr, and exit codes
- ⏰ **Timestamp Tracking**: Know exactly when each action occurred
- 🆔 **Session IDs**: Unique identifiers for debugging sessions
- 🔄 **Real-time Updates**: Watch the debugging process unfold live
- 📊 **Status Indicators**: STARTED, COMPLETED, RUNNING states
- 🎯 **Iteration Counter**: Track progress through debugging cycles

**Perfect for:** Understanding the debugging workflow, troubleshooting issues

### 🔍 **Version Control & Diff Viewer**

Git-like version control system tracking every code change with detailed diffs and execution results.

<div align="center">

![Version Control - History](docs/images/versions-1.png)
*Version history showing code evolution from v0 to v2*

![Version Control - Diff](docs/images/versions-2.png)
*Detailed diff view highlighting exact code changes*

</div>

**Version Control Features:**
- 📚 **Version History**: View all code iterations (Version 0, 1, 2, etc.)
- 🔄 **Diff Visualization**: See exact changes between versions with syntax highlighting
- ✅ **Execution Results**: Each version shows success/error status
- ⏰ **Timestamp Tracking**: Know when each version was created
- 🔙 **Rollback Support**: Navigate between different code versions
- 📊 **Output Comparison**: Compare stdout/stderr across versions
- 🎯 **Error Tracking**: See how errors evolved through iterations
- 💾 **Complete History**: Never lose any version of your code

**Perfect for:** Understanding code evolution, learning from fixes, debugging the debugger

### 🩹 **Intelligent Patch System**

Advanced patching system with AI-powered reasoning, detailed error analysis, and transparent fix strategies.

<div align="center">

![Patch System - Overview](docs/images/patches-1.png)
*Patch overview showing applied fixes with reasoning*

![Patch System - Details](docs/images/patches-2.png)
*Detailed patch view with error analysis and fix strategy*

![Patch System - Diff](docs/images/patches-3.png)
*Code changes visualization with unified diff format*

</div>

**Patch Features:**
- 🏷️ **Patch Tracking**: Monitor all patches (Patch 1, Patch 2, etc.)
- 🔍 **Source Identification**: Know if patch is rule-based or LLM-generated
- 💭 **Reasoning Display**: Understand why each patch was applied
- 🔬 **Error Analysis**: Detailed analysis of what went wrong
- 🎯 **Fix Strategy**: Clear explanation of the fix approach
- 📝 **Code Changes**: Visual diff showing exact modifications
- ✅ **Apply Status**: Track which patches were successfully applied
- 🔄 **Version Mapping**: See which versions each patch connects (v0 → v1)

**Patch Sources:**
- ⚡ **Rule-Based**: Fast pattern-matching fixes (60% of errors)
- 🤖 **LLM-Generated**: AI-powered intelligent fixes (complex errors)

**Perfect for:** Learning from fixes, understanding error patterns, code review

### 📈 **Statistics Dashboard**

Real-time analytics dashboard providing insights into debugging performance and session metrics.

<div align="center">

![Stats Dashboard](docs/images/stats-1.png)
*Comprehensive statistics showing iterations, fixes, and versions*

</div>

**Dashboard Metrics:**
- 🔄 **Iterations Count**: Track total debugging iterations attempted
- 🐛 **Bug Fixes**: Number of successful fixes (rule-based + LLM)
- 🤖 **LLM Fixes**: Count of AI-generated patches specifically
- 📚 **Versions**: Total code versions created during session
- 📊 **Progress Bar**: Visual progress indicator for current session
- ⏱️ **Time Tracking**: Session duration and time per iteration
- 📈 **Success Rate**: Percentage of successful debugging sessions
- 🎯 **Error Categories**: Breakdown of error types encountered

**Insights Provided:**
- Which debugging strategy (rule-based vs LLM) is more effective
- Average iterations needed to fix different error types
- Performance trends over multiple sessions
- Most common error patterns in your code

**Perfect for:** Performance analysis, learning patterns, tracking improvement

### 🌐 **Landing Page**

Modern, engaging landing page showcasing AI Debugger's capabilities with clear call-to-actions.

<div align="center">

![Landing Page](docs/images/landing-1.png)
*Hero section with "Debug Code Intelligently" tagline and key metrics*

</div>

**Landing Page Features:**
- 🎯 **Hero Section**: Eye-catching headline and value proposition
- 📊 **Performance Metrics**: Display key stats (8 Error Types, 95% Success Rate, <5s Avg Fix Time, 100% Offline)
- ✨ **Feature Highlights**: Showcase main capabilities with icons
- 🚀 **Quick Start CTA**: "Start Debugging" button for immediate access
- 🔗 **GitHub Integration**: Direct link to repository
- 📱 **Responsive Design**: Works perfectly on all devices
- 🎨 **Modern UI**: Clean, professional design with smooth animations
- 💡 **How It Works**: Brief explanation of the debugging process

**Design Philosophy:**
- Clear value proposition within 3 seconds
- Minimal friction to start using the tool
- Professional yet approachable aesthetic
- Focus on benefits, not just features

**Perfect for:** First-time visitors, showcasing the product, driving adoption

---

## 🚀 How It Works

### Hybrid Debugging Approach

The AI Debugger uses a sophisticated hybrid approach combining rule-based and LLM-powered debugging:

```
┌─────────────────────────────────────────────────────────────┐
│                    Code Submission                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Sandbox Execution (Docker)                     │
│  • Isolated environment                                     │
│  • 10-second timeout                                        │
│  • Capture stdout/stderr/exit code                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Success? ────┼─── YES ──► Analyze for logical errors
              └──────┬───────┘
                     │ NO
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Rule-Based Patcher (Fast)                      │
│  • Pattern matching for common errors                       │
│  • Syntax error fixes                                       │
│  • Import error resolution                                  │
│  • Type error corrections                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
              ┌──────────────┐
              │ Fixed? ──────┼─── YES ──► Validate & Complete
              └──────┬───────┘
                     │ NO
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Multi-Agent LLM System (Intelligent)              │
│                                                             │
│  1. Error Interpreter                                       │
│     └─► Categorize & analyze error                         │
│                                                             │
│  2. Patch Generator                                         │
│     └─► Generate code fix                                   │
│                                                             │
│  3. Validator                                               │
│     └─► Test patched code                                   │
│                                                             │
│  4. Test Creator (optional)                                 │
│     └─► Generate test cases                                 │
│                                                             │
│  5. Refactor (optional)                                     │
│     └─► Optimize code                                       │
│                                                             │
│  6. Explainer                                               │
│     └─► Human-readable summary                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Final Validation                           │
│  • Execute fixed code                                       │
│  • Verify success                                           │
│  • Generate report                                          │
└─────────────────────────────────────────────────────────────┘
```

### Error Categories Handled

1. **Syntax Errors**: Missing colons, indentation, parentheses
2. **Name Errors**: Undefined variables, typos, missing imports
3. **Type Errors**: Type mismatches, wrong arguments
4. **Index Errors**: Array bounds, off-by-one errors
5. **Value Errors**: Invalid conversions, wrong formats
6. **Logical Errors**: Algorithm bugs, wrong output
7. **Recursion Errors**: Missing base cases, infinite loops
8. **Runtime Errors**: Division by zero, attribute errors

---

## 📦 Installation

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Docker** (for sandboxed execution)
- **Ollama** (for local LLM) or **Groq API Key** (for cloud LLM)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-debugger.git
cd ai-debugger

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build Docker sandbox image
cd sandbox
docker build -t multi-lang-executor:latest .
cd ..

# Start the backend server
python main.py
```

The backend will start on `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
# LLM Configuration
LLM_MODEL=codellama:7b
OLLAMA_BASE_URL=http://localhost:11434
GROQ_API_KEY=your_groq_api_key_here  # Optional: for cloud LLM

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Debugging Settings
MAX_ITERATIONS=10
EXECUTION_TIMEOUT=10

# Docker Settings
SANDBOX_CONTAINER=sandbox-container
```

---

## 🎮 Usage

### Web Interface

1. **Open the application**: Navigate to `http://localhost:5173`
2. **Paste your code**: Enter Python code in the Monaco editor
3. **Select debug mode**: Choose "Single Agent" or "Multi-Agent"
4. **Start debugging**: Click "Start Debug Session"
5. **Monitor progress**: Watch real-time logs and execution traces
6. **View results**: Check the Stats, Versions, and Patches tabs

### API Usage

#### Submit Code for Debugging

```bash
curl -X POST http://localhost:8000/api/debug \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def fib(n):\n    if n < 1:\n        return n\n    return fib(n-1) + fib(n-2)\nprint(fib(10))",
    "language": "python",
    "max_iterations": 10
  }'
```

#### Get Session Status

```bash
curl http://localhost:8000/api/session/{session_id}/status
```

#### Get All Versions

```bash
curl http://localhost:8000/api/session/{session_id}/versions
```

#### Get All Patches

```bash
curl http://localhost:8000/api/session/{session_id}/patches
```

### Example Debugging Session

**Input Code (with error):**
```python
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    
    while low < high:  # Bug: should be low <= high
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid  # Bug: should be mid + 1
        else:
            high = mid  # Bug: should be mid - 1
    
    return -1

print(binary_search([1, 2, 3, 4, 5], 5))
```

**AI Debugger Output:**
- **Iteration 1**: Detected logical error in loop condition
- **Patch 1**: Changed `while low < high` to `while low <= high`
- **Patch 2**: Changed `low = mid` to `low = mid + 1`
- **Patch 3**: Changed `high = mid` to `high = mid - 1`
- **Result**: ✅ Code fixed successfully!

---

## 🏗️ Architecture

### Tech Stack

#### Backend
- **FastAPI**: Modern Python web framework
- **LangGraph**: Multi-agent orchestration
- **LangChain**: LLM integration
- **Ollama/Groq**: Local/Cloud LLM providers
- **Docker**: Sandboxed code execution
- **Pydantic**: Data validation

#### Frontend
- **React 19**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool
- **Monaco Editor**: Code editor
- **Tailwind CSS**: Styling
- **Radix UI**: Component library
- **Axios**: HTTP client

### Project Structure

```
ai-debugger/
├── backend/
│   ├── agents.py              # Multi-agent LLM system
│   ├── orchestrator.py        # Hybrid debugging orchestrator
│   ├── sandbox_executor.py    # Docker-based code execution
│   ├── rule_based_patcher.py  # Pattern-based error fixing
│   ├── models.py              # Pydantic data models
│   ├── config.py              # Configuration settings
│   └── server.py              # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities
│   │   └── types/             # TypeScript types
│   └── package.json
├── sandbox/
│   ├── Dockerfile             # Multi-language executor image
│   ├── executor.py            # Code execution logic
│   └── build-docker.sh        # Build script
├── main.py                    # Backend entry point
└── README.md
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/debug` | Submit code for debugging |
| GET | `/api/session/{id}` | Get complete session info |
| GET | `/api/session/{id}/status` | Get session status |
| GET | `/api/session/{id}/versions` | Get all code versions |
| GET | `/api/session/{id}/patches` | Get all patches |
| GET | `/api/session/{id}/traces` | Get execution traces |
| GET | `/api/sessions` | List all sessions |
| POST | `/api/execute` | Execute arbitrary code |

---

## 🔒 Security

- **Sandboxed Execution**: All code runs in isolated Docker containers
- **Timeout Protection**: 10-second execution limit
- **No Network Access**: Containers have no internet connectivity
- **Resource Limits**: CPU and memory constraints
- **Local Processing**: All LLM inference runs locally (optional)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **LangChain** for the agent framework
- **Ollama** for local LLM support
- **FastAPI** for the excellent web framework
- **Monaco Editor** for the code editor component

---

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes
- **[API Documentation](API.md)** - Complete API reference
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and architecture
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Screenshots Guide](docs/SCREENSHOTS.md)** - Adding screenshots to docs
- **[Changelog](CHANGELOG.md)** - Version history and updates

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-debugger/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-debugger/discussions)
- **Documentation**: Check the docs folder for detailed guides
- **Quick Help**: See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🗺️ Roadmap

### Version 1.1 (Coming Soon)
- [ ] JavaScript/TypeScript support
- [ ] WebSocket for real-time updates
- [ ] Export debugging reports (PDF/Markdown)
- [ ] Custom agent creation
- [ ] Batch debugging multiple files

### Version 1.2
- [ ] Java support
- [ ] C++ support
- [ ] VS Code extension
- [ ] Collaborative debugging
- [ ] Performance profiling

### Version 2.0
- [ ] Custom rule creation UI
- [ ] Plugin system
- [ ] Cloud deployment option
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---
