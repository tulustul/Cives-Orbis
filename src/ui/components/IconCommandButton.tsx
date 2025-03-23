import { ReactNode } from "react";
import { IconButton, IconButtonProps, Tooltip, TooltipPlacement } from ".";

import { CommandFn, keysByCommands } from "@/ui/keybindings";

type Props = Omit<IconButtonProps, "onClick"> &
  TooltipPlacement & {
    command: CommandFn;
    tooltip?: ReactNode;
  };

export function IconCommandButton({
  command,
  tooltip,
  placementHorizontal,
  placementVertical,
  ...options
}: Props) {
  const _tooltip = (
    <>
      {tooltip} ({keysByCommands.get(command)})
    </>
  );

  return (
    <Tooltip
      content={_tooltip}
      placementHorizontal={placementHorizontal}
      placementVertical={placementVertical}
    >
      <IconButton onClick={command} {...options} />
    </Tooltip>
  );
}
