import clsx from "clsx";

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, checked, onChange }: Props) {
  return (
    <div
      className={clsx(
        "text-amber-100 h-6 px-3 flex justify-center items-center rounded-md cursor-pointer text-xs font-semibold",
        checked ? "bg-success" : "bg-black/20",
      )}
      onClick={() => onChange(!checked)}
    >
      {label}
    </div>
  );
}
