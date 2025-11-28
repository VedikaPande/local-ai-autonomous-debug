
import type React from "react"
import {Link} from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bug, Sparkles, Zap, Shield, Code2, GitBranch, CheckCircle2, ArrowRight, Github, Menu, X } from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Blazing Fast",
      description: "Real-time error detection and automatic fixes in milliseconds",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered",
      description: "Hybrid approach combining rules and LLM agents for intelligent debugging",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Private",
      description: "Docker sandboxed execution keeps your code safe and isolated",
    },
    {
      icon: <Code2 className="h-8 w-8" />,
      title: "Comprehensive",
      description: "Handles 8 error categories from syntax to runtime issues",
    },
    {
      icon: <GitBranch className="h-8 w-8" />,
      title: "Version Tracking",
      description: "Track every fix with diffs, patches, and detailed traces",
    },
    {
      icon: <CheckCircle2 className="h-8 w-8" />,
      title: "95% Success Rate",
      description: "Industry-leading accuracy with sub-5s average fix time",
    },
  ]

  const steps = [
    { number: "1", title: "Paste Code", desc: "Submit your code to the editor" },
    { number: "2", title: "AI Analysis", desc: "Our hybrid system analyzes and fixes errors" },
    { number: "3", title: "Get Results", desc: "Review fixes with full traces and details" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2">
              <Bug className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">AI Debugger</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-primary transition">
              Features
            </a>
            <a href="#how-it-works" className="text-sm hover:text-primary transition">
              How It Works
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-primary transition"
            >
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Button
              asChild
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              <Link to="/debugger">
                Start Debugging
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border p-4 space-y-4">
            <a href="#features" className="block text-sm hover:text-primary">
              Features
            </a>
            <a href="#how-it-works" className="block text-sm hover:text-primary">
              How It Works
            </a>
            <a href="https://github.com" target="_blank" className="block text-sm hover:text-primary" rel="noreferrer">
              GitHub
            </a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            <span>AI-Powered Code Debugging</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Debug Code
            <br />
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-transparent bg-clip-text">
              Intelligently
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Local AI-powered debugging sandbox that automatically detects, analyzes, and fixes Code errors using
            hybrid rule-based and LLM agents. Fast, secure, and completely offline.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              <Link to="/debugger">
                Start Debugging
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-20">
          {[
            { value: "8", label: "Error Types" },
            { value: "95%", label: "Success Rate" },
            { value: "<5s", label: "Avg Fix Time" },
            { value: "100%", label: "Offline" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-lg border border-border bg-card">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24 border-t border-border">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to debug code faster and smarter
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:border-cyan-500/50 transition-colors group">
              <CardHeader>
                <div className="text-cyan-500 group-hover:text-cyan-400 transition-colors mb-3">{feature.icon}</div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-24 border-t border-border">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground">Simple 3-step process to fix your code</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 border-t border-border">
        <Card className="border-border bg-card max-w-3xl mx-auto">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Ready to Debug Smarter?</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Start using AI-powered debugging today. Local, offline, and completely free. No sign-ups required.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              <Link to="/debugger">
                Launch Debugger Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="container mx-auto px-4 text-center space-y-4">
          <p className="text-muted-foreground">© 2025 AI Debugger. Built with React, FastAPI, LangGraph & Ollama.</p>
          <p className="text-sm text-muted-foreground">Local AI • Offline Operation • Open Source</p>
        </div>
      </footer>
    </div>
  )
}

// Icon component for better visuals
function Brain(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2C10.9 2 10 2.9 10 4v3H6c-2.21 0-4 1.79-4 4v8c0 2.21 1.79 4 4 4h12c2.21 0 4-1.79 4-4v-8c0-2.21-1.79-4-4-4h-4V4c0-1.1-.9-2-2-2m0 0" />
      <circle cx="12" cy="15" r="2" />
      <path d="M12 15v-3m-2 1h4" />
    </svg>
  )
}
