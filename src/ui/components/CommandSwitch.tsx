import { ReactNode } from "react";
import { Switch, Tooltip } from ".";

import { CommandFn, keysByCommands } from "@/ui/keybindings";

type Props = {
  command: CommandFn;
  label: string;
  checked: boolean;
  tooltip?: ReactNode;
};

export function CommandSwitch({ command, tooltip, label, checked }: Props) {
  const _tooltip = (
    <>
      {tooltip} ({keysByCommands.get(command)})
    </>
  );

  return (
    <Tooltip content={_tooltip}>
      <Switch onChange={command} label={label} checked={checked} />
    </Tooltip>
  );
}
