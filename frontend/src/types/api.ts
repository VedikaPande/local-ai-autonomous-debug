// API types
export type ExecutionStatus = 'success' | 'error' | 'timeout';
export type DebugStatus = 'running' | 'success' | 'failed' | 'max_iterations';
export type PatchSource = 'rule_based' | 'llm_patch_generator' | 'llm_validator';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  status: ExecutionStatus;
  error_message?: string;
  error_type?: string;
  traceback?: string;
}

export interface CodeVersion {
  version: number;
  code: string;
  timestamp: string;
  execution_result?: ExecutionResult;
}

export interface Patch {
  patch_id: string;
  version_from: number;
  version_to: number;
  source: PatchSource;
  reasoning: string;
  diff: string;
  applied: boolean;
  error_analysis?: string;
  fix_strategy?: string;
  error_category?: string;
}

export interface DebugSession {
  session_id: string;
  original_code: string;
  current_version: number;
  max_iterations: number;
  current_iteration: number;
  status: DebugStatus;
  final_code?: string;
  versions: CodeVersion[];
  patches: Patch[];
  traces: string[];
  created_at: string;
  completed_at?: string;
}

export interface SessionStats {
  total_iterations: number;
  rule_based_fixes: number;
  llm_fixes: number;
  execution_time: string;
  final_status: string;
}
