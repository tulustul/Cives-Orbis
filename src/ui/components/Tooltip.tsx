import {
  CSSProperties,
  PropsWithChildren,
  ReactNode,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

type Props = PropsWithChildren & {
  content: ReactNode;
  className?: string;
};
export function Tooltip({ children, content, className }: Props) {
  const [visible, setVisible] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);

  function show() {
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  function computePosition(): CSSProperties | undefined {
    if (!visible || !elRef.current) {
      return;
    }
    const box = elRef.current.getBoundingClientRect()!;
    let left = box.left + box.width / 2;
    if (left - box.width / 2 < 0) {
      left += left - box.width / 2 + 20;
    }

    let topTransform = "-100%";
    let top = box.top;
    if (box.top < 100) {
      topTransform = "10px";
      top = box.bottom;
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      transform: `translate(-50%, ${topTransform})`,
    };
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
            className="absolute px-4 py-1 max-w-72 rounded-md text-white bg-[#222] border-1 border-[#111] z-50 "
            style={computePosition()}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
