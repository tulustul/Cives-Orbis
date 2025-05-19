import { bridge } from "@/bridge";
import { usePromise } from "@/utils";
import { ColumnDef, DataTable, OrnateModal } from "@/ui/components";
import { useUiState } from "../uiState";
import { CityOverviewChanneled } from "@/shared";
import { mapUi } from "../mapUi";

const columns: ColumnDef<CityOverviewChanneled>[] = [
  { id: "name", label: "Name", accessor: (item) => item.name },
  {
    id: "population",
    label: "Population",
    accessor: (item) => item.population,
  },
  { id: "gold", label: "Gold", accessor: (item) => item.yields.gold },
  { id: "food", label: "Food", accessor: (item) => item.yields.food },
  {
    id: "production",
    label: "Production",
    accessor: (item) => item.yields.production,
  },
  {
    id: "culture",
    label: "Culture",
    accessor: (item) => item.yields.culture,
  },
  {
    id: "knowledge",
    label: "Knowledge",
    accessor: (item) => item.yields.knowledge,
  },
];

export function EconomyOverview() {
  const data = usePromise(bridge.player.getEconomyOverview());

  const uiState = useUiState();

  function onCityClick(city: CityOverviewChanneled) {
    uiState.setView("none");
    mapUi.selectCity(city.id);
  }

  function getContent() {
    if (!data) {
      return null;
    }

    return (
      <DataTable
        data={data.cities}
        columns={columns}
        onRowClick={onCityClick}
      />
    );
  }

  return (
    <OrnateModal
      className="w-[1200px] h-[900px]"
      contentClassName="px-8 pb-10 flex flex-col"
      title="Economy overview"
      showCloseButton
      onClose={() => uiState.setView("none")}
    >
      {getContent()}
    </OrnateModal>
  );
}
