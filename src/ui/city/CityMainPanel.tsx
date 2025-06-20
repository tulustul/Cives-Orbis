import { CityDetailsChanneled, CityProductChanneled } from "@/shared";
import { Button, ImageIcon, ProgressBar, Tooltip } from "@/ui/components";
import clsx from "clsx";

import { formatTurns, formatValue, formatValueWithSign } from "@/utils";
import { PropsWithChildren } from "react";
import { EntityTooltip } from "../entity";
import { RawUnitIcon } from "../UnitIcon";
import { useCity, useCityView } from "./cityViewStore";

export function CityMainPanel() {
  return (
    <div className="flex flex-col h-full">
      <Section>
        <CityGrowth />
      </Section>

      <Section title="Yields">
        <CityYields />
      </Section>

      <Section title="Expansion">
        <CityExpansion />
      </Section>

      <div className="grow flex flex-col justify-end">
        <div className="text-xl text-center mb-2">Production</div>
        <CityProductsList />
        <div>
          <CityProduct />
        </div>
      </div>
    </div>
  );
}

type SectionProps = PropsWithChildren & {
  title?: string;
  noSeparator?: boolean;
  noPadding?: boolean;
};
function Section({
  title,
  noSeparator: hideSeparator,
  children,
  noPadding,
}: SectionProps) {
  return (
    <>
      {title && <div className="text-xl text-center mb-2">{title}</div>}
      <div className={noPadding ? "" : "px-4"}> {children}</div>
      {!hideSeparator && <Separator />}
    </>
  );
}

function Separator() {
  return <div className="w-full h-[2px] bg-primary-500 my-4" />;
}

function CityGrowth() {
  const city = useCity();

  return (
    <div className="flex gap-4 items-center mt-4">
      <div className="text-4xl">{city.size}</div>
      <CityGrowthProgressBar />
    </div>
  );
}

function CityGrowthProgressBar() {
  const city = useCity();

  return (
    <Tooltip
      className="grow"
      content=<div className="text-food">
        {formatValue(city.totalFood)} ({formatValueWithSign(city.perTurn.food)})
        / {city.foodToGrow}
      </div>
    >
      <ProgressBar
        className="[--progress-bar-color:theme(colors.food-400)]"
        progress={city.totalFood}
        nextProgress={city.totalFood + city.perTurn.food}
        total={city.foodToGrow}
      >
        {city.perTurn.food > 0 && (
          <span className="turns">
            will grow in {formatTurns(city.turnsToChangeSize)} turns
          </span>
        )}

        {city.perTurn.food < 0 && (
          <span className="turns">
            will shrink in {formatTurns(city.turnsToChangeSize)} turns
          </span>
        )}
        {city.perTurn.food === 0 && (
          <span className="turns">growth stalled</span>
        )}
      </ProgressBar>
    </Tooltip>
  );
}

function CityYields() {
  const city = useCity();
  const { optimizeYields } = useCityView();

  return (
    <>
      <div className="">
        <Yield className="text-food-400" label="Food">
          {formatValue(city.yields.food)} - {formatValue(city.foodConsumed)} =
          {formatValue(city.perTurn.food)}
        </Yield>
        <Yield className="text-production-400" label="Production">
          {formatValue(city.perTurn.production)}
        </Yield>
        <Yield className="text-gold" label="Gold">
          {formatValue(city.perTurn.gold)}
        </Yield>
        <Yield className="text-culture-400" label="Culture">
          {formatValue(city.perTurn.culture)}
        </Yield>
        <Yield className="text-knowledge" label="Knowledge">
          {formatValue(city.perTurn.knowledge)}
        </Yield>
      </div>

      <div className="flex justify-center mt-2">
        <Button className="margin-h margin-top" onClick={optimizeYields}>
          Optimize yields
        </Button>
      </div>
    </>
  );
}

type YieldProps = PropsWithChildren & {
  className: string;
  label: string;
};
function Yield({ className, label, children }: YieldProps) {
  return (
    <div
      className={clsx(
        className,
        "py-1 flex justify-between border-b-1 border-primary-500 last:border-0",
      )}
    >
      <div className="font-bold mr-5">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function CityExpansion() {
  const city = useCity();

  return (
    <Tooltip
      content={
        <div className="text-culture">
          {formatValue(city.totalCulture)} (
          {formatValueWithSign(city.perTurn.culture)}) / {city.cultureToExpand}
        </div>
      }
    >
      <ProgressBar
        className="[--progress-bar-color:theme(colors.culture-400)]"
        progress={city.totalCulture}
        nextProgress={city.totalCulture + city.perTurn.culture}
        total={city.cultureToExpand}
      >
        <span className="turns">
          borders will expand in {formatTurns(city.turnsToExpand)} turns
        </span>
      </ProgressBar>
    </Tooltip>
  );
}

function CityProduct() {
  const city = useCity();

  if (!city.product) {
    return null;
  }
  return (
    <EntityTooltip
      entityId={city.product.definition.id}
      context={{ city }}
      placementHorizontal="right"
      placementVertical="center"
    >
      <ProgressBar
        className="[--progress-bar-color:theme(colors.production-400)] [--progress-bar-height:60px]"
        progress={city.totalProduction}
        nextProgress={city.totalProduction + city.perTurn.production}
        total={city.product.definition.cost}
      >
        <div className="w-full flex justify-between items-center">
          <span className="flex items-center">
            <ProductIcon product={city.product} city={city} />
            <span className="font-bold ml-2 text-xl">
              {city.product.definition.name}
            </span>
          </span>
          <span className="text-lg">
            {formatTurns(city.turnsToProductionEnd)} turns
          </span>
        </div>
      </ProgressBar>
    </EntityTooltip>
  );
}

function CityProductsList() {
  const city = useCity();
  const { produce } = useCityView();

  return (
    <div className="grow relative">
      <div className="overflow-y-auto scroll-1 absolute w-full h-full ">
        {city.availableProducts.map((product) => (
          <div
            key={product.definition.id}
            className={clsx(
              "border-t-2 last:border-b-2 border-primary-500 cursor-pointer",
              product.enabled
                ? "hover:bg-primary-500"
                : "bg-gray-900 opacity-40",
            )}
          >
            <EntityTooltip
              entityId={product.definition.id}
              context={{ city }}
              placementHorizontal="right"
              placementVertical="center"
            >
              <div
                className="h-12 px-1 flex items-center justify-between"
                onClick={() => produce(product)}
              >
                <span className="flex items-center">
                  <ProductIcon product={product} city={city} />
                  <span className="ml-2">{product.definition.name}</span>
                </span>
                <span className="text-sm">
                  {formatTurns(product.turnsToProduce)} turns
                </span>
              </div>
            </EntityTooltip>
          </div>
        ))}
      </div>
    </div>
  );
}

type ProductIconProps = {
  city: CityDetailsChanneled;
  product: CityProductChanneled;
};
function ProductIcon({ city, product }: ProductIconProps) {
  if (product.definition.entityType === "unit")
    return (
      <RawUnitIcon
        type={product.definition.strength ? "military" : "civilian"}
        definitionId={product.definition.id}
        primaryColor={city.colors.primary}
        secondaryColor={city.colors.secondary}
        scale={0.4}
      />
    );

  return (
    <ImageIcon
      name={product.definition.id}
      size="small"
      frameType={product.definition.entityType}
    />
  );
}
