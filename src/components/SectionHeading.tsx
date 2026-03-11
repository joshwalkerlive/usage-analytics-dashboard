interface SectionHeadingProps {
  id?: string;
  title: string;
  intro?: string;
}

export function SectionHeading({ id, title, intro }: SectionHeadingProps) {
  return (
    <div id={id} className="scroll-mt-20 mb-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {intro && (
        <p className="text-sm text-navy-300 mt-1 max-w-2xl">{intro}</p>
      )}
    </div>
  );
}
