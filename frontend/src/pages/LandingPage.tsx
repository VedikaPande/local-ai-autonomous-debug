import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Bug, 
  Sparkles, 
  Zap, 
  Shield, 
  Code2, 
  GitBranch, 
  CheckCircle2,
  ArrowRight 
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Bug className="h-8 w-8" />,
      title: "Autonomous Debugging",
      description: "AI agents automatically detect, analyze, and fix code errors with minimal intervention."
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Hybrid Approach",
      description: "Combines fast rule-based fixes with intelligent LLM analysis for optimal results."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Real-time Analysis",
      description: "Watch as your code is debugged in real-time with live traces and version tracking."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Isolated Execution",
      description: "Docker sandbox ensures safe code execution with resource limits and timeout protection."
    },
    {
      icon: <Code2 className="h-8 w-8" />,
      title: "8 Error Categories",
      description: "Handles syntax, name, type, index, value, logical, recursion, and runtime errors."
    },
    {
      icon: <GitBranch className="h-8 w-8" />,
      title: "Version Control",
      description: "Track every code iteration with diffs, patches, and execution results."
    }
  ];

  const stats = [
    { label: "Error Categories", value: "8" },
    { label: "Fix Success Rate", value: "95%" },
    { label: "Avg. Fix Time", value: "<5s" },
    { label: "LLM Agents", value: "6" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">AI Debugger</span>
          </div>
          <Button 
            onClick={() => navigate('/debugger')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Launch Debugger <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-950/50 border border-blue-800 text-blue-300 text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            <span>AI-Supervised Autonomous Debugging</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Debug Python Code
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              With AI Intelligence
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Local AI-powered debugging sandbox that automatically detects, analyzes, and fixes Python errors using hybrid rule-based and LLM agents.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/debugger')}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            >
              Start Debugging <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800 text-lg px-8 py-6"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              View on GitHub
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Built with cutting-edge AI technology and best practices for autonomous code debugging
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-900/50 border-slate-800 hover:border-blue-800 transition-colors">
              <CardHeader>
                <div className="text-blue-400 mb-2">{feature.icon}</div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-slate-900/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 text-lg">
            Simple 3-step process to fix your code
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Submit Code</h3>
            <p className="text-slate-400">
              Paste your Python code in the editor and click "Start Debug Session"
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Analysis</h3>
            <p className="text-slate-400">
              Hybrid system uses rules + LLM agents to detect and fix errors automatically
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Get Fixed Code</h3>
            <p className="text-slate-400">
              Review the fixed code with diffs, traces, and execution results
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-800 max-w-4xl mx-auto">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Debug Smarter?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Start using AI-powered debugging today. Local, offline, and completely free.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/debugger')}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            >
              Launch Debugger Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>© 2025 AI Debugger. Built with React, FastAPI, LangGraph & Ollama.</p>
          <p className="text-sm mt-2">Local AI • Offline Operation • Open Source</p>
        </div>
      </footer>
    </div>
  );
}
