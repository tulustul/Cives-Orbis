import clsx from "clsx";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  className?: string;
};

export function Header({ children, className }: Props) {
  return <div className={clsx(className, "font-serif")}>{children}</div>;
}
