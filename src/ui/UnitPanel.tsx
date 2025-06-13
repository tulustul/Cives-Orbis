import { bridge } from "@/bridge";
import { UnitAction, UnitGroupDetailsChanneled, UnitOrder } from "@/shared";
import { useObservable } from "@/utils";
import {
  IconArrowBigRightLine,
  IconHourglassEmpty,
  IconRun,
  IconSkull,
  IconSword,
  IconZzz,
  Icon as TablerIcon,
} from "@tabler/icons-react";
import { Commands } from "./commands";
import {
  Button,
  IconButton,
  IconCommandButton,
  ImageIcon,
  Panel,
  ProgressBar,
  Tooltip,
} from "./components";
import { Icon } from "./components/Icon";
import { mapUi } from "./mapUi";
import { useUiState } from "./uiState";

const ORDER_TO_ICON: Record<UnitOrder, TablerIcon> = {
  sleep: IconZzz,
  skip: IconHourglassEmpty,
  go: IconRun,
};

export function UnitPanel() {
  const group = useObservable(mapUi.selectedUnit$);

  const { debug } = useUiState();

  function destroy() {
    if (group) {
      bridge.units.disband(group.id);
    }
  }

  if (!group) {
    return null;
  }

  const unit = group.units[0];

  let barColor = "[--progress-bar-color:theme(colors.food-400)]";
  if (unit.count < 35) {
    barColor = "[--progress-bar-color:theme(colors.danger)]";
  } else if (unit.count < 70) {
    barColor = "[--progress-bar-color:theme(colors.warning)]";
  }

  return (
    <Panel corner="bottom-left" className="p-2 w-90 min-h-40" rounded>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-4">
          <div className="text-2xl mb-1">
            {unit.name}
            {debug && (
              <span className="text-xs text-gray-400"> (id: {group.id})</span>
            )}
          </div>
          {unit.count < 100 && (
            <Tooltip
              className="w-46 pb-2"
              content={<div>Health: {unit.count}</div>}
              placementVertical="top"
            >
              <ProgressBar
                className={`${barColor} [--progress-bar-height:5px]`}
                progress={unit.count * 100}
                total={100}
                nextProgress={unit.count * 100}
              />
            </Tooltip>
          )}
          <UnitSummaryBar unit={group} />
        </div>

        <div className="absolute -z-1 -right-5 -top-5">
          <ImageIcon name={unit.definitionId} size="large" frameType="unit" />
        </div>
      </div>

      {/* <div>Supplies: {unit.supplies}</div> */}
      {/* {!unit.isSupplied && <div>Out of range of supply lines</div>} */}

      <div className="flex gap-2 mt-8">
        <Tooltip content="Disband" placementVertical="top">
          <IconButton icon={IconSkull} danger onClick={destroy} />
        </Tooltip>

        <IconCommandButton
          tooltip="Skip move"
          placementVertical="top"
          icon={IconHourglassEmpty}
          command={Commands.unitSkip}
        />

        <IconCommandButton
          tooltip="Sleep"
          placementVertical="top"
          icon={IconZzz}
          command={Commands.unitSleep}
        />
      </div>

      <UnitActions unit={group} />
    </Panel>
  );
}

type Props = {
  unit: UnitGroupDetailsChanneled;
};
function UnitSummaryBar({ unit }: Props) {
  return (
    <div className="flex items-center bg-gray-800 px-2 rounded-md">
      <Tooltip
        className="flex items-center pr-4 gap-2 font-semibold text-lg"
        content="Strength"
      >
        <Icon icon={IconSword} />
        {unit.totalStrength}
      </Tooltip>

      <Tooltip
        className="flex items-center pr-4 gap-2 font-semibold text-lg"
        content="Moves left"
      >
        <Icon icon={IconArrowBigRightLine} />
        {unit.actionPointsLeft.toFixed(1)} / {unit.actionPointsLeft}
      </Tooltip>

      {unit.order && (
        <Tooltip content={`Order: ${unit.order}`}>
          <Icon icon={ORDER_TO_ICON[unit.order]} />
        </Tooltip>
      )}
    </div>
  );
}

function UnitActions({ unit }: Props) {
  async function doAction(action: UnitAction) {
    if (!unit) {
      return;
    }
    const updatedUnit = await bridge.units.doAction({
      action,
      unitId: unit.id,
    });
    if (updatedUnit) {
      mapUi.setUnitDetails(updatedUnit);
    }
  }

  function getActionName(action: UnitAction) {
    // return ACTIONS[action].name;
    return action;
  }

  if (!unit.actions.length) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-4 w-full">
        <div className="h-0.5 grow bg-gray-700" />
        <div className="font-light ">Actions</div>
        <div className="h-0.5 grow bg-gray-700" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {unit.actions.map((action, i) => (
          <Button
            key={i}
            disabled={unit.actionPointsLeft === 0}
            onClick={() => doAction(action)}
          >
            {getActionName(action)}
          </Button>
        ))}
      </div>
    </div>
  );
}
