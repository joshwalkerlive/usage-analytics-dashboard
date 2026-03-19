# Cross-Platform Session Data Collection Prompts

## Context
The Usage Analytics Dashboard currently only ingests Claude Code CLI sessions from `~/.claude/projects/`. To incorporate data from Claude Chat and Claude Cowork, use these prompts to have each platform generate structured output that can be merged into the dashboard's dataset.

---

## Prompt for Claude Chat

Use this prompt in a Claude Chat conversation to generate an insights-compatible summary of your chat history:

```
I need you to analyze our recent conversation history and output a structured JSON report. This is for my Usage Analytics Dashboard which tracks how I use Claude across platforms.

For each conversation we've had in this chat session (or as many as you can recall from our recent interactions), output the following JSON structure:

{
  "platform": "claude-chat",
  "sessions": [
    {
      "session_id": "<generate a UUID>",
      "platform": "claude-chat",
      "project_path": "claude-chat",
      "start_time": "<ISO 8601 timestamp of when the conversation started>",
      "duration_minutes": <estimated duration>,
      "user_message_count": <number of my messages>,
      "assistant_message_count": <number of your messages>,
      "tool_counts": {},
      "languages": {},
      "first_prompt": "<my opening message, first 100 chars>",
      "underlying_goal": "<what I was actually trying to accomplish>",
      "goal_categories": { "<category>": 1 },
      "outcome": "<fully_achieved | mostly_achieved | partially_achieved | not_achieved | unclear>",
      "claude_helpfulness": "<essential | very_helpful | moderately_helpful | slightly_helpful | unhelpful>",
      "session_type": "<single_task | multi_task | exploration | quick_question>",
      "friction_counts": {},
      "friction_detail": "<description of any issues, or empty string>",
      "primary_success": "<good_explanations | correct_code_edits | fast_accurate_search | proactive_help | none>",
      "brief_summary": "<1-2 sentence summary of what happened>"
    }
  ]
}

Goal categories to use: information_seeking, content_generation, brainstorming, data_analysis, writing_assistance, debugging, feature_creation, research_query, how_to_question, setup_configuration, document_creation, professional_content_creation

Be honest and accurate in your assessments. Don't inflate helpfulness or outcomes. If you're unsure about timestamps, estimate based on conversation context. Output ONLY the JSON, no other text.
```

---

## Prompt for Claude Cowork

Use this prompt at the end of a Cowork session (or paste it into a new one referencing the session you want to capture):

```
I need you to generate a structured session report for my Usage Analytics Dashboard. Analyze the work we did in this Cowork session and output the following JSON:

{
  "platform": "claude-cowork",
  "sessions": [
    {
      "session_id": "<the Cowork session ID if visible, otherwise generate a UUID>",
      "platform": "claude-cowork",
      "project_path": "<the project folder this session worked in>",
      "start_time": "<ISO 8601 timestamp>",
      "duration_minutes": <estimated duration>,
      "user_message_count": <count of my messages>,
      "assistant_message_count": <count of your responses>,
      "tool_counts": { "<tool_name>": <count> },
      "languages": { "<language>": <file_count> },
      "git_commits": <number of commits made>,
      "lines_added": <estimated lines added>,
      "lines_removed": <estimated lines removed>,
      "files_modified": <count of files touched>,
      "first_prompt": "<my opening message, first 100 chars>",
      "underlying_goal": "<what I was actually trying to accomplish>",
      "goal_categories": { "<category>": 1 },
      "outcome": "<fully_achieved | mostly_achieved | partially_achieved | not_achieved | unclear>",
      "claude_helpfulness": "<essential | very_helpful | moderately_helpful | slightly_helpful | unhelpful>",
      "session_type": "<single_task | multi_task | iterative_refinement | exploration | quick_question>",
      "friction_counts": {},
      "friction_detail": "<description of any friction points>",
      "primary_success": "<good_explanations | multi_file_changes | correct_code_edits | fast_accurate_search | proactive_help | good_debugging | none>",
      "brief_summary": "<1-2 sentence summary>"
    }
  ]
}

For tool_counts, list the actual tools used (Bash, Read, Write, Edit, Grep, Glob, WebSearch, WebFetch, etc.) with their counts. Be accurate about files modified and code churn. Output ONLY the JSON.
```

---

## How to Import

Once you have the JSON output from Claude Chat or Cowork:
1. Save each platform's output as a JSON file in `standard_insights_report/cross-platform/`
2. The dashboard's data pipeline can be extended to read these files alongside session-meta and facets data
3. Cross-platform sessions would appear in the insights with their `platform` field distinguishing them

## Future: Direct Integration

For Cowork sessions specifically, there IS local data available at:
- `~/Library/Application Support/Claude/local-agent-mode-sessions/` (64 sessions found)
- Each session has a JSON metadata file with `sessionId`, `title`, `initialMessage`, `createdAt`, `lastActivityAt`, `model`, `cwd`
- Some sessions also have nested JSONL transcripts in `.claude/projects/` subdirectories

A server-side parser could be built to scan these directories and extract session data in the same format the dashboard already consumes.
