interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={className ?? "relative size-[140px]"}>
      <div className="flex flex-col items-center justify-center p-[2.154px]">
        <div className="flex w-full flex-col items-start">
          <img
            src="/assets/logo.svg"
            alt="IOT Detect Old Person Logo"
            className="h-[122px] w-[135px]"
          />
          <p className="w-full text-center font-sans text-[9.69px] font-semibold uppercase leading-[14.194px] text-primary">
            IOT Detect Old Person
          </p>
        </div>
      </div>
    </div>
  );
}
