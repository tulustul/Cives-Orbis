import clsx from "clsx";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  className?: string;
};
export function Value({ children, className }: Props) {
  return (
    <div
      className={clsx(
        className,
        "border-t-2 border-black/20 w-full px-4 py-1 text-center"
      )}
    >
      {children}
    </div>
  );
}
