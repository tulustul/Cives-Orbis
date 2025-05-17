import { CityChanneled } from "@/shared";
import { camera, Transform } from "@/renderer/camera";
import { ProgressBar } from "@/ui/components";
import { useEffect, useRef } from "react";
import styles from "./CitiesLayer.module.css";
import { getTileCoords } from "@/renderer/utils";
import { controls } from "@/renderer/controls";
import { mapUi } from "../mapUi";
import { formatTurns } from "@/utils";
import defenseIcon from "@/assets/ui/defense-icon.png";

type Props = {
  city: CityChanneled;
};

export function CityInfo({ city }: Props) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const subscription = camera.transform$.subscribe(transform);
    return () => subscription.unsubscribe();
  }, [camera]);

  useEffect(() => {
    if (!elRef.current) {
      return;
    }
    elRef.current.style.setProperty("--player-color", city.colors.primary);
  }, [city]);

  function transform(t: Transform) {
    if (!elRef.current) {
      return;
    }

    const box = camera.tileBoundingBox;
    const tile = city.tile;
    if (
      t.scale > 30 &&
      tile.x >= box.xStart &&
      tile.x <= box.xEnd &&
      tile.y >= box.yStart &&
      tile.y <= box.yEnd
    ) {
      elRef.current.style.visibility = "visible";
    } else {
      elRef.current.style.visibility = "hidden";
      return;
    }

    const cityScale = Math.pow(t.scale / 70, 0.4);
    let [x, y] = getTileCoords(tile);
    [x, y] = camera.canvasToScreen(x + 0.5, y + 0.8);
    elRef.current.style.transform = `translate(${x}px, ${y}px) scale(${cityScale})`;
  }

  function getBody() {
    if (city.visibilityLevel === "basic") {
      return (
        <div className="flex items-center bg-black/70 text-xs font-bold px-2 grow">
          {city.name}
        </div>
      );
    }

    return (
      <div className="grow">
        <ProgressBar
          className={styles.growth}
          progress={city.totalFood}
          nextProgress={city.totalFood + city.foodPerTurn}
          total={city.foodToGrow}
        >
          <span className="text-xs font-bold">
            {city.name} ({formatTurns(city.turnsToGrow)})
          </span>
        </ProgressBar>

        <ProgressBar
          className={styles.production}
          progress={city.totalProduction}
          nextProgress={city.totalProduction + city.productionPerTurn}
          total={city.productionRequired ?? 0}
        >
          <span className="text-xs font-bold">
            {city.productName} ({formatTurns(city.turnsToProductionEnd)})
          </span>
        </ProgressBar>
      </div>
    );
  }

  return (
    <div
      className={styles.city}
      ref={elRef}
      onClick={() => mapUi.selectCity(city.id)}
      onMouseDown={(e) => controls.onMouseDown(e.nativeEvent)}
      onMouseUp={() => controls.onMouseUp()}
      onMouseMove={(e) => controls.onMouseMove(e.nativeEvent)}
      onWheel={(e) => controls.onWheel(e.nativeEvent)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="rounded-full flex pointer-events-auto cursor-pointer text-white overflow-hidden border-2 justify-center min-w-[120px]"
        style={{ borderColor: city.colors.primary }}
      >
        <CityDefense city={city} />
        <div
          className="text-xl min-w-[30px] flex items-center justify-center font-semibold"
          style={{
            backgroundColor: city.colors.primary,
            color: city.colors.secondary,
          }}
        >
          {city.size}
        </div>
        {getBody()}
      </div>
    </div>
  );
}

function CityDefense({ city }: { city: CityChanneled }) {
  if (city.defense.strength === 0) {
    return null;
  }

  function getHealthColor() {
    if (city.defense.currentHealth < city.defense.maxHealth * 0.35) {
      return "[--progress-bar-color:theme(colors.danger)]";
    }
    if (city.defense.currentHealth < city.defense.maxHealth * 0.7) {
      return "[--progress-bar-color:theme(colors.warning)]";
    }
    return "[--progress-bar-color:theme(colors.success)]";
  }

  return (
    <div
      className="absolute bg-black/80 text-xs px-1 bottom-[100%] text-[10px] font-semibold border-1 border-b-0 rounded-t-sm flex gap-0.5 items-center"
      style={{ borderColor: city.colors.primary }}
    >
      <img src={defenseIcon} className="w-[10px]" />
      <span>{city.defense.strength}</span>
      {city.defense.currentHealth < city.defense.maxHealth && (
        <ProgressBar
          className={`[--progress-bar-height:3px] ${getHealthColor()} [--progress-bar-total-color:theme(colors.gray-500)] w-[50px] ml-0.5`}
          progress={city.defense.currentHealth}
          total={city.defense.maxHealth}
        />
      )}
    </div>
  );
}
