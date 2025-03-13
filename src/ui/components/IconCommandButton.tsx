import { ReactNode } from "react";
import { IconButton, IconButtonProps, Tooltip } from ".";

import { CommandFn, keysByCommands } from "@/ui/keybindings";

type Props = Omit<IconButtonProps, "onClick"> & {
  command: CommandFn;
  tooltip?: ReactNode;
};

export function IconCommandButton({ command, tooltip, ...options }: Props) {
  const _tooltip = (
    <>
      {tooltip} ({keysByCommands.get(command)})
    </>
  );

  return (
    <Tooltip content={_tooltip}>
      <IconButton onClick={command} {...options} />
    </Tooltip>
  );
}
