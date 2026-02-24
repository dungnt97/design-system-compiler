interface AlertCardProps {
  icon?: string;
  title?: string;
  timestamp?: string;
  description?: string;
  secondaryButtonText?: string;
  primaryButtonText?: string;
  onSecondaryClick?: () => void;
  onPrimaryClick?: () => void;
  className?: string;
}

export function AlertCard({
  icon = "/assets/icon-device.svg",
  title = "Device connect issue",
  timestamp = "Aug 4, 10:32",
  description = "No signal received for 3 hours",
  secondaryButtonText = "Request help",
  primaryButtonText = "View device",
  onSecondaryClick,
  onPrimaryClick,
  className,
}: AlertCardProps) {
  return (
    <div
      className={
        className ??
        "flex w-full flex-col items-center rounded-lg border border-neutral-600 bg-white p-[12px]"
      }
    >
      <div className="flex w-full items-start gap-[12px]">
        {/* Icon */}
        <div className="flex size-[32px] shrink-0 items-center justify-center rounded-lg bg-neutral-400 p-[4px]">
          <div className="size-[24px] overflow-clip">
            <img src={icon} alt="" className="size-full" />
          </div>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
          {/* Text */}
          <div className="flex w-full flex-col gap-[4px]">
            <div className="flex w-full items-center gap-[40px]">
              <p className="text-body-sm leading-body-sm shrink-0 font-sans font-medium text-black">
                {title}
              </p>
              <p className="text-body-xs leading-body-xs shrink-0 font-sans font-normal text-neutral-700">
                {timestamp}
              </p>
            </div>
            <p className="text-body-xs leading-body-xs w-full font-sans font-normal text-neutral-700">
              {description}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              className="border-primary bg-primary-light focus:ring-primary flex h-[28px] cursor-pointer items-center justify-center rounded-full border px-[16px] py-[8px] focus:ring-2 focus:outline-none"
              onClick={onSecondaryClick}
            >
              <span className="text-body-xs leading-body-xs text-primary font-sans font-medium">
                {secondaryButtonText}
              </span>
            </button>
            <button
              type="button"
              className="bg-primary focus:ring-primary flex h-[28px] cursor-pointer items-center justify-center rounded-full px-[16px] py-[8px] focus:ring-2 focus:outline-none"
              onClick={onPrimaryClick}
            >
              <span className="text-body-xs leading-body-xs font-sans font-medium text-white">
                {primaryButtonText}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
