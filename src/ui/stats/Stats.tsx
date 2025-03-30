import { bridge } from "@/bridge";
import { StatsGetChanneled } from "@/core.worker";
import { StatsData } from "@/core/stats";
import { Chart, ChartLine, Modal } from "@/ui/components";
import { useEffect, useState } from "react";
import { useUiState } from "../uiState";

const datasetNames: Record<keyof StatsData, string> = {
  cities: "Number of cities",
  food: "Food",
  production: "Production",
  culture: "Culture",
  military: "Military power",
  knowledge: "Knowledge",
  techs: "Discovered techs",
};

export function Stats() {
  const [selectedDataset, setSelectedDataset] =
    useState<keyof StatsData>("military");

  const [stats, setStats] = useState<StatsGetChanneled[] | null>(null);

  useEffect(() => {
    bridge.stats.get({ type: selectedDataset }).then(setStats);
  }, [selectedDataset]);

  const uiState = useUiState();

  return (
    <Modal
      className="w-[90%] h-[90%] flex flex-col"
      title="Statistics"
      showCloseButton
      onClose={() => uiState.setView("none")}
    >
      <div className="flex grow gap-4">
        <div className="flex flex-col justify-between items-start">
          <DatasetSelector
            dataset={selectedDataset}
            onChange={setSelectedDataset}
          />

          <div className="flex justify-center">
            {stats && <Legend stats={stats} />}
          </div>
        </div>
        <div className="grow flex justify-center">
          {stats && (
            <Chart>
              {stats.map((series) => (
                <ChartLine
                  key={selectedDataset + series.player.id}
                  id={selectedDataset + series.player.id}
                  data={series.data}
                  color={series.player.cssColor}
                />
              ))}
            </Chart>
          )}
        </div>
      </div>
    </Modal>
  );
}

type DatasetSelectorProps = {
  dataset: keyof StatsData;
  onChange: (dataset: keyof StatsData) => void;
};
function DatasetSelector({ dataset, onChange }: DatasetSelectorProps) {
  return (
    <div className="flex flex-col gap-1 text-center">
      {Object.entries(datasetNames).map(([key, name]) => (
        <div
          key={key}
          className={`${
            key === dataset ? "bg-green-800" : "bg-gray-800 hover:bg-gray-700"
          } cursor-pointer py-1 px-2 rounded-md`}
          onClick={() => onChange(key as keyof StatsData)}
        >
          {name}
        </div>
      ))}
    </div>
  );
}

type LegendProps = {
  stats: StatsGetChanneled[];
};
function Legend({ stats }: LegendProps) {
  return (
    <div className="flex flex-col gap-1">
      {stats.map((stat, index) => (
        <div key={index} className="flex gap-1 items-center">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: stat.player.cssColor }}
          />
          <span>Player {stat.player.id}</span>
        </div>
      ))}
    </div>
  );
}
