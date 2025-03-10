import {
  CityDetailsChanneled,
  CityProductChanneled,
} from "@/core/serialization/channel";
import { ProgressBar, AtlasIcon, Tooltip, Button } from "@/ui/components";
import clsx from "clsx";

import { bridge } from "@/bridge";
import { mapUi } from "../mapUi";
import { ProductTooltip } from "./ProductTooltip";
import { formatTurns } from "@/utils";
import { PropsWithChildren } from "react";

type Props = {
  city: CityDetailsChanneled;
};

export function CityMainPanel({ city }: Props) {
  return (
    <div className="flex flex-col h-full">
      <Section>
        <CityGrowth city={city} />
      </Section>

      <Section title="Yields">
        <CityYields city={city} />
      </Section>

      <Section title="Expansion">
        <CityExpansion city={city} />
      </Section>

      <div className="grow flex flex-col justify-end">
        <div className="text-xl text-center mb-2">Production</div>
        <CityProductsList city={city} />
        <div className="mt-5">
          <CityProduct city={city} />
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

function CityGrowth({ city }: Props) {
  return (
    <div className="flex gap-4 items-center mt-4">
      <div className="text-4xl">{city.size}</div>
      <CityGrowthProgressBar city={city} />
    </div>
  );
}

function CityGrowthProgressBar({ city }: Props) {
  return (
    <Tooltip
      className="grow"
      content=<div className="text-food">
        {city.totalFood.toFixed(1)} (+{city.yields.food}) /{city.foodToGrow}
      </div>
    >
      <ProgressBar
        className="[--progress-bar-color:theme(colors.food)]"
        progress={city.totalFood}
        nextProgress={city.totalFood + city.perTurn.food}
        total={city.foodToGrow}
      >
        {city.perTurn.food > 0 && (
          <span className="turns">will grow in {city.turnsToGrow} turns</span>
        )}

        {city.perTurn.food < 0 && (
          <span className="turns">
            will shrink in {-city.turnsToGrow} turns
          </span>
        )}
        {city.perTurn.food === 0 && (
          <span className="turns">growth stalled</span>
        )}
      </ProgressBar>
    </Tooltip>
  );
}

function CityYields({ city }: Props) {
  async function optimizeYields() {
    const updatedCity = await bridge.cities.optimizeYields(city.id);
    if (updatedCity) {
      mapUi.setCityDetails(updatedCity);
    }
  }

  return (
    <>
      <div className="">
        <Yield className="text-food" label="Food">
          {city.yields.food} - {city.foodConsumed.toFixed(0)} =
          {city.perTurn.food.toFixed(0)}
        </Yield>
        <Yield className="text-production" label="Production">
          {city.perTurn.production}
        </Yield>
        <Yield className="text-culture" label="Culture">
          {city.perTurn.culture}
        </Yield>
        <Yield className="text-publicWorks" label="Public works">
          {city.perTurn.publicWorks}
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
        "py-1 flex justify-between border-b-1 border-primary-500 last:border-0"
      )}
    >
      <div className="font-bold mr-5">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function CityExpansion({ city }: Props) {
  return (
    <Tooltip
      content={
        <div className="text-culture">
          {city.totalCulture.toFixed(1)} (+{city.yields.culture}) /
          {city.cultureToExpand}
        </div>
      }
    >
      <ProgressBar
        className="[--progress-bar-color:theme(colors.culture)]"
        progress={city.totalCulture}
        nextProgress={city.totalCulture + city.perTurn.culture}
        total={city.cultureToExpand}
      >
        <span className="turns">
          borders will expand in {city.turnsToExpand} turns
        </span>
      </ProgressBar>
    </Tooltip>
  );
}

function CityProduct({ city }: Props) {
  return (
    city.product && (
      <ProductTooltip city={city} product={city.product.definition}>
        <ProgressBar
          className="[--progress-bar-color:theme(colors.production)]"
          progress={city.totalProduction}
          nextProgress={city.totalProduction + city.perTurn.production}
          total={city.product.definition.productionCost}
        >
          <div className="w-full flex justify-between items-center">
            <span className="flex items-center">
              <AtlasIcon name={city.product.definition.id} scale={0.3} />
              <span className="font-bold ml-2">
                {city.product.definition.name}
              </span>
            </span>
            <span className="text-sm">{city.turnsToProductionEnd} turns</span>
          </div>
        </ProgressBar>
      </ProductTooltip>
    )
  );
}

function CityProductsList({ city }: Props) {
  async function produce(product: CityProductChanneled) {
    if (!product.enabled) {
      return;
    }
    const updatedCity = await bridge.cities.produce({
      cityId: city.id,
      productId: product.definition.id,
      productType: product.definition.productType,
    });

    if (updatedCity) {
      mapUi.setCityDetails(updatedCity);
    }
  }

  return (
    <div>
      {city.availableProducts.map((product) => (
        <div
          key={product.definition.id}
          className={clsx(
            "border-t-2 last:border-b-2 border-primary-500 cursor-pointer",
            product.enabled
              ? "hover:bg-primary-500"
              : "bg-primary-600 text-gray-400"
          )}
        >
          <ProductTooltip city={city} product={product.definition}>
            <div
              className="py-2 px-4 flex items-center justify-between"
              onClick={() => produce(product)}
            >
              <span className="flex items-center">
                <AtlasIcon name={product.definition.id} scale={0.3} />
                <span className="ml-2">{product.definition.name}</span>
              </span>
              <span className="text-sm">
                {formatTurns(product.turnsToProduce)} turns
              </span>
            </div>
          </ProductTooltip>
        </div>
      ))}
    </div>
  );
}
