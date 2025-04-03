import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChartContext } from "./context";
import { drawLineChart } from "./line";
import { DataSeries } from "./types";

const Y_AXIS_LABELS = 15;

export function Chart({ children }: PropsWithChildren) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D>(null);

  const [dataSeries, setDataSeries] = useState<DataSeries[]>([]);

  const dataSeriesProcessed = useMemo(() => {
    let minValue = Infinity;
    let maxValue = -Infinity;

    for (const series of dataSeries) {
      for (let i = 0; i < series.data.length; i++) {
        const value = series.data[i];
        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
      }
    }

    const yAxisLabels: number[] = [];
    let lastValue: number = -1;
    for (let i = 0; i <= Y_AXIS_LABELS; i++) {
      const value = Math.round(
        minValue + ((maxValue - minValue) / Y_AXIS_LABELS) * (Y_AXIS_LABELS - i)
      );
      if (value !== lastValue) {
        lastValue = value;
        yAxisLabels.push(value);
      }
    }

    return { minValue, maxValue, dataSeries, yAxisLabels };
  }, [dataSeries]);

  useEffect(draw, [dataSeriesProcessed]);

  function draw() {
    if (!canvasRef.current || !ctxRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const series of dataSeriesProcessed.dataSeries) {
      if (series.type === "line") {
        drawLineChart(
          canvas,
          ctx,
          series,
          dataSeriesProcessed.minValue,
          dataSeriesProcessed.maxValue
        );
      }
    }
  }

  const registerSeries = useCallback((series: DataSeries) => {
    setDataSeries((prev) => {
      // Replace if this id already exists, otherwise add
      const existing = prev.findIndex((s) => s.id === series.id);
      if (existing !== -1) {
        const newSeries = [...prev];
        newSeries[existing] = { ...series };
        return newSeries;
      }
      return [...prev, series];
    });
  }, []);

  const unregisterSeries = useCallback((data: DataSeries) => {
    setDataSeries((prev) => {
      return prev.filter((s) => s.id !== data.id);
    });
  }, []);

  return (
    <div className="w-full flex gap-2">
      <div className="flex flex-col justify-between">
        {dataSeriesProcessed.yAxisLabels.map((value, index) => (
          <div key={index}>{value}</div>
        ))}
      </div>
      <div className="relative grow">
        <div className="flex flex-col justify-between h-full">
          {dataSeriesProcessed.yAxisLabels.map((_, index) => (
            <div className="w-full h-[1px] bg-gray-600/20" key={index} />
          ))}
        </div>

        <canvas
          className="absolute w-full h-full top-0 left-0"
          ref={(canvas) => {
            if (canvas) {
              canvas.width = canvas.offsetWidth;
              canvas.height = canvas.offsetHeight;
              canvasRef.current = canvas;
              ctxRef.current = canvas.getContext("2d")!;
            }
          }}
        />
      </div>

      <ChartContext.Provider value={{ registerSeries, unregisterSeries }}>
        {children}
      </ChartContext.Provider>
    </div>
  );
}
