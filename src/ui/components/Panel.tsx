import { PropsWithChildren } from "react";
import styles from "./Panel.module.css";
import { clsx } from "clsx";
import { Background } from "./Background";

type Props = PropsWithChildren & {
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
};

export function Panel({ children, corner, className }: Props) {
  return (
    <Background
      className={clsx(styles.panel, corner && styles[corner], className)}
    >
      {children}
    </Background>
  );
}
