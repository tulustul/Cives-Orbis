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
        "h-8 px-4 flex justify-center items-center rounded-md cursor-pointer bg-black",
        {
          ["bg-success/50"]: checked,
        }
      )}
      onClick={() => onChange(!checked)}
    >
      {label}
    </div>
  );
}
