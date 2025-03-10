import { Icon as TablerIcon } from "@tabler/icons-react";

type Props = {
  icon: TablerIcon;
};
export function Icon({ icon: Icon_ }: Props) {
  return <Icon_ size={22} color="white" stroke={2} />;
}
