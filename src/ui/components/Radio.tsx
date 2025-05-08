import clsx from "clsx";
import { Option } from "../../shared/types";

type Props<T> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Radio<T>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className="rounded-lg bg-amber-100/40 flex flex-col min-w-30 max-h-[250px] overflow-hidden">
      <div className="font-bold text-sm text-center px-4 py-1 border-b-2">
        {label}
      </div>
      <div className="flex flex-col max-h-full overflow-y-auto scrollbar-thin">
        {options.map((option, i) => (
          <div
            key={i}
            className={clsx(
              "text-center cursor-pointer px-2 py-1 text-xs font-semibold",
              option.value === value ? "bg-success/50" : "hover:bg-success/15",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}
