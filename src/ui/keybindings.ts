import { mapUi } from "./mapUi";

type CommandContext = "map" | "city" | "unit";

export type CommandFn = () => any;

type Command = {
  context: CommandContext;
  fn: CommandFn;
};

const commandsByKeys: Record<string, Command[]> = {};
export const keysByCommands = new Map<CommandFn, string>();

type KeybindingOptions = {
  keybinding: string | string[];
  context: CommandContext;
};

const contextValidators: Record<CommandContext, () => boolean> = {
  map: () => !mapUi.selectedCity,
  city: () => !!mapUi.selectedCity,
  unit: () => !!mapUi.selectedUnit,
};

export function keybinding({ keybinding, context }: KeybindingOptions) {
  return function (_: any, __: string, descriptor: PropertyDescriptor) {
    if (!Array.isArray(keybinding)) {
      keybinding = [keybinding];
    }

    for (const keys of keybinding) {
      if (!commandsByKeys[keys]) {
        commandsByKeys[keys] = [];
      }

      commandsByKeys[keys].push({
        context,
        fn: descriptor.value,
      });
      keysByCommands.set(descriptor.value, keys);
    }

    return descriptor.value;
  };
}

export function processKeybindings(event: KeyboardEvent) {
  const keys = buildKeybindingFromEvent(event);
  if (!keys) {
    return;
  }

  const commands = commandsByKeys[keys];
  if (!commands) {
    return;
  }

  for (const command of commands) {
    if (contextValidators[command.context]()) {
      command.fn();
      return;
    }
  }
}

function buildKeybindingFromEvent(event: KeyboardEvent) {
  let key = event.key.toLowerCase();

  if (key === "control" || key === "alt" || key === "shift") {
    return;
  }

  if (key === " ") {
    key = "space";
  }

  const tokens = [];
  if (event.ctrlKey) {
    tokens.push("ctrl");
  }
  if (event.shiftKey) {
    tokens.push("shift");
  }
  if (event.altKey) {
    tokens.push("alt");
  }

  tokens.push(key.toLowerCase());

  return tokens.join("+");
}
