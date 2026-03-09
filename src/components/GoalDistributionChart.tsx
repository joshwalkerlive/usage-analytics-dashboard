import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { GoalDistribution } from "@/lib/types";

const COLORS: Record<string, string> = {
  "bug-fix": "#ef4444",
  feature: "#22c55e",
  refactor: "#3b82f6",
  explore: "#eab308",
  config: "#f97316",
  docs: "#8b5cf6",
  test: "#06b6d4",
  unknown: "#6b7280",
};

interface GoalDistributionChartProps {
  data: GoalDistribution[];
}

export function GoalDistributionChart({ data }: GoalDistributionChartProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Goal Categories
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="percentage"
              nameKey="category"
              label={({ category, percentage }) =>
                `${category} ${Math.round(percentage)}%`
              }
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={COLORS[entry.category] ?? "#6b7280"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
              formatter={(value: number) => [`${Math.round(value)}%`, "Share"]}
            />
            <Legend
              wrapperStyle={{ color: "#9ca3af", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
