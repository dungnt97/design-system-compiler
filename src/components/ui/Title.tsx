interface TitleProps {
  heading?: string;
  accordingText?: string;
  className?: string;
}

export function Title({
  heading = "Title",
  accordingText = "According text",
  className,
}: TitleProps) {
  return (
    <div
      className={
        className ??
        "flex w-full flex-col items-center text-center whitespace-pre-wrap"
      }
    >
      <p className="w-full font-sans text-h3 font-bold leading-h3 text-black">
        {heading}
      </p>
      <p className="w-full font-sans text-body-sm font-normal leading-body-sm text-neutral-700">
        {accordingText}
      </p>
    </div>
  );
}
