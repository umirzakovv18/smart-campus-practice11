interface StepHeaderProps {
  step: number;
  title: string;
}

export function StepHeader({ step, title }: StepHeaderProps) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
        {step}
      </span>
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
    </div>
  );
}
