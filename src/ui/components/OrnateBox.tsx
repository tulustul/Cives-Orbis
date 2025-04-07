import clsx from "clsx";
import { PropsWithChildren } from "react";

type BorderType = "small" | "regular";

type Props = PropsWithChildren & {
  borderType?: BorderType;
  className?: string;
  contentClassName?: string;
};

const BORDER_CLASSES: Record<BorderType, string> = {
  small: "border-ornate-small-2",
  regular: "border-ornate",
};

const CONTENT_CLASSES: Record<BorderType, string> = {
  small: "m-[2px] rounded-[13px]",
  regular: "py-4 rounded-[80px]",
};

export function OrnateBox({
  children,
  borderType = "regular",
  className,
  contentClassName,
}: Props) {
  const borderClass = BORDER_CLASSES[borderType];
  const contentClass = CONTENT_CLASSES[borderType];

  return (
    <div className={clsx(className, "relative text-dark")}>
      <div
        className={clsx(
          contentClass,
          contentClassName,
          "bg-ornate overflow-hidden relative min-w-20 h-full pointer-events-auto",
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
      <div
        className={clsx(
          borderClass,
          "absolute left-0 top-0 w-full h-full pointer-events-none",
        )}
      />
    </div>
  );
}
