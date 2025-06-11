import { bridge } from "@/bridge";
import {
  CityDetailsChanneled,
  CityHaveBuildingRequirement,
  CityNeedDistrictRequirement,
  CityNeverRequirement,
  CitySizeRequirement,
  ProductChanneled,
  Requirement,
  RequirementType,
} from "@/shared";
import { Value } from "@/ui/components";
import { useEffect, useState } from "react";

type Props = {
  city: CityDetailsChanneled;
  product: ProductChanneled;
};

export function ProductRequirements({ city, product }: Props) {
  const [failedRequirements, setFailedRequirements] = useState<Requirement[]>(
    [],
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
      {failedRequirements.map((requirement, index) => {
        const renderer = renderers[requirement.type];
        return <div key={index}>{renderer(requirement)}</div>;
      })}
    </div>
  );
}

const renderers: Record<RequirementType, (value: any) => React.ReactNode> = {
  "city.never": (_: CityNeverRequirement) => null,
  "city.isCoastline": (_: CityNeverRequirement) => null,
  "city.haveBuilding": (requirement: CityHaveBuildingRequirement) => (
    <Value>
      <b>{requirement.building}</b> is required
    </Value>
  ),
  "city.size": (requirement: CitySizeRequirement) => (
    <Value>
      City size should be at least <b>{requirement.size}</b>
    </Value>
  ),
  "city.needGoldInTreasury": (_: CitySizeRequirement) => (
    <Value>No gold in treasury</Value>
  ),
  "city.needDistrict": (requirement: CityNeedDistrictRequirement) => (
    <Value>
      <b>{requirement.district}</b> district is required
    </Value>
  ),
};
