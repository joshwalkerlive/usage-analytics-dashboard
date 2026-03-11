interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
  return (
    <div
      className={`bg-navy-900/50 border border-navy-700/50 rounded-xl p-6 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-navy-100 uppercase tracking-wide">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-navy-300 mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
