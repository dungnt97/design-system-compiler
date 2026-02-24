interface HelperActionTextProps {
  text?: string;
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
}

export function HelperActionText({
  text = "Have an account?",
  actionText = "Login",
  onActionClick,
  className,
}: HelperActionTextProps) {
  return (
    <div
      className={
        className ??
        "flex items-center justify-center gap-[8px]"
      }
    >
      <p className="font-sans text-body-xs font-medium leading-body-xs text-center text-neutral-600 whitespace-nowrap">
        {text}
      </p>
      <button
        type="button"
        className="cursor-pointer font-sans text-body-xs-tall font-bold leading-body-xs-tall text-center text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={onActionClick}
      >
        {actionText}
      </button>
    </div>
  );
}
