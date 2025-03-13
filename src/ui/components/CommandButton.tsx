import { PropsWithChildren, ReactNode } from "react";
import { Button, Tooltip } from ".";

import { CommandFn, keysByCommands } from "@/ui/keybindings";

type Props = PropsWithChildren & {
  command: CommandFn;
  tooltip?: ReactNode;
};

export function CommandButton({ command, tooltip, children }: Props) {
  const _tooltip = (
    <>
      {tooltip} ({keysByCommands.get(command)})
    </>
  );

  return (
    <Tooltip content={_tooltip}>
      <Button onClick={command}>{children}</Button>
    </Tooltip>
  );
}
