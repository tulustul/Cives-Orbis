import clsx from "clsx";
import { PropsWithChildren } from "react";
import { Button } from "./Button";
import { OrnateBox } from "./OrnateBox";

type Props = PropsWithChildren & {
  className?: string;
  contentClassName?: string;
  title?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
};
export function OrnateModal({
  children,
  className,
  contentClassName,
  title,
  showCloseButton,
  onClose,
}: Props) {
  function getTopBar() {
    if (!title && !showCloseButton) {
      return null;
    }

    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center w-full">
          <h2 className="font-serif grow text-3xl text-white-outline">
            {title}
          </h2>
          {showCloseButton && <Button onClick={onClose}>Close</Button>}
        </div>

        <div
          className="h-[3px] w-[90%] mt-1 mb-4"
          style={{
            background: "radial-gradient(#a18340, transparent 69%)",
            filter: "drop-shadow(0px 2px 0px #d8c9a9)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-0 w-full h-full flex justify-center items-center pointer-events-none z-20">
      <OrnateBox
        contentClassName={clsx(
          contentClassName,
          "min-w-[500px] pointer-events-auto py-8",
        )}
        className={className}
      >
        {getTopBar()}
        {children}
      </OrnateBox>
    </div>
  );
}
