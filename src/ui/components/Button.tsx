import clsx from "clsx";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({ children, className, disabled, onClick }: Props) {
  return (
    <button
      className={clsx(
        className,
        "text-white px-4 h-8 bg-linear-to-b from-gray-600 to-gray-700 rounded-md outline-0 inset-shadow-gray-500  duration-100 disabled:opacity-40",
        !disabled && "cursor-pointer hover:inset-shadow-sm active:scale-95"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
