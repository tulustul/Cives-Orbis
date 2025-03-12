import { IconArrowLeft } from "@tabler/icons-react";
import { PropsWithChildren } from "react";
import { IconButton } from "../components";
import { useMenu } from "./gameMenuStore";

type Props = PropsWithChildren & {
  title: string;
  extraActions?: React.ReactNode;
};

export function MenuScreen({ title, children, extraActions }: Props) {
  const menu = useMenu();
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="absolute left-0 w-full px-4 flex justify-between">
        <IconButton
          icon={IconArrowLeft}
          onClick={() => menu.setView("main-menu")}
        />
        {extraActions && <div>{extraActions}</div>}
      </div>
      <div className="text-2xl text-center font-bold tracking-wider mb-4">
        {title}
      </div>
      {children}
    </div>
  );
}
