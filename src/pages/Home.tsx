import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CardDevice } from "@/components/patterns/CardDevice";
import { AlertCard } from "@/components/patterns/AlertCard";
import { TabBar, type TabKey } from "@/components/patterns/TabBar";

export function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("Home");

  return (
    <div className="relative h-[1006px] w-[375px] bg-neutral-100">
      {/* Container */}
      <div className="absolute top-[44px] left-[24px] flex h-[852px] w-[327px] flex-col">
        {/* Navigation */}
        <div className="flex w-full items-center justify-between">
          <div className="h-[32px] w-[117px] rounded-[4px] bg-neutral-500" />
          <div className="flex items-center gap-[8px]">
            {/* Notification bell */}
            <div className="relative size-[24px]">
              <img
                src="/assets/icon-bell.svg"
                alt="Notifications"
                className="size-full"
              />
              <img
                src="/assets/icon-notification-dot.svg"
                alt=""
                className="absolute -top-[1px] -right-[1px] size-[8px]"
              />
            </div>
            {/* Avatar */}
            <div className="size-[32px]">
              <img
                src="/assets/avatar.svg"
                alt="Avatar"
                className="size-full"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-[24px] flex w-full flex-col gap-[24px]">
          {/* Banner */}
          <div className="flex w-full flex-col gap-[8px] rounded-sm bg-neutral-300 p-[12px]">
            <div className="flex w-full flex-col gap-[4px]">
              <p className="text-body-md font-sans leading-[28px] font-bold text-black">
                Hi Mine,
              </p>
              <div className="flex w-full items-center justify-between">
                <StatusBadge label="Safe" size="md" />
                <p className="text-body-xs leading-body-xs font-sans font-normal text-neutral-700">
                  Active 1 hour ago
                </p>
              </div>
            </div>
          </div>

          {/* SOS Card */}
          <div className="flex w-full items-center gap-[12px] rounded-md bg-neutral-200 p-[12px]">
            {/* SOS Button */}
            <div className="relative flex size-[80px] shrink-0 items-center justify-center rounded-[40px] bg-neutral-400 p-[3.175px]">
              <img
                src="/assets/sos-circle.svg"
                alt=""
                className="size-[73.651px]"
              />
              <p className="absolute top-[24.76px] left-[22.22px] font-sans text-[15.238px] leading-[30.476px] font-bold text-neutral-700">
                SOS
              </p>
            </div>
            {/* SOS Text */}
            <div className="flex flex-1 flex-col gap-[8px]">
              <p className="text-body-sm leading-body-sm font-sans font-medium text-neutral-800">
                Press and hold for 3s to make an emergency call
              </p>
            </div>
          </div>

          {/* Device Sensor Section */}
          <div className="flex w-full flex-col gap-[8px]">
            <SectionTitle title="Device sensor" />
            <div className="flex w-full items-start gap-[16px]">
              <CardDevice
                icon="/assets/icon-device-sensor.svg"
                name="Main door"
                activeTime="Active for 2 hours ago"
                state="Closed"
                batteryLevel="100%"
                batteryIcon="/assets/icon-battery.svg"
                className="flex min-w-0 flex-1 flex-col gap-[8px] rounded-md bg-neutral-300 p-[12px]"
              />
              <CardDevice
                icon="/assets/icon-device-sensor.svg"
                name="Fridge"
                activeTime="Active for 1 hours ago"
                state="Closed"
                batteryLevel="50%"
                batteryIcon="/assets/icon-battery-half.svg"
                className="flex min-w-0 flex-1 flex-col gap-[8px] rounded-md bg-neutral-300 p-[12px]"
              />
            </div>
          </div>

          {/* Recent Alert Section */}
          <div className="flex w-full flex-col gap-[8px]">
            <SectionTitle title="Recent Alert" actionText="Load more" />
            <div className="flex w-full flex-col gap-[8px]">
              <AlertCard
                icon="/assets/icon-device.svg"
                title="Device connect issue"
                timestamp="Aug 4, 10:32"
                description="No signal received for 3 hours"
                secondaryButtonText="Request help"
                primaryButtonText="View device"
              />
              <AlertCard
                icon="/assets/icon-warning-triangle.svg"
                title="Main door no activity"
                timestamp="Aug 4, 10:32"
                description="It's been 36 hours since last door activity"
                secondaryButtonText="Request help"
                primaryButtonText="I'm safe"
              />
              <AlertCard
                icon="/assets/icon-warning-circle.svg"
                title="Fridge door left open"
                timestamp="Aug 4, 10:32"
                description="Open for more than 10 minutes"
                secondaryButtonText="Request help"
                primaryButtonText="I'm safe"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar - outside container, at page level */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="absolute top-[904px] left-0 h-[101px] w-[375px]"
      />
    </div>
  );
}
