import { PropsWithChildren } from "react";
import styles from "./Panel.module.css";
import { clsx } from "clsx";
import { Background } from "./Background";

type Props = PropsWithChildren & {
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  rounded?: boolean;
};

export function Panel({ children, corner, className, rounded }: Props) {
  return (
    <Background
      className={clsx(className, styles.panel, corner && styles[corner], {
        [styles.rounded]: rounded,
      })}
    >
      {children}
    </Background>
  );
}
