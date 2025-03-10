import { bridge } from "@/bridge";
import { UnitOrder } from "@/core/unit";
import { ACTIONS, UnitAction } from "@/core/unit-actions";
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
import clsx from "clsx";
import { Button, IconButton, Panel, ProgressBar, Tooltip } from "./components";
import { mapUi } from "./mapUi";
import { RawUnitIcon } from "./UnitIcon";
import { Icon } from "./components/Icon";
import { UnitDetailsChanneled } from "@/core/serialization/channel";

const ORDER_TO_ICON: Record<UnitOrder, TablerIcon> = {
  sleep: IconZzz,
  skip: IconHourglassEmpty,
  go: IconRun,
};

export function UnitPanel() {
  const unit = useObservable(mapUi.selectedUnit$);

  function destroy() {
    if (unit) {
      bridge.units.disband(unit.id);
    }
  }

  async function setOrder(order: UnitOrder) {
    if (!unit) {
      return;
    }
    const updatedUnit = await bridge.units.setOrder({ unitId: unit.id, order });
    if (updatedUnit) {
      mapUi.setUnitDetails(updatedUnit);
    }
  }

  if (!unit) {
    return null;
  }

  let barColor = "food";
  if (unit.health < 35) {
    barColor = "danger";
  } else if (unit.health < 70) {
    barColor = "warning";
  }

  return (
    <Panel corner="bottom-left" className="p-2 w-80">
      {unit.health < 100 && (
        <Tooltip
          className="pb-2"
          content={<div>Health: {unit.health} / 100</div>}
        >
          <ProgressBar
            className={`[--progress-bar-color:theme(colors.${barColor})] [--progress-bar-height:5px]`}
            progress={unit.health}
            total={100}
            nextProgress={unit.health}
          />
        </Tooltip>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-2xl mb-1">{unit.definition.name}</div>
          <UnitSummaryBar unit={unit} />
        </div>

        <RawUnitIcon
          definitionId={unit.definition.id}
          type={unit.type}
          cssColor={unit.cssColor}
        />
      </div>

      {/* <div>Supplies: {unit.supplies}</div> */}
      {/* {!unit.isSupplied && <div>Out of range of supply lines</div>} */}

      <div className="flex gap-2 mt-4">
        <Tooltip content="Disband">
          <IconButton icon={IconSkull} danger onClick={destroy} />
        </Tooltip>

        <Tooltip content="Skip move">
          <IconButton
            icon={IconHourglassEmpty}
            onClick={() => setOrder("skip")}
          />
        </Tooltip>

        <Tooltip content="Sleep">
          <IconButton icon={IconZzz} onClick={() => setOrder("sleep")} />
        </Tooltip>
      </div>

      <UnitActions unit={unit} />
    </Panel>
  );
}

type Props = {
  unit: UnitDetailsChanneled;
};
function UnitSummaryBar({ unit }: Props) {
  return (
    <div className="flex items-center bg-gray-800 px-2 rounded-md">
      <Tooltip
        className="flex items-center pr-4 gap-2 font-semibold text-lg"
        content="Strength"
      >
        <Icon icon={IconSword} />
        {unit.definition.strength}
      </Tooltip>

      <Tooltip
        className="flex items-center pr-4 gap-2 font-semibold text-lg"
        content="Moves left"
      >
        <Icon icon={IconArrowBigRightLine} />
        {unit.actionPointsLeft.toFixed(1)} / {unit.definition.actionPoints}
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
    return ACTIONS[action].name;
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
