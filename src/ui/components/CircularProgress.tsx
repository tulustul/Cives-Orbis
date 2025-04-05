import clsx from "clsx";
import styles from "./ProgressBar.module.css";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  progress: number;
  nextProgress: number;
  total: number;
  className?: string;
  size?: number;
  width?: number;
  border?: number;
  defaultcolor?: string;
  color?: string;
  nextColor?: string;
};

export function CircularProgress({
  progress: absoluteProgress,
  nextProgress: absoluteNextProgress,
  total,
  children,
  className,
  size = 120,
  width = 15,
  defaultcolor = "#fffed1",
  color = "#015a9c",
  nextColor = "#84abc8",
}: Props) {
  const progress = absoluteProgress ? absoluteProgress / total : 0;
  const nextProgress = absoluteNextProgress ? absoluteNextProgress / total : 0;

  if (!total) {
    return <div className={styles.empty} />;
  }

  return (
    <div className={clsx(className, "relative")}>
      <svg width={size} height={size}>
        <Circle
          size={size}
          center={size / 2}
          width={width}
          color={defaultcolor}
        />
        {nextProgress && (
          <Circle
            size={size}
            center={size / 2}
            width={width}
            angle={nextProgress}
            color={nextColor}
          />
        )}
        {progress && (
          <Circle
            size={size}
            center={size / 2}
            width={width}
            angle={progress}
            color={color}
          />
        )}
      </svg>
      <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
        {children}
      </div>
    </div>
  );
}

type CircleProps = {
  size: number;
  center: number;
  width: number;
  angle?: number;
  color: string;
};
function Circle({ size, center, width, angle, color }: CircleProps) {
  const r = (size - width) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = angle ? circumference * angle : undefined;

  return (
    <circle
      cx={center}
      cy={center}
      r={r}
      stroke={color}
      fill="transparent"
      strokeWidth={width}
      strokeDasharray={dash ? circumference : undefined}
      strokeDashoffset={dash ? circumference - dash : undefined}
      transform={`rotate(-90 ${center} ${center})`}
    />
  );
}
