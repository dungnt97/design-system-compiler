interface ButtonProps {
  label?: string;
  className?: string;
  onClick?: () => void;
}

export function Button({
  label = "Button",
  className,
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={
        className ??
        "flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-full bg-primary px-[16px] py-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
      }
      onClick={onClick}
    >
      <span className="font-sans text-body-md font-medium leading-body-md text-white">
        {label}
      </span>
    </button>
  );
}
