import { PropsWithChildren } from "react";
import { Panel } from "./Panel";
import clsx from "clsx";
import { Button } from "./Button";

type Props = PropsWithChildren & {
  className?: string;
  title?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
};
export function Modal({
  children,
  className,
  title,
  showCloseButton,
  onClose,
}: Props) {
  function getTopBar() {
    if (!title && !showCloseButton) {
      return null;
    }

    return (
      <div className="flex pb-2 mb-2 items-center">
        <h2 className="font-serif grow text-3xl">{title}</h2>
        {showCloseButton && <Button onClick={onClose}>Close</Button>}
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-0 w-full h-full flex justify-center items-center">
      <Panel className={clsx("px-6 py-4", className)}>
        {getTopBar()}
        {children}
      </Panel>
    </div>
  );
}
