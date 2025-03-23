import {
  CSSProperties,
  PropsWithChildren,
  ReactNode,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export type TooltipPlacement = {
  placementHorizontal?: "left" | "right" | "center";
  placementVertical?: "top" | "bottom" | "center";
};

type Props = PropsWithChildren &
  TooltipPlacement & {
    content: ReactNode;
    className?: string;
    contentClassName?: string;
    margin?: number;
    noPadding?: boolean;
  };
export function Tooltip({
  children,
  content,
  className,
  contentClassName,
  placementHorizontal = "center",
  placementVertical = "bottom",
  margin = 10,
  noPadding,
}: Props) {
  const [visible, setVisible] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  function show() {
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  function computePosition(): CSSProperties | undefined {
    if (!visible || !elRef.current || !contentRef.current) {
      return;
    }

    const elBox = elRef.current.getBoundingClientRect()!;
    const contentBox = contentRef.current.getBoundingClientRect()!;
    let top: number;
    let left: number;

    if (placementVertical === "bottom") {
      top = elBox.bottom + margin;
    } else if (placementVertical === "top") {
      top = elBox.top - margin - contentBox.height;
    } else {
      top = elBox.top + elBox.height / 2 - contentBox.height / 2;
    }

    if (placementHorizontal === "left") {
      left = elBox.left - contentBox.width - margin;
    } else if (placementHorizontal === "right") {
      left = elBox.right + margin;
    } else {
      left = elBox.left + elBox.width / 2 - contentBox.width / 2;
    }

    top = Math.max(
      margin,
      Math.min(top, window.innerHeight - contentBox.height - margin)
    );
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - contentBox.width - margin)
    );

    contentRef.current.style.left = `${left}px`;
    contentRef.current.style.top = `${top}px`;
  }

  return (
    <>
      <div
        ref={elRef}
        className={clsx(className)}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            ref={(el) => {
              contentRef.current = el;
              setTimeout(() => computePosition(), 10);
            }}
            className={clsx(
              "absolute max-w-72 rounded-md text-white bg-[#222] border-1 border-[#111] z-50 shadow-md",
              !noPadding ? "px-4 py-1" : "",
              contentClassName
            )}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
