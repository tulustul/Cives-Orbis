import { EntityType, Option } from "@/shared";
import { bridge } from "@/bridge";
import { useEffect, useState } from "react";

export function useEntityOptions({
  entityType,
  allowNull,
  sort,
}: {
  entityType: EntityType;
  allowNull?: boolean;
  sort?: boolean;
}): Option<string | null>[] {
  const [options, setOptions] = useState<Option<string | null>[]>([]);

  useEffect(() => {
    getOptions();
  }, []);

  async function getOptions() {
    const options = (await bridge.editor.game.getEntityOptions({
      entityType,
    })) as Option<string | null>[];

    if (sort) {
      options.sort((a, b) => {
        if (a.label < b.label) {
          return -1;
        }
        if (a.label > b.label) {
          return 1;
        }
        return 0;
      });
    }

    if (allowNull) {
      options.unshift({ label: "None", value: null });
    }

    setOptions(options);
  }

  return options;
}
