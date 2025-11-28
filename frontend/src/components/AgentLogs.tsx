import React, { useState, useEffect } from 'react';
import { Clock, User, CheckCircle, AlertCircle, Play, Loader2 } from 'lucide-react';

interface AgentLog {
  agent: string;
  status: 'started' | 'completed' | 'failed';
  timestamp: number;
  description: string;
  details: string;
  duration?: number;
  iteration?: number;
  output_summary?: string;
  test_result?: {
    status: string;
    error: string | null;
  };
}

interface AgentLogsProps {
  sessionId: string;
  refreshTrigger?: number;
  className?: string;
}

export const AgentLogs: React.FC<AgentLogsProps> = ({ 
  sessionId, 
  refreshTrigger = 0,
  className = "" 
}) => {
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentLogs = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/api/session/${sessionId}/agent-logs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch agent logs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAgentLogs(data.agent_logs || []);
    } catch (err) {
      console.error('Error fetching agent logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agent logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentLogs();
  }, [sessionId, refreshTrigger]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
        return <Play className="h-4 w-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started':
        return 'border-l-blue-500 bg-blue-900/10';
      case 'completed':
        return 'border-l-green-500 bg-green-900/10';
      case 'failed':
        return 'border-l-red-500 bg-red-900/10';
      default:
        return 'border-l-yellow-500 bg-yellow-900/10';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return duration < 1 ? `${Math.round(duration * 1000)}ms` : `${duration}s`;
  };

  if (loading && agentLogs.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400">Loading agent logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg border border-red-600 bg-red-900/20 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-300 font-medium">Error loading agent logs</span>
        </div>
        <p className="text-red-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (agentLogs.length === 0) {
    return (
      <div className={`text-center py-8 text-slate-500 ${className}`}>
        <User className="h-8 w-8 mx-auto mb-2 text-slate-600" />
        <p>No agent logs available</p>
        <p className="text-xs text-slate-600 mt-1">
          Agent logs will appear here during multi-agent debugging
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-slate-400" />
        <h3 className="text-sm font-medium text-slate-300">Agent Execution Logs</h3>
        <span className="text-xs text-slate-500">({agentLogs.length} entries)</span>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {agentLogs.map((log, index) => (
          <div
            key={index}
            className={`border-l-4 p-3 rounded-r-lg bg-slate-800/30 border border-slate-700 ${getStatusColor(log.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(log.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      {log.agent}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wide ${
                      log.status === 'completed' ? 'bg-green-900/30 text-green-300' :
                      log.status === 'failed' ? 'bg-red-900/30 text-red-300' :
                      'bg-blue-900/30 text-blue-300'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{log.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(log.timestamp)}
                </div>
                {log.duration && (
                  <span className="text-emerald-400 font-mono">
                    {formatDuration(log.duration)}
                  </span>
                )}
              </div>
            </div>

            {log.details && (
              <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs">
                <p className="text-slate-400">{log.details}</p>
              </div>
            )}

            {log.output_summary && (
              <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs">
                <p className="text-slate-300 font-medium">Output:</p>
                <p className="text-slate-400 mt-1">{log.output_summary}</p>
              </div>
            )}

            {log.test_result && (
              <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium">Test Result:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.test_result.status === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
                  }`}>
                    {log.test_result.status}
                  </span>
                </div>
                {log.test_result.error && (
                  <p className="text-red-400 mt-1">{log.test_result.error}</p>
                )}
              </div>
            )}

            {log.iteration && (
              <div className="mt-2 text-xs text-slate-500">
                <span>Iteration: {log.iteration}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
