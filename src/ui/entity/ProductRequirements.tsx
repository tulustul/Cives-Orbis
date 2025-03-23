import { bridge } from "@/bridge";
import {
  CityDetailsChanneled,
  ProductChanneled,
} from "@/core/serialization/channel";
import { useEffect, useState } from "react";
import { Value } from "@/ui/components";

type Props = {
  city: CityDetailsChanneled;
  product: ProductChanneled;
};

export function ProductRequirements({ city, product }: Props) {
  const [failedRequirements, setFailedRequirements] = useState<[string, any][]>(
    []
  );

  useEffect(() => {
    getFailedRequirements();
  }, [city, product]);

  async function getFailedRequirements() {
    const requirements = await bridge.entities.getFailedWeakRequirements({
      cityId: city.id,
      entityId: product.id,
    });
    setFailedRequirements(requirements);
  }

  return (
    <div className="text-red-500">
      {failedRequirements.map(([key, value], index) => (
        <Requirement key={index} type={key} context={value} />
      ))}
    </div>
  );
}

function Requirement({ type, context }: { type: string; context: any }) {
  if (type === "building") {
    return (
      <Value>
        <b>{context.buildingId}</b> is required
      </Value>
    );
  }

  if (type === "size") {
    return (
      <Value>
        City size should be at least <b>{context.size}</b>
      </Value>
    );
  }

  return null;
}
