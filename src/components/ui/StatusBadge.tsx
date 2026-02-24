interface StatusBadgeProps {
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  label = "Active",
  size = "sm",
  className,
}: StatusBadgeProps) {
  const dotSize = size === "md" ? "size-[12px]" : "size-[8px]";
  const textSize =
    size === "md"
      ? "text-body-sm font-medium leading-body-sm"
      : "text-body-xs font-medium leading-body-xs";
  const padding = size === "md" ? "px-[16px] py-[4px]" : "px-[8px] py-[4px]";

  return (
    <div
      className={
        className ??
        `bg-success-bg flex items-center gap-[8px] rounded-full ${padding}`
      }
    >
      <img
        src={
          size === "md"
            ? "/assets/icon-status-green-lg.svg"
            : "/assets/icon-status-green-sm.svg"
        }
        alt=""
        className={dotSize}
      />
      <p className={`font-sans ${textSize} text-success`}>{label}</p>
    </div>
  );
}
