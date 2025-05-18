import { bridge } from "@/bridge";
import { StatsGetChanneled, StatsData } from "@/shared";
import { Chart, ChartLine, OrnateModal } from "@/ui/components";
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
  goldNetto: "Gold netto income",
  totalGold: "Total gold",
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
    <OrnateModal
      className="w-[1200px] h-[900px]"
      contentClassName="px-8 pb-10 flex flex-col"
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
                  color={series.player.colors.primary}
                />
              ))}
            </Chart>
          )}
        </div>
      </div>
    </OrnateModal>
  );
}

type DatasetSelectorProps = {
  dataset: keyof StatsData;
  onChange: (dataset: keyof StatsData) => void;
};
function DatasetSelector({ dataset, onChange }: DatasetSelectorProps) {
  return (
    <div className="flex flex-col gap-1 text-center text-amber-100">
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
            style={{ backgroundColor: stat.player.colors.primary }}
          />
          <span>{stat.player.name}</span>
        </div>
      ))}
    </div>
  );
}
