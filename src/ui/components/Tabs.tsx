import { Children, ReactNode, useState } from "react";
import clsx from "clsx";

interface TabProps {
  title: string;
  children: ReactNode;
  onClick?: () => void;
}

interface TabsProps {
  children: ReactNode;
  defaultTab?: number;
}

export function Tab({ children, onClick }: TabProps) {
  return (
    <div className="py-0 px-2" onClick={onClick}>
      {children}
    </div>
  );
}

export function Tabs({ children, defaultTab = 0 }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabs = Children.toArray(children) as React.ReactElement<TabProps>[];

  return (
    <div className="flex flex-col">
      <div className="flex mb-2">
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={clsx(
              "text-center px-3 py-1 cursor-pointer border-b-3 font-semibold text-sm border-amber-200",
              activeTab === index
                ? "border-amber-600 font-semibold"
                : "hover:border-amber-400",
            )}
            onClick={() => setActiveTab(index)}
          >
            {tab.props.title}
          </div>
        ))}
      </div>

      {tabs[activeTab]}
    </div>
  );
}
