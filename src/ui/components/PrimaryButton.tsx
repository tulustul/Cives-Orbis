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
        "group text-dark font-serif font-bold text-xl outline-0 disabled:opacity-40 relative duration-100 hover:translate-y-[1px] active:translate-y-[3px]",
        !disabled && "cursor-pointer"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <div
        className="overflow-hidden rounded-[2px] px-6 py-2 flex items-center justify-center m-[5px] hover:inset-shadow-sm text-white-outline shadow-5xl group-hover:shadow-4xl hover:shadow-4xl group-active:shadow-3xl active:shadow-3xl duration-200"
        style={{
          background: "linear-gradient(#ffe499 0%, #f9d87d 100%)",
          // boxShadow: "0 4px 12px 2px #000000",
        }}
      >
        {children}
      </div>
      <div className="absolute left-0 top-0 w-full h-full button-ornate rounded-[2px] pointer-events-none" />
    </button>
  );
}
