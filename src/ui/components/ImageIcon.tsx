import clsx from "clsx";
import { useEffect, useState } from "react";

type Size = "small" | "medium" | "large";

type Props = {
  name: string;
  size: Size;
  className?: string;
};

const images = import.meta.glob("@/assets/rich-icons/**/*.png");

const cls: Record<Size, string> = {
  small: "w-10 h-10",
  medium: "w-20 h-20",
  large: "w-[128px] h-[128px]",
};

export function ImageIcon({ name, size, className }: Props) {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const promise =
      images[`/src/assets/rich-icons/${name}.png`] ??
      images["/src/assets/rich-icons/unknown.png"];

    promise().then((module: any) => {
      setUrl(module.default);
    });
  }, [name]);

  return <img className={clsx(cls[size], className)} src={url} />;
}
