import { StatusBadge } from "@/components/ui/StatusBadge";

interface CardDeviceProps {
  icon?: string;
  name?: string;
  activeTime?: string;
  state?: string;
  batteryLevel?: string;
  batteryIcon?: string;
  className?: string;
}

export function CardDevice({
  icon = "/assets/icon-device-sensor.svg",
  name = "Main door",
  activeTime = "Active for 2 hours ago",
  state = "Closed",
  batteryLevel = "100%",
  batteryIcon = "/assets/icon-battery.svg",
  className,
}: CardDeviceProps) {
  return (
    <div
      className={
        className ??
        "flex flex-col gap-[8px] rounded-md bg-neutral-300 p-[12px]"
      }
    >
      {/* Icon + Status Badge */}
      <div className="flex w-full items-start justify-between">
        <div className="size-[24px] overflow-clip">
          <img src={icon} alt="" className="size-full" />
        </div>
        <StatusBadge label="Active" size="sm" />
      </div>

      {/* Name + Activity */}
      <div className="flex w-full flex-col items-start">
        <p className="text-body-md leading-body-md w-full font-sans font-medium text-black">
          {name}
        </p>
        <p className="text-body-xs leading-body-xs w-full font-sans font-normal text-neutral-700">
          {activeTime}
        </p>
      </div>

      {/* State + Battery */}
      <div className="flex w-full flex-1 items-center justify-between">
        <p className="text-body-xs leading-body-xs flex-1 font-sans font-medium text-black">
          {state}
        </p>
        <div className="flex flex-1 items-center gap-[4px]">
          <div className="size-[24px] overflow-clip">
            <img src={batteryIcon} alt="" className="size-full" />
          </div>
          <p className="text-body-xs leading-body-xs font-sans font-normal text-black">
            {batteryLevel}
          </p>
        </div>
      </div>
    </div>
  );
}
