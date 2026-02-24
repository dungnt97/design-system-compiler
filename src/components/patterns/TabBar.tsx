export type TabKey = "Home" | "Device" | "Profile" | "Setting";

const tabIcons: Record<TabKey, string> = {
  Home: "/assets/icon-home.svg",
  Device: "/assets/icon-device-tab.svg",
  Profile: "/assets/icon-profile.svg",
  Setting: "/assets/icon-setting.svg",
};

const tabBarBg: Record<TabKey, string> = {
  Home: "/assets/tab-bar-bg-home.svg",
  Device: "/assets/tab-bar-bg-device.svg",
  Profile: "/assets/tab-bar-bg-profile.svg",
  Setting: "/assets/tab-bar-bg-setting.svg",
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "Home", label: "Home" },
  { key: "Device", label: "Device" },
  { key: "Profile", label: "Profile" },
  { key: "Setting", label: "Setting" },
];

interface TabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  className?: string;
}

export function TabBar({ activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div className={className ?? "relative h-[101px] w-[375px]"}>
      {/* Background */}
      <div className="absolute top-[27px] left-0 h-[75px] w-[375px]">
        <img src={tabBarBg[activeTab]} alt="" className="size-full" />
      </div>

      {/* Tab items */}
      <div className="absolute top-0 left-0 flex h-[102px] w-[375px] items-end justify-between px-[24px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`focus:ring-primary flex cursor-pointer flex-col items-center focus:ring-2 focus:outline-none ${
                isActive
                  ? "gap-[19px] px-[12px] pb-[12.5px]"
                  : "gap-[8px] px-[12px] py-[12.5px]"
              }`}
              onClick={() => onTabChange(tab.key)}
            >
              {isActive ? (
                <div className="flex items-start rounded-[44px] bg-neutral-300 p-[15px]">
                  <div className="size-[24px]">
                    <img src={tabIcons[tab.key]} alt="" className="size-full" />
                  </div>
                </div>
              ) : (
                <div className="size-[24px]">
                  <img src={tabIcons[tab.key]} alt="" className="size-full" />
                </div>
              )}
              <p
                className={`text-body-xs leading-body-xs font-sans font-medium ${
                  isActive ? "text-neutral-800" : "text-neutral-700"
                }`}
              >
                {tab.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
