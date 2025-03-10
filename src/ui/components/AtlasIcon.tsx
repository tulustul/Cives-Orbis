import * as atlasIcons from "@/assets/atlas-icons.json";
import clsx from "clsx";
import { CSSProperties } from "react";
import styles from "./Icon.module.css";

type Props = {
  name: string;
  tint?: string;
  scale?: number;
  className?: string;
};

export function AtlasIcon({ name, tint, className, scale = 1 }: Props) {
  function getFrame(name: string) {
    return (atlasIcons.frames as any)[name + ".png"]?.frame;
  }

  const frame = getFrame(name) || getFrame("undefined");

  const position = `-${frame.x * scale}px -${frame.y * scale}px`;
  const size = `${atlasIcons.meta.size.w * scale}px ${
    atlasIcons.meta.size.h * scale
  }px`;

  const style: CSSProperties = {
    width: `${frame.w * scale}px`,
    height: `${frame.h * scale}px`,
    backgroundPosition: position,
    backgroundSize: size,
    ...(tint
      ? {
          backgroundColor: tint,
          maskPosition: position,
          maskSize: size,
        }
      : {}),
  };

  return (
    <div
      className={clsx(className, styles.icon, { [styles.tint]: !!tint })}
      style={style}
    />
  );
}
