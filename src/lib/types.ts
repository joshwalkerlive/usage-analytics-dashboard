// Raw session data as exported from Claude Code
export interface RawToolCall {
  tool: string;
  args: Record<string, unknown>;
  result?: string;
  durationMs?: number;
  error?: boolean;
}

export interface RawMessage {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: RawToolCall[];
  timestamp: string;
}

export interface RawSession {
  id: string;
  timestamp: string;
  durationMs: number;
  messages: RawMessage[];
  model: string;
  cwd: string;
}

// Computed analytics types
export type GoalCategory =
  | "bug-fix"
  | "feature"
  | "refactor"
  | "explore"
  | "config"
  | "docs"
  | "test"
  | "unknown";

export interface ToolUsageStat {
  tool: string;
  count: number;
  errorCount: number;
  errorRate: number;
  avgDurationMs: number;
}

export interface SessionMetrics {
  totalSessions: number;
  avgDurationMs: number;
  sessionsPerDay: Record<string, number>;
  totalMessages: number;
  totalToolCalls: number;
}

export interface GoalDistribution {
  category: GoalCategory;
  count: number;
  percentage: number;
}

export interface FrictionDataPoint {
  date: string;
  score: number;
  sessionId: string;
}

export interface SatisfactionDataPoint {
  score: number;
  sessionId: string;
  date: string;
}

export interface AnalyzedSession {
  id: string;
  date: string;
  durationMs: number;
  messageCount: number;
  toolCallCount: number;
  toolErrorCount: number;
  goalCategory: GoalCategory;
  frictionScore: number;
  satisfactionScore: number;
  model: string;
  toolUsage: Record<string, { count: number; errors: number }>;
}

export interface DashboardData {
  sessions: AnalyzedSession[];
  sessionMetrics: SessionMetrics;
  toolUsageStats: ToolUsageStat[];
  goalDistribution: GoalDistribution[];
  frictionOverTime: FrictionDataPoint[];
  satisfactionDistribution: SatisfactionDataPoint[];
}

export interface DateRange {
  start: string | null;
  end: string | null;
}
