import clsx from "clsx";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  className?: string;
};

export function Background({ className, children }: Props) {
  return (
    <div
      className={clsx(
        className,
        "bg-linear-150 to-gray-700/70 from-gray-900/70 backdrop-blur-lg backdrop-grayscale-50 shadow-md shadow-black/70 select-none pointer-events-auto"
      )}
    >
      {children}
    </div>
  );
}
