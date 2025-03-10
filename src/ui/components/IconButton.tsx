import { Icon as TablerIcon } from "@tabler/icons-react";
import clsx from "clsx";
import { Icon } from "./Icon";

type Props = {
  className?: string;
  icon: TablerIcon;
  danger?: boolean;
  onClick?: () => void;
};

export function IconButton({ className, icon, danger, onClick }: Props) {
  return (
    <button
      className={clsx(
        className,
        "text-white flex items-center justify-center w-8 h-8 cursor-pointer rounded-md outline-0 hover:inset-shadow-sm active:scale-95 duration-100",
        danger
          ? "bg-red-600 inset-shadow-red-400"
          : "bg-linear-to-b from-gray-600 to-gray-700 inset-shadow-gray-500"
      )}
      onClick={onClick}
    >
      <Icon icon={icon} />
    </button>
  );
}
