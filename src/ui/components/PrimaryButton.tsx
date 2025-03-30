import clsx from "clsx";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function PrimaryButton({
  children,
  className,
  disabled,
  onClick,
}: Props) {
  return (
    <button
      className={clsx(
        className,
        "text-dark font-serif font-bold text-xl outline-0 disabled:opacity-40 relative",
        !disabled && "cursor-pointer"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <div
        className="overflow-hidden rounded-[2px] px-6 py-2 flex items-center justify-center m-[5px] hover:inset-shadow-sm active:scale-90 duration-100 text-white-outline"
        style={{
          background: "linear-gradient(#ffe499 0%, #f9d87d 100%)",
        }}
      >
        {children}
      </div>
      <div className="absolute left-0 top-0 w-full h-full button-ornate rounded-[2px] pointer-events-none" />
    </button>
  );
}
