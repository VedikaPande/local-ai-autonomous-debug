import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Play, Loader2, CheckCircle2, XCircle, Send, Code2, Bug, GitBranch, Terminal, BarChart3, MessageSquare, Upload, FileText, X, Settings, Zap, Clock, Monitor, Cpu, Activity, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { DebugSession } from '../types';
import { toast } from 'sonner';

// Parse diff into lines with + and - prefixes
const parseDiff = (diff: string) => {
  const lines = diff.split('\n');
  return lines.map((line, index) => ({
    content: line,
    type: line.startsWith('+') ? 'added' :
           line.startsWith('-') ? 'removed' :
           line.startsWith('@@') ? 'header' : 'context',
    key: index
  }));
};


export default function DebuggerPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<string>('python');
  const [session, setSession] = useState<DebugSession | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useSingleAgent, setUseSingleAgent] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([
    { role: 'assistant', content: 'Welcome! I\'m your AI debugging assistant. Paste your code and click "Start Debug Session" to begin.', timestamp: new Date() }
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Update code when language changes
  useEffect(() => {
    // Keep current code when language changes
    setExecutionResult(null);
  }, [language]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, session?.traces]);

  // Poll session status
  useEffect(() => {
    if (session && session.status === 'running' && !pollingInterval.current) {
      pollingInterval.current = setInterval(async () => {
        try {
          const updated = await api.getSession(session.session_id);
          setSession(updated);

          if (updated.status !== 'running') {
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current);
              pollingInterval.current = null;
            }
            setIsDebugging(false);

            if (updated.status === 'success') {
              setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: `✅ Debugging completed! Fixed in ${updated.current_iteration} iteration(s).`,
                timestamp: new Date()
              }]);
              toast.success('Debugging completed!');
            } else {
              setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: `❌ Debugging ${updated.status}. Check the logs for details.`,
                timestamp: new Date()
              }]);
              toast.error('Debugging failed');
            }
          }
        } catch (error) {
          console.error('Error polling session:', error);
        }
      }, 1000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [session]);

  const handleStartDebug = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code first');
      return;
    }

    setIsDebugging(true);
    setExecutionResult(null);
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: 'Start debugging this code',
      timestamp: new Date()
    }]);

    try {
      const newSession = await api.startDebugSession(code, 10, useSingleAgent);
      setSession(newSession);

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `🔍 Debug session started. Analyzing your code...`,
        timestamp: new Date()
      }]);

      toast.success('Debug session started!');
    } catch (error: any) {
      console.error('Error starting debug:', error);
      setIsDebugging(false);
      toast.error(error.response?.data?.detail || 'Failed to start debug session');
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error.response?.data?.detail || 'Failed to start debug session'}`,
        timestamp: new Date()
      }]);
    }
  };

  const handleRunCode = async () => {
    if (isExecuting || !code.trim()) return;

    try {
      setIsExecuting(true);
      setExecutionResult(null);

      const response = await api.executeCode(code, language);
      setExecutionResult(response.result);

      if (response.success) {
        toast.success(`${language.toUpperCase()} code executed successfully!`);
      } else {
        toast.error(`${language.toUpperCase()} code execution failed`);
      }
    } catch (error: any) {
      console.error('Failed to execute code:', error);
      toast.error(error.response?.data?.detail || 'Failed to execute code');
      setExecutionResult({
        status: 'error',
        stdout: '',
        stderr: error.response?.data?.detail || 'Execution failed',
        execution_time: 0.0
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');

    setChatHistory(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    let response = '';
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes('help') || lowerMsg.includes('how')) {
      response = 'I can help you debug Python, C++, C, and Java code! Just paste your code and click "Start Debug Session".';
    } else if (lowerMsg.includes('status')) {
      response = session ? `Current session status: ${session.status}. Iteration: ${session.current_iteration}/${session.max_iterations}` : 'No active debug session.';
    } else if (lowerMsg.includes('error')) {
      response = 'I handle 8 types of errors: Syntax, Name, Type, Index, Value, Logical, Recursion, and Runtime errors.';
    } else {
      response = 'I\'m here to help with debugging! Use the code editor to submit your code, and I\'ll analyze and fix it.';
    }

    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    }, 500);
  };

  // File upload utilities
  const getSupportedExtensions = () => {
    return {
      python: ['.py'],
      java: ['.java'],
      cpp: ['.cpp', '.cxx', '.cc'],
      c: ['.c']
    };
  };

  const detectLanguageFromFile = (filename: string) => {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const extensions = getSupportedExtensions();

    for (const [lang, exts] of Object.entries(extensions)) {
      if (exts.includes(ext)) {
        return lang;
      }
    }
    return null;
  };

  const isValidFileType = (filename: string) => {
    return detectLanguageFromFile(filename) !== null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isValidFileType(file.name)) {
      toast.error('Invalid file type. Supported: .py, .java, .cpp, .c');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('File too large. Max 1MB.');
      return;
    }

    try {
      const content = await file.text();
      const detectedLanguage = detectLanguageFromFile(file.name);

      if (detectedLanguage) {
        setLanguage(detectedLanguage);
        setCode(content);
        setUploadedFile(file);
        setExecutionResult(null);

        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: `✅ Loaded ${file.name}. Ready to debug!`,
          timestamp: new Date()
        }]);

        toast.success(`File uploaded!`);
      }
    } catch (error) {
      toast.error('Failed to read file. Try again.');
      console.error('File reading error:', error);
    }

    event.target.value = '';
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setCode('');
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: '📝 Removed uploaded file. You can now write your own code.',
      timestamp: new Date()
    }]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-sky-500 animate-spin" />;
      default:
        return <Bug className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      running: 'bg-sky-500',
      success: 'bg-emerald-500',
      failed: 'bg-rose-500',
      max_iterations: 'bg-amber-500'
    };
    return variants[status] || 'bg-slate-500';
  };

  const stats = session ? {
    'Iterations': session.current_iteration || 0,
    'Rule Fixes': session.patches?.filter(p => p.source === 'rule_based').length || 0,
    'LLM Fixes': session.patches?.filter(p => p.source === 'llm_patch_generator').length || 0,
    'Versions': session.versions?.length || 0,
  } : null;

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">AI Debugger</h1>
                <p className="text-xs text-slate-400">Intelligent code analysis and fixing</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                {getStatusIcon(session.status)}
                <Badge className={`${getStatusBadge(session.status)} text-white`}>
                  {session.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-slate-400 pl-2 border-l border-slate-600">
                  {session.current_iteration}/{session.max_iterations}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Language:</span>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-28 h-9 bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agent Mode Toggle */}
            <div className="flex items-center gap-2 border border-slate-700 rounded-lg p-2 bg-slate-800/50">
              <span className="text-sm text-slate-400">Debug Mode:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={useSingleAgent ? "outline" : "default"}
                  size="sm"
                  onClick={() => setUseSingleAgent(false)}
                  className={`text-xs ${!useSingleAgent ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-300 border-slate-500 hover:bg-slate-700 hover:text-white'}`}
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Multi-Agent
                </Button>
                <Button
                  variant={useSingleAgent ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseSingleAgent(true)}
                  className={`text-xs ${useSingleAgent ? 'bg-green-600 text-white hover:bg-green-700' : 'text-slate-300 border-slate-500 hover:bg-slate-700 hover:text-white'}`}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Single-Agent
                </Button>
              </div>
            </div>

            <Button
              onClick={handleRunCode}
              disabled={isExecuting || !code.trim()}
              variant="outline"
              className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-500"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Code
                </>
              )}
            </Button>

            <Button
              onClick={handleStartDebug}
              disabled={isDebugging}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {isDebugging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Debugging...
                </>
              ) : (
                <>
                  <Bug className="h-4 w-4 mr-2" />
                  Start Debug
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat & Info */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/30">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 bg-transparent px-4 pt-3 border-b border-slate-800">
              <TabsTrigger value="chat" className="gap-2 text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700 hover:text-slate-200 hover:bg-slate-800">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2 text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700 hover:text-slate-200 hover:bg-slate-800">
                <Terminal className="h-4 w-4" />
                <span className="hidden sm:inline">Logs</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2 text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700 hover:text-slate-200 hover:bg-slate-800">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
              <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                <div className="space-y-3">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-100'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-50 mt-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                {uploadedFile && (
                  <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-slate-300">{uploadedFile.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={removeUploadedFile}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".py,.java,.cpp,.cxx,.cc,.c"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="file-upload"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      title="Upload code file"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>

                  <Input
                    placeholder="Ask about debugging..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />

                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="flex-1 m-0 p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-2 font-mono text-xs">
                  {session?.traces?.map((trace, idx) => (
                    <div key={idx} className="text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700">
                      {trace}
                    </div>
                  ))}
                  {(!session || !session.traces?.length) && (
                    <div className="text-slate-500 text-center py-12">
                      No debug logs yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="flex-1 m-0 p-4 overflow-auto">
              {stats ? (
                <div className="space-y-3">
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">{key}</p>
                      <p className="text-2xl font-bold text-white">{value}</p>
                    </div>
                  ))}

                  {session && session.status !== 'running' && (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">Progress</p>
                      <Progress
                        value={(session.current_iteration / session.max_iterations) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-12">
                  No statistics yet
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="current" className="flex-1 flex flex-col">
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
              <TabsList className="bg-transparent gap-2">
                <TabsTrigger value="current" className="gap-2 text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700 hover:text-slate-200 hover:bg-slate-800">
                  <Code2 className="h-4 w-4" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="versions" className="gap-2 text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700 hover:text-slate-200 hover:bg-slate-800">
                  <GitBranch className="h-4 w-4" />
                  Versions
                  {session?.versions && <span className="ml-1 text-xs bg-slate-600 text-slate-200 px-2 py-1 rounded">{ session.versions.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="diff" className="gap-2 text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700 hover:text-slate-200 hover:bg-slate-800">
                  <Zap className="h-4 w-4" />
                  Patches
                  {session?.patches && <span className="ml-1 text-xs bg-slate-600 text-slate-200 px-2 py-1 rounded">{session.patches.length}</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="current" className="flex-1 m-0">
              <div className="h-full flex flex-col">
                <Editor
                  height={executionResult ? "60%" : "100%"}
                  defaultLanguage="python"
                  language={language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />

                {executionResult && (
                  <div className="flex-1 p-4 border-t border-slate-800 bg-slate-900/50 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-white">Execution Result</h3>
                      <Badge className={`${executionResult.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                        {executionResult.status}
                      </Badge>
                      <span className="text-xs text-slate-400 ml-auto">
                        {executionResult.execution_time?.toFixed(3)}s
                      </span>
                    </div>
                    <ScrollArea className="flex-1">
                      {executionResult.stdout && (
                        <div className="mb-4">
                          <p className="text-xs text-slate-400 mb-2 font-semibold">Output:</p>
                          <pre className="bg-slate-950 p-3 rounded text-xs text-emerald-400 border border-slate-700">
                            {executionResult.stdout}
                          </pre>
                        </div>
                      )}
                      {executionResult.stderr && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 font-semibold">Error:</p>
                          <pre className="bg-rose-950/20 p-3 rounded text-xs text-rose-300 border border-rose-700/30">
                            {executionResult.stderr}
                          </pre>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="versions" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4 pr-4">
                  {session?.versions?.map((version, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors">
                      <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">Version {version.version}</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(version.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCode(version.code)}
                            className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            Load
                          </Button>
                          <Badge className={`${version.execution_result?.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                            {version.execution_result?.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <ScrollArea className="h-48 w-full mb-4 border border-slate-700 rounded bg-slate-950">
                          <pre className="p-3 text-xs text-slate-300 font-mono">
                            <code>{version.code}</code>
                          </pre>
                        </ScrollArea>

                        {version.execution_result && (
                          <div className="space-y-3 text-xs">
                            {version.execution_result.stdout && (
                              <div>
                                <p className="text-slate-400 font-semibold mb-1">Output:</p>
                                <pre className="bg-slate-950 p-2 rounded text-emerald-400 border border-slate-700 max-h-20 overflow-auto">
                                  {version.execution_result.stdout}
                                </pre>
                              </div>
                            )}
                            {version.execution_result.stderr && (
                              <div>
                                <p className="text-slate-400 font-semibold mb-1">Error:</p>
                                <pre className="bg-rose-950/20 p-2 rounded text-rose-300 border border-rose-700/30 max-h-20 overflow-auto">
                                  {version.execution_result.stderr}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {!session?.versions?.length && (
                    <div className="text-slate-500 text-center py-12">
                      No versions available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="diff" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4 pr-4">
                  {session?.patches?.map((patch, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors">
                      <div className="p-4 bg-slate-900/50 border-b border-slate-700">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">Patch {idx + 1}</h3>
                            <Badge className={`${patch.source === 'rule_based' ? 'bg-purple-500' : 'bg-blue-500'} text-white text-xs`}>
                              {patch.source === 'rule_based' ? 'Rule' : 'AI'}
                            </Badge>
                            {patch.error_category && (
                              <Badge className={`text-white text-xs ${
                                patch.error_category === 'syntax' ? 'bg-red-500' :
                                patch.error_category === 'name' ? 'bg-orange-500' :
                                patch.error_category === 'type' ? 'bg-yellow-500' :
                                patch.error_category === 'index' ? 'bg-blue-500' :
                                patch.error_category === 'value' ? 'bg-purple-500' :
                                patch.error_category === 'recursion' ? 'bg-pink-500' :
                                patch.error_category === 'runtime' ? 'bg-cyan-500' :
                                'bg-green-500'
                              }`}>
                                {patch.error_category}
                              </Badge>
                            )}
                          </div>
                          <Badge className={`${patch.applied ? 'bg-emerald-500' : 'bg-slate-600'} text-white text-xs`}>
                            {patch.applied ? '✓ Applied' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          v{patch.version_from} → v{patch.version_to}
                        </p>
                      </div>

                      <div className="p-4 space-y-4">
                        {patch.reasoning && (
                          <div>
                            <p className="text-xs font-semibold text-slate-300 mb-1">Reasoning</p>
                            <p className="text-sm text-slate-400">{patch.reasoning}</p>
                          </div>
                        )}

                        {patch.error_analysis && (
                          <div>
                            <p className="text-xs font-semibold text-slate-300 mb-1">Error Analysis</p>
                            <p className="text-sm text-slate-400">{patch.error_analysis}</p>
                          </div>
                        )}

                        {patch.fix_strategy && (
                          <div>
                            <p className="text-xs font-semibold text-slate-300 mb-1">Fix Strategy</p>
                            <p className="text-sm text-slate-400">{patch.fix_strategy}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-slate-300 mb-2">Code Changes</p>
                          <ScrollArea className="h-48 w-full border border-slate-700 rounded bg-slate-950">
                            <div>
                              {parseDiff(patch.diff).map((line) => (
                                <div
                                  key={line.key}
                                  className={`px-4 py-1 text-xs font-mono ${
                                    line.type === 'added' ? 'bg-emerald-900/30 border-l-2 border-emerald-500' :
                                    line.type === 'removed' ? 'bg-rose-900/30 border-l-2 border-rose-500' :
                                    line.type === 'header' ? 'bg-blue-900/30 border-l-2 border-blue-500' :
                                    'bg-slate-950'
                                  }`}
                                >
                                  <code className={
                                    line.type === 'added' ? 'text-emerald-300' :
                                    line.type === 'removed' ? 'text-rose-300' :
                                    line.type === 'header' ? 'text-blue-300' :
                                    'text-slate-400'
                                  }>
                                    {line.content || ' '}
                                  </code>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!session?.patches?.length && (
                    <div className="text-slate-500 text-center py-12">
                      No patches available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}