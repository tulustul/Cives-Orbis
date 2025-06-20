import { EntityType } from "@/shared";
import clsx from "clsx";
import { useEffect, useState } from "react";

import frame from "@/assets/rich-icons/frame2.png";
import unknown from "@/assets/rich-icons/unknown2.png";

type Size = "tiny" | "small" | "medium" | "large";

type Props = {
  name: string;
  size: Size;
  className?: string;
  frameType?: EntityType;
};

const tint: Record<EntityType, string> = {
  technology: "#ffbf00",
  unit: "#ffffff",
  building: "#5d3173",
  idleProduct: "#225524",
  tileImprovement: "#ff00ff",
  resource: "#00ffff",
  nation: "#0000ff",
  populationType: "#000000",
  district: "#000000",
};

const images = import.meta.glob("@/assets/rich-icons/**/*.png");

const clsSizes: Record<Size, string> = {
  tiny: "w-[28px] min-w-[28px] h-[28px]",
  small: "w-[34px] min-w-[34px] h-[34px]",
  medium: "w-[72px] min-w-[72px] h-[72px]",
  large: "w-[128px] min-w-[128px] h-[128px]",
};

const clsFrameSizes: Record<Size, string> = {
  tiny: "w-[32px] min-w-[32px] h-[32px]",
  small: "w-[40px] min-w-[40px] h-[40px]",
  medium: "w-[85px] min-w-[85px] h-[85px]",
  large: "w-[145px] min-w-[145px] h-[145px]",
};

export function ImageIcon({ name, size, className, frameType }: Props) {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const promise = images[`/src/assets/rich-icons/${name}.png`];

    if (!promise) {
      setUrl(unknown);
      return;
    }

    promise().then((module: any) => {
      setUrl(module.default);
    });
  }, [name]);

  const tintColor = frameType ? tint[frameType] : undefined;

  return (
    <div
      className={clsx(
        className,
        clsFrameSizes[size],
        "relative flex items-center justify-center",
      )}
    >
      <img className={clsSizes[size]} src={url} />
      {frameType && (
        <div
          className={clsx(clsFrameSizes[size], "absolute top-0 left-0")}
          style={{
            backgroundImage: `url(${frame})`,
            maskImage: `url(${frame})`,
            backgroundBlendMode: "luminosity",
            backgroundColor: tintColor,
            maskSize: "contain",
            backgroundSize: "contain",
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}
