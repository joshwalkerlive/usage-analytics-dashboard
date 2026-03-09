import type { DateRange } from "@/lib/types";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label className="text-sm text-gray-400">From</label>
      <input
        type="date"
        value={value.start ?? ""}
        onChange={(e) =>
          onChange({ ...value, start: e.target.value || null })
        }
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <label className="text-sm text-gray-400">To</label>
      <input
        type="date"
        value={value.end ?? ""}
        onChange={(e) =>
          onChange({ ...value, end: e.target.value || null })
        }
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {(value.start || value.end) && (
        <button
          onClick={() => onChange({ start: null, end: null })}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}
