interface InputProps {
  placeholder?: string;
  label?: string;
  helperText?: string;
  showLabelText?: boolean;
  showHelperText?: boolean;
  showIconLeft?: boolean;
  showIconRight?: boolean;
  type?: "text" | "email" | "password" | "tel";
  className?: string;
}

export function Input({
  placeholder = "Placeholder",
  label = "Label text",
  helperText = "Helper",
  showLabelText = true,
  showHelperText = true,
  showIconLeft = true,
  showIconRight = true,
  type = "text",
  className,
}: InputProps) {
  return (
    <div className={className ?? ""}>
      <div className="flex w-full flex-col items-start gap-[4px]">
        {showLabelText && (
          <p className="w-full font-sans text-body-sm font-medium leading-body-sm text-neutral-800">
            {label}
          </p>
        )}
        <div className="flex h-[40px] w-full items-center justify-between rounded-full border border-neutral-300 bg-white px-[16px] py-[8px]">
          <div className="flex min-h-px min-w-px flex-1 items-center gap-[8px]">
            {showIconLeft && (
              <div className="size-[24px] shrink-0">
                {/* Icon placeholder */}
              </div>
            )}
            <input
              type={type}
              placeholder={placeholder}
              className="min-h-px min-w-px flex-1 cursor-pointer bg-transparent font-sans text-body-sm font-medium leading-body-sm text-black placeholder:text-neutral-500 focus:outline-none focus:ring-0"
            />
          </div>
          {showIconRight && (
            <div className="size-[24px] shrink-0">
              {/* Icon placeholder */}
            </div>
          )}
        </div>
        {showHelperText && (
          <p className="font-sans text-body-xs font-medium leading-body-xs text-neutral-700">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}
