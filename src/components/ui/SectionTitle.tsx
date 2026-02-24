interface SectionTitleProps {
  title?: string;
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
}

export function SectionTitle({
  title = "Section title",
  actionText,
  onActionClick,
  className,
}: SectionTitleProps) {
  return (
    <div className={className ?? "flex w-full items-center justify-between"}>
      <p className="text-body-sm-bold leading-body-sm-bold font-sans font-bold text-black">
        {title}
      </p>
      {actionText && (
        <button
          type="button"
          className="text-body-sm leading-body-sm focus:ring-primary cursor-pointer font-sans font-normal text-black focus:ring-2 focus:outline-none"
          onClick={onActionClick}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
