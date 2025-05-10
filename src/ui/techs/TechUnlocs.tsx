import { TechDefChanneled } from "@/shared";
import { EntityTooltip } from "@/ui/entity";
import { ImageIcon } from "@/ui/components";

type Props = {
  tech: TechDefChanneled;
};

export function TechUnlocks({ tech }: Props) {
  return (
    <div className="flex gap-[2px]">
      {tech.unlocks.map((p) => (
        <EntityTooltip key={p.id} entityId={p.id}>
          <ImageIcon name={p.id} size="small" frameType={p.entityType} />
        </EntityTooltip>
      ))}
    </div>
  );
}
