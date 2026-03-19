/**
 * Types for per-session structured data from standard_insights_report/.
 * These are used by the computed insights engine to produce
 * project-filtered InsightsReport objects.
 */

export interface SessionMetaEntry {
  session_id: string;
  project_path: string;
  start_time: string;
  duration_minutes: number;
  user_message_count: number;
  assistant_message_count: number;
  tool_counts: Record<string, number>;
  languages: Record<string, number>;
  git_commits: number;
  git_pushes: number;
  input_tokens: number;
  output_tokens: number;
  first_prompt: string;
  user_interruptions: number;
  user_response_times: number[];
  tool_errors: number;
  tool_error_categories: Record<string, number>;
  uses_task_agent: boolean;
  uses_mcp: boolean;
  uses_web_search: boolean;
  uses_web_fetch: boolean;
  lines_added: number;
  lines_removed: number;
  files_modified: number;
  message_hours: number[];
  user_message_timestamps: string[];
}

export interface FacetEntry {
  session_id: string;
  underlying_goal: string;
  goal_categories: Record<string, number>;
  outcome: string;
  user_satisfaction_counts: Record<string, number>;
  claude_helpfulness: string;
  session_type: string;
  friction_counts: Record<string, number>;
  friction_detail: string;
  primary_success: string;
  brief_summary: string;
}
