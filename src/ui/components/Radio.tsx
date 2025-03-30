import clsx from "clsx";
import { Option } from "./types";

type Props<T> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Radio<T>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className="text-amber-100 rounded-lg bg-gray-800 flex flex-col min-w-30 overflow-hidden border-1 border-gray-700">
      <div className="font-semibold text-center px-4 py-2 text-lg">{label}</div>
      <div className="flex flex-col ">
        {options.map((option, i) => (
          <div
            key={i}
            className={clsx(
              "text-center cursor-pointer px-2 py-1 ",
              option.value === value ? "bg-success/50" : "hover:bg-gray-700/70"
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
