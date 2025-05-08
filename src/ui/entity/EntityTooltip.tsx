import { bridge } from "@/bridge";
import { EntityType } from "@/core/data/types";
import {
  BuildingChanneled,
  CityDetailsChanneled,
  EntityChanneled,
  UnitDefChanneled,
} from "@/core/serialization/channel";
import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import {
  Bonuses,
  ImageIcon,
  Tooltip,
  TooltipPlacement,
  Value,
} from "../components";
import { ProductRequirements } from "./ProductRequirements";

type EntityContext = { city?: CityDetailsChanneled };

type EntityTooltipProps = PropsWithChildren &
  TooltipPlacement & {
    entityId: string;
    context?: EntityContext;
  };
export function EntityTooltip({
  entityId,
  context,
  children,
  ...rest
}: EntityTooltipProps) {
  return (
    <Tooltip
      contentClassName="w-60"
      content={<EntityDetailsTooltip id={entityId} context={context} />}
      noPadding
      {...rest}
    >
      {children}
    </Tooltip>
  );
}

type EntityDetailsTooltipProps = {
  id: string;
  context?: EntityContext;
};
function EntityDetailsTooltip({ id, context }: EntityDetailsTooltipProps) {
  const [entity, setEntity] = useState<EntityChanneled | null>(null);

  useEffect(() => {
    bridge.entities.getDetails(id).then(setEntity);
  }, [id]);

  if (!entity) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <EntityHeader entity={entity} />
      {entityTypeRenderers[entity.entityType](entity, context)}
    </div>
  );
}

function EntityHeader({ entity }: { entity: EntityChanneled }) {
  return (
    <>
      <div className="font-serif text-xl center tracking-wider my-2 mx-2">
        {entity.name}
      </div>
      <ImageIcon
        className="mb-2"
        name={entity.id}
        size="large"
        frameType={entity.entityType}
      />
    </>
  );
}

const entityTypeRenderers: Record<
  EntityType,
  (entity: any, context?: EntityContext) => ReactNode
> = {
  building: (entity: BuildingChanneled, context) => (
    <>
      <Bonuses bonuses={entity.bonuses} />
      {context?.city ? (
        <ProductRequirements city={context.city} product={entity} />
      ) : null}
      <Value>Cost: {entity.cost}</Value>
    </>
  ),
  unit: (entity: UnitDefChanneled, context) => (
    <>
      {context?.city ? (
        <ProductRequirements city={context.city} product={entity} />
      ) : null}
      <Value>Moves: {entity.actionPoints}</Value>
      {entity.strength ? <Value>Strength: {entity.strength}</Value> : null}
      {entity.capacity ? <Value>Capacity: {entity.capacity}</Value> : null}
      <Value>Cost: {entity.cost}</Value>
    </>
  ),
  idleProduct: (entity: BuildingChanneled, context) => (
    <>
      {context?.city ? (
        <ProductRequirements city={context.city} product={entity} />
      ) : null}
      <Bonuses bonuses={entity.bonuses} />
      <Value>Cost: {entity.cost}</Value>
    </>
  ),
  tileImprovement: () => null,
  resource: () => null,
  technology: () => null,
  nation: () => null,
  populationType: () => null,
};
