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
import { 
  ArrowLeft, 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Send,
  Code2,
  Bug,
  GitBranch,
  Terminal,
  BarChart3,
  MessageSquare,
  Upload,
  FileText,
  X
} from 'lucide-react';
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

const DEFAULT_CODE = `def binary_search_faulty(arr, target):
    low = 0
    high = len(arr) - 1
    while low < high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid
        else:
            high = mid
    return -1`;

const SAMPLE_CODE = {
  python: `def binary_search_faulty(arr, target):
    low = 0
    high = len(arr) - 1
    while low < high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid
        else:
            high = mid
    return -1

# Test the function
arr = [1, 3, 5, 7, 9, 11]
print("Index of target value:", binary_search_faulty(arr, 7))`,

  cpp: `#include <iostream>
#include <vector>
using namespace std;

int binarySearchFaulty(vector<int>& arr, int target) {
    int low = 0;
    int high = arr.size() - 1;
    
    while (low < high) {
        int mid = (low + high) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid;  // Bug: should be mid + 1
        } else {
            high = mid;
        }
    }
    return -1;
}

int main() {
    vector<int> arr = {1, 3, 5, 7, 9, 11};
    cout << "Index of target value: " << binarySearchFaulty(arr, 7) << endl;
    return 0;
}`,

  c: `#include <stdio.h>

int binarySearchFaulty(int arr[], int size, int target) {
    int low = 0;
    int high = size - 1;
    
    while (low < high) {
        int mid = (low + high) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid;  // Bug: should be mid + 1
        } else {
            high = mid;
        }
    }
    return -1;
}

int main() {
    int arr[] = {1, 3, 5, 7, 9, 11};
    int size = sizeof(arr) / sizeof(arr[0]);
    printf("Index of target value: %d\\n", binarySearchFaulty(arr, size, 7));
    return 0;
}`,

  java: `public class BinarySearch {
    public static int binarySearchFaulty(int[] arr, int target) {
        int low = 0;
        int high = arr.length - 1;
        
        while (low < high) {
            int mid = (low + high) / 2;
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                low = mid;  // Bug: should be mid + 1
            } else {
                high = mid;
            }
        }
        return -1;
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 7, 9, 11};
        System.out.println("Index of target value: " + binarySearchFaulty(arr, 7));
    }
}`
};

export default function DebuggerPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(SAMPLE_CODE.python);
  const [language, setLanguage] = useState<string>('python');
  const [session, setSession] = useState<DebugSession | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([
    { role: 'assistant', content: 'Welcome! I\'m your AI debugging assistant. Paste your code and click "Start Debug Session" to begin.', timestamp: new Date() }
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Update code when language changes
  useEffect(() => {
    setCode(SAMPLE_CODE[language as keyof typeof SAMPLE_CODE] || SAMPLE_CODE.python);
    setExecutionResult(null); // Clear previous results
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
          console.log('Session update:', updated); // Debug log
          setSession(updated);
          
          if (updated.status !== 'running') {
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current);
              pollingInterval.current = null;
            }
            setIsDebugging(false);
            
            // Add completion message to chat
            if (updated.status === 'success') {
              setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: `✅ Debugging completed successfully! Your code has been fixed in ${updated.current_iteration} iteration(s).`,
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
    setExecutionResult(null); // Clear previous execution results
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: 'Start debugging this code',
      timestamp: new Date()
    }]);

    try {
      const newSession = await api.startDebugSession(code, 10);
      setSession(newSession);
      
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `🔍 Debug session started (ID: ${newSession.session_id.slice(0, 8)}...). Analyzing your code...`,
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

    // Simple chat responses (you can extend this with actual AI chat)
    let response = '';
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('help') || lowerMsg.includes('how')) {
      response = 'I can help you debug Python code! Just paste your code in the editor and click "Start Debug Session". I\'ll analyze it, detect errors, and automatically fix them.';
    } else if (lowerMsg.includes('status')) {
      response = session ? `Current session status: ${session.status}. Iteration: ${session.current_iteration}/${session.max_iterations}` : 'No active debug session.';
    } else if (lowerMsg.includes('error')) {
      response = 'I handle 8 types of errors: Syntax, Name, Type, Index, Value, Logical, Recursion, and Runtime errors. Just submit your code and I\'ll detect and fix them automatically!';
    } else {
      response = 'I\'m here to help with debugging! Use the code editor to submit Python code, and I\'ll analyze and fix it for you.';
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

    // Validate file type
    if (!isValidFileType(file.name)) {
      toast.error('Invalid file type. Please upload Python (.py), Java (.java), C++ (.cpp, .cxx, .cc), or C (.c) files only.');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error('File too large. Please upload files smaller than 1MB.');
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
        
        // Add confirmation message to chat
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: `✅ Successfully loaded ${file.name} (${detectedLanguage.toUpperCase()}). The code has been loaded into the editor. You can now run or debug it.`,
          timestamp: new Date()
        }]);
        
        toast.success(`File uploaded successfully! Detected as ${detectedLanguage.toUpperCase()}`);
      }
    } catch (error) {
      toast.error('Failed to read file content. Please try again.');
      console.error('File reading error:', error);
    }

    // Reset the input
    event.target.value = '';
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setCode(SAMPLE_CODE[language as keyof typeof SAMPLE_CODE] || SAMPLE_CODE.python);
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: '📝 Removed uploaded file and restored sample code.',
      timestamp: new Date()
    }]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Bug className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      running: 'bg-blue-500',
      success: 'bg-green-500',
      failed: 'bg-red-500',
      max_iterations: 'bg-yellow-500'
    };
    return variants[status] || 'bg-gray-500';
  };

  const stats = session ? {
    'Total Iterations': session.current_iteration || 0,
    'Rule-Based Fixes': session.patches?.filter(p => p.source === 'rule_based').length || 0,
    'LLM Fixes': session.patches?.filter(p => p.source === 'llm_patch_generator').length || 0,
    'Code Versions': session.versions?.length || 0,
  } : null;

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="text-slate-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-semibold text-white">AI Debugger</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session && (
            <div className="flex items-center gap-2">
              {getStatusIcon(session.status)}
              <Badge className={getStatusBadge(session.status)}>
                {session.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-slate-400">
                Iteration {session.current_iteration}/{session.max_iterations}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Language:</span>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-24 h-8 text-xs">
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

          <Button
            onClick={handleRunCode}
            disabled={isExecuting || !code.trim()}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run
              </>
            )}
          </Button>

          <Button
            onClick={handleStartDebug}
            disabled={isDebugging}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isDebugging ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Debugging...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Debug
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat & Info */}
        <div className="w-96 border-r border-slate-800 flex flex-col bg-slate-900">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 bg-slate-800 m-2">
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="logs">
                <Terminal className="h-4 w-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="h-4 w-4 mr-2" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
              <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                <div className="space-y-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-800 text-slate-200'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-slate-800">
                {/* File Upload Section */}
                {uploadedFile && (
                  <div className="mb-3 p-2 bg-slate-800 rounded-md border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">{uploadedFile.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {detectLanguageFromFile(uploadedFile.name)?.toUpperCase()}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeUploadedFile}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
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
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                      title="Upload code file (.py, .java, .cpp, .c)"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Input
                    placeholder="Ask me anything about debugging..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  
                  <Button 
                    size="icon"
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-2 text-xs text-slate-500">
                  💡 Upload code files: Python (.py), Java (.java), C++ (.cpp, .cxx, .cc), C (.c)
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="flex-1 m-0 p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-2 font-mono text-xs">
                  {session?.traces?.map((trace, idx) => (
                    <div key={idx} className="text-slate-300 bg-slate-800 p-2 rounded">
                      {trace}
                    </div>
                  ))}
                  {(!session || !session.traces?.length) && (
                    <div className="text-slate-500 text-center py-8">
                      No debug logs available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="flex-1 m-0 p-4">
              {stats ? (
                <div className="space-y-4">
                  {Object.entries(stats).map(([key, value]) => (
                    <Card key={key} className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400">{key}</CardDescription>
                        <CardTitle className="text-2xl text-white">{value}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                  
                  {session && session.status !== 'running' && (
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white">Progress</CardTitle>
                        <Progress 
                          value={(session.current_iteration / session.max_iterations) * 100} 
                          className="mt-2"
                        />
                        <CardDescription className="text-slate-400 mt-2">
                          {session.current_iteration} of {session.max_iterations} iterations
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-8">
                  No statistics available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="current" className="flex-1 flex flex-col">
            <div className="border-b border-slate-800 bg-slate-900 px-4 py-2">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="current">
                  <Code2 className="h-4 w-4 mr-2" />
                  Current Code
                </TabsTrigger>
                <TabsTrigger value="versions">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Versions ({session?.versions?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="diff">
                  <Bug className="h-4 w-4 mr-2" />
                  Diffs ({session?.patches?.length || 0})
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
                  <div className="flex-1 p-4 border-t border-slate-700 bg-slate-900">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-white">Execution Result</h3>
                      <Badge className={executionResult.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                        {executionResult.status}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {executionResult.execution_time?.toFixed(3)}s
                      </span>
                    </div>
                    <ScrollArea className="h-32">
                      {executionResult.stdout && (
                        <div className="mb-2">
                          <p className="text-xs text-slate-500 mb-1">Output:</p>
                          <pre className="bg-slate-950 p-2 rounded text-xs text-green-400">
                            {executionResult.stdout}
                          </pre>
                        </div>
                      )}
                      {executionResult.stderr && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Error:</p>
                          <pre className="bg-red-950 p-2 rounded text-xs text-red-400">
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
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {session?.versions?.map((version, idx) => (
                    <Card key={idx} className="bg-slate-900 border-slate-800">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white">Version {version.version}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setCode(version.code)}
                              className="h-8 px-3 text-xs"
                            >
                              Copy to Editor
                            </Button>
                            <Badge className={version.execution_result?.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                              {version.execution_result?.status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="text-slate-400">
                          {new Date(version.timestamp).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64 w-full">
                          <pre className="bg-slate-950 p-4 rounded text-xs text-slate-300">
                            <code>{version.code}</code>
                          </pre>
                        </ScrollArea>
                        {version.execution_result && (
                          <div className="mt-4 space-y-2">
                            {version.execution_result.stdout && (
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Output:</p>
                                <ScrollArea className="h-32 w-full">
                                  <pre className="bg-slate-950 p-2 rounded text-xs text-green-400">
                                    {version.execution_result.stdout}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}
                            {version.execution_result.stderr && (
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Error:</p>
                                <ScrollArea className="h-32 w-full">
                                  <pre className="bg-slate-950 p-2 rounded text-xs text-red-400">
                                    {version.execution_result.stderr}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {!session && (
                    <div className="text-slate-500 text-center py-8">
                      No versions available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="diff" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {session?.patches?.map((patch, idx) => (
                    <Card key={idx} className="bg-slate-900 border-slate-800">
                      <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-white">Patch {idx + 1}</CardTitle>
                            <Badge className={patch.source === 'rule_based' ? 'bg-purple-500' : 'bg-blue-500'}>
                              {patch.source}
                            </Badge>
                            {patch.error_category && (
                              <Badge 
                                className={
                                  patch.error_category === 'syntax' ? 'bg-red-500' :
                                  patch.error_category === 'name' ? 'bg-orange-500' :
                                  patch.error_category === 'type' ? 'bg-yellow-500' :
                                  patch.error_category === 'index' ? 'bg-blue-500' :
                                  patch.error_category === 'value' ? 'bg-purple-500' :
                                  patch.error_category === 'recursion' ? 'bg-pink-500' :
                                  patch.error_category === 'runtime' ? 'bg-cyan-500' :
                                  'bg-green-500'
                                }
                              >
                                {patch.error_category}
                              </Badge>
                            )}
                          </div>
                          <Badge className={patch.applied ? 'bg-green-500' : 'bg-gray-500'}>
                            {patch.applied ? 'Applied' : 'Pending'}
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-400">
                          Version {patch.version_from} → {patch.version_to}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-white mb-1">Reasoning</p>
                            <p className="text-sm text-slate-300">{patch.reasoning}</p>
                          </div>

                          {patch.error_analysis && (
                            <div>
                              <p className="text-sm font-semibold text-white mb-1">Error Analysis</p>
                              <p className="text-sm text-slate-300">{patch.error_analysis}</p>
                            </div>
                          )}

                          {patch.fix_strategy && (
                            <div>
                              <p className="text-sm font-semibold text-white mb-1">Fix Strategy</p>
                              <p className="text-sm text-slate-300">{patch.fix_strategy}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-semibold text-white mb-2">Code Changes</p>
                            <ScrollArea className="h-64 w-full">
                              <div className="bg-slate-950 rounded border border-slate-800">
                                {parseDiff(patch.diff).map((line) => (
                                  <div
                                    key={line.key}
                                    className={
                                      line.type === 'added' ? 'bg-green-900/30 border-l-2 border-green-500' :
                                      line.type === 'removed' ? 'bg-red-900/30 border-l-2 border-red-500' :
                                      line.type === 'header' ? 'bg-blue-900/30 border-l-2 border-blue-500' :
                                      'bg-slate-950'
                                    }
                                  >
                                    <pre className="px-4 py-1 text-xs text-slate-300 whitespace-pre-wrap break-all">
                                      <code
                                        className={
                                          line.type === 'added' ? 'text-green-300' :
                                          line.type === 'removed' ? 'text-red-300' :
                                          line.type === 'header' ? 'text-blue-300' :
                                          'text-slate-300'
                                        }
                                      >
                                        {line.content || ' '}
                                      </code>
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!session?.patches?.length && (
                    <div className="text-slate-500 text-center py-8">
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
