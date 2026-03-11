interface ChartsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ChartsGrid({ children, className = "" }: ChartsGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {children}
    </div>
  );
}
