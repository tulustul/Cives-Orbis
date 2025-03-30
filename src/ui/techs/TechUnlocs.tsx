import { TechDefChanneled } from "@/core/serialization/channel";
import { EntityTooltip } from "@/ui/entity";
import { ImageIcon } from "@/ui/components";

type Props = {
  tech: TechDefChanneled;
};

export function TechUnlocks({ tech }: Props) {
  return (
    <div className="flex gap-[2px]">
      {tech.products.map((p) => (
        <EntityTooltip key={p.id} entityId={p.id}>
          <ImageIcon name={p.id} size="small" frameType={p.entityType} />
        </EntityTooltip>
      ))}
    </div>
  );
}
