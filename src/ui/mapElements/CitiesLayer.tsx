import { bridge } from "@/bridge";
import { CityChanneled } from "@/shared";
import { camera } from "@/renderer/camera";
import { useObservable } from "@/utils";
import { useEffect, useRef, useState } from "react";
import styles from "./CitiesLayer.module.css";
import { CityInfo } from "./CityInfo";

export function CitiesLayer() {
  const elRef = useRef<HTMLDivElement>(null);

  const [cities, setCities] = useState<CityChanneled[]>([]);

  const gameInfo = useObservable(bridge.game.start$);

  const trackedPlayer = useObservable(bridge.player.tracked$);

  useEffect(() => {
    const updateSubscription = bridge.cities.updated$.subscribe((updated) => {
      const updatedIds = new Set(updated.map((u) => u.id));
      setCities((cities) => {
        const notUpdated = cities.filter((city) => !updatedIds.has(city.id));
        return [...notUpdated, ...updated];
      });
      setTimeout(transform);
    });

    return () => {
      updateSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (gameInfo) {
      build();
    }
  }, [gameInfo, trackedPlayer]);

  useEffect(() => {
    const subscription = camera.transform$.subscribe(transform);
    return () => subscription.unsubscribe();
  }, [camera]);

  async function build() {
    const cities = await bridge.cities.getAllRevealed();
    setCities(cities);
    setTimeout(transform);
  }

  function transform() {
    if (!elRef.current) {
      return;
    }

    const t = camera.transform;

    elRef.current.style.display = t.scale > 30 ? "block" : "none";
  }

  return (
    <div ref={elRef} className={styles.citiesLayer}>
      {cities.map((city) => (
        <CityInfo key={city.id} city={city} />
      ))}
    </div>
  );
}
