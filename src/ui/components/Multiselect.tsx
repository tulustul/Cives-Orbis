import { Option } from "./types";
import clsx from "clsx";

export type MultiselectAddedOrRemoved = "added" | "removed";

export type MultiselectOnChange<T> = {
  addedOrRemoved: MultiselectAddedOrRemoved;
  value: T;
  allValues: T[];
};
type Props<T> = {
  label: string;
  options: Option<T>[];
  value: T[];
  onChange: (value: MultiselectOnChange<T>) => void;
};

export function Multiselect<T>({ label, options, value, onChange }: Props<T>) {
  function toggleOption(option: Option<T>) {
    if (value.includes(option.value)) {
      const index = value.indexOf(option.value);
      const newValue = [...value];
      newValue.splice(index, 1);
      onChange({
        addedOrRemoved: "removed",
        value: option.value,
        allValues: newValue,
      });
    } else {
      onChange({
        addedOrRemoved: "added",
        value: option.value,
        allValues: [...value, option.value],
      });
    }
  }

  return (
    <div className="text-amber-100 rounded-lg bg-gray-800 flex flex-col min-w-30 overflow-hidden">
      <div className="font-semibold text-center px-4 py-2">{label}</div>
      <div className="flex flex-col ">
        {options.map((option, i) => (
          <div
            key={i}
            className={clsx(
              "text-center cursor-pointer px-2 py-1",
              value.includes(option.value)
                ? "bg-success/50"
                : "hover:bg-gray-700/70",
            )}
            onClick={() => toggleOption(option)}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}
