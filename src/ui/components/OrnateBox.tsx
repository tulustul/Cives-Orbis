import clsx from "clsx";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  className?: string;
  contentClassName?: string;
};

export function OrnateBox({ children, className, contentClassName }: Props) {
  return (
    <div className={clsx(className, "relative text-dark")}>
      <div
        className={clsx(
          contentClassName,
          "bg-ornate rounded-[80px] overflow-hidden py-4 relative min-w-50 h-full"
        )}
        style={{
          filter: "drop-shadow(0 4px 6px black)",
        }}
      >
        <div
          className="absolute left-0 top-0 w-full h-full pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(transparent 0%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.4) 100%)",
          }}
        />
        {children}
      </div>
      <div className="absolute left-0 top-0 w-full h-full border-ornate rounded-[80px] pointer-events-none" />
    </div>
  );
}
