import { useState, useMemo } from "react";
import type { RawSession } from "@/lib/types";

interface ProjectInfo {
  cwd: string;
  label: string;
  sessionCount: number;
  lastActive: string;
}

interface ProjectSelectorProps {
  sessions: RawSession[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

function extractProjectLabel(cwd: string): string {
  // Show the last 2 path segments for readability
  const parts = cwd.split("/").filter(Boolean);
  if (parts.length <= 2) return cwd;
  return parts.slice(-2).join("/");
}

export function ProjectSelector({
  sessions,
  selected,
  onChange,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);

  const projects = useMemo(() => {
    const map = new Map<string, { count: number; lastActive: string }>();

    for (const session of sessions) {
      if (!session.cwd) continue;
      const existing = map.get(session.cwd);
      if (existing) {
        existing.count++;
        if (session.timestamp > existing.lastActive) {
          existing.lastActive = session.timestamp;
        }
      } else {
        map.set(session.cwd, { count: 1, lastActive: session.timestamp });
      }
    }

    const result: ProjectInfo[] = [];
    for (const [cwd, info] of map) {
      result.push({
        cwd,
        label: extractProjectLabel(cwd),
        sessionCount: info.count,
        lastActive: info.lastActive,
      });
    }

    // Sort by session count descending
    result.sort((a, b) => b.sessionCount - a.sessionCount);
    return result;
  }, [sessions]);

  const allSelected = selected.size === 0 || selected.size === projects.length;

  function toggleProject(cwd: string) {
    const next = new Set(selected);
    if (next.has(cwd)) {
      next.delete(cwd);
      // If nothing is selected, treat as "all selected"
      if (next.size === 0) {
        onChange(new Set());
        return;
      }
    } else {
      next.add(cwd);
      // If all are now selected, clear to represent "all"
      if (next.size === projects.length) {
        onChange(new Set());
        return;
      }
    }
    onChange(next);
  }

  function selectAll() {
    onChange(new Set());
  }

  function selectNone() {
    // Select only the first project so we don't show an empty dashboard
    if (projects.length > 0) {
      onChange(new Set([projects[0].cwd]));
    }
  }

  if (projects.length <= 1) return null;

  const activeCount = allSelected
    ? projects.length
    : selected.size;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-200 transition-colors bg-navy-800/50 rounded-lg px-3 py-1.5 border border-navy-700/50"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
          />
        </svg>
        <span>
          {allSelected
            ? `All projects (${projects.length})`
            : `${activeCount} of ${projects.length} projects`}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 w-80 max-h-96 overflow-y-auto bg-navy-900 border border-navy-700 rounded-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-navy-700/50">
              <span className="text-xs font-medium text-navy-300">
                Filter by project
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300"
                >
                  All
                </button>
                <button
                  onClick={selectNone}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300"
                >
                  None
                </button>
              </div>
            </div>

            {/* Project list */}
            <div className="py-1">
              {projects.map((project) => {
                const isSelected = allSelected || selected.has(project.cwd);
                return (
                  <button
                    key={project.cwd}
                    onClick={() => toggleProject(project.cwd)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-navy-800/50 transition-colors ${
                      isSelected ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-500"
                          : "border-navy-600 bg-navy-800"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Project info */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-navy-200 truncate">
                        {project.label}
                      </div>
                      <div className="text-[10px] text-navy-500 truncate">
                        {project.cwd}
                      </div>
                      <div className="text-[10px] text-navy-500 mt-0.5">
                        {project.sessionCount} session{project.sessionCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
