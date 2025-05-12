import * as unitsIcons from "@/assets/atlas-units.json";
import unitsImage from "@/assets/atlas-units.png";

import * as resourcesIcons from "@/assets/atlas-resources.json";
import resourcesImage from "@/assets/atlas-resources.png";

type Data = typeof unitsIcons | typeof resourcesIcons;

import { CSSProperties } from "react";

type AtlasType = "units" | "resources";

const ATLASES: Record<AtlasType, { data: Data; image: string }> = {
  units: { data: unitsIcons, image: unitsImage },
  resources: { data: resourcesIcons, image: resourcesImage },
};

type Props = {
  name: string;
  atlas: AtlasType;
  tint?: string;
  scale?: number;
  className?: string;
};

export function AtlasIcon2({
  name,
  atlas: atlasName,
  className,
  scale = 1,
}: Props) {
  const atlas = ATLASES[atlasName];

  function getFrame(name: string) {
    return (atlas.data.frames as any)[name + ".png"]?.frame;
  }

  const frame =
    getFrame(name) ||
    getFrame("unit_undefined") ||
    getFrame("resource-unknown");

  const position = `-${frame.x * scale}px -${frame.y * scale}px`;
  const size = `${atlas.data.meta.size.w * scale}px ${
    atlas.data.meta.size.h * scale
  }px`;

  const style: CSSProperties = {
    width: `${frame.w * scale}px`,
    height: `${frame.h * scale}px`,
    backgroundPosition: position,
    backgroundSize: size,
    backgroundRepeat: "no-repeat",
    display: "inline-block",
    backgroundImage: `url(${atlas.image})`,
  };

  return <div className={className} style={style} />;
}
