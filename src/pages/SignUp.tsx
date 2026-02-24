import { Logo } from "@/components/ui/Logo";
import { Title } from "@/components/ui/Title";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { HelperActionText } from "@/components/ui/HelperActionText";

export function SignUp() {
  return (
    <div className="relative h-[812px] w-[375px] bg-neutral-100">
      <div className="absolute top-[44px] left-[24px] flex h-[734px] w-[327px] flex-col items-center justify-between">
        {/* Content Section */}
        <div className="flex w-full flex-col items-center gap-[24px]">
          {/* Logo + Title */}
          <div className="flex w-full flex-col items-center">
            <Logo className="relative size-[140px]" />
            <Title
              heading="Sign up"
              accordingText="Smart. Safe. Comfortable"
              className="flex w-full flex-col items-center text-center whitespace-pre-wrap"
            />
          </div>

          {/* Input Fields */}
          <div className="flex w-full flex-col items-center gap-[12px]">
            {/* Row 1: First name + Last name */}
            <div className="flex w-full items-start gap-[12px]">
              <Input
                placeholder="First name"
                showLabelText={false}
                showHelperText={false}
                showIconLeft={false}
                showIconRight={false}
                className="flex min-h-px min-w-px flex-1 flex-col items-start gap-[4px]"
              />
              <Input
                placeholder="Last name"
                showLabelText={false}
                showHelperText={false}
                showIconLeft={false}
                showIconRight={false}
                className="flex min-h-px min-w-px flex-1 flex-col items-start gap-[4px]"
              />
            </div>

            {/* Row 2: Building number + Room number */}
            <div className="flex w-full items-start gap-[12px]">
              <Input
                placeholder="Building number"
                showLabelText={false}
                showHelperText={false}
                showIconLeft={false}
                showIconRight={false}
                className="flex min-h-px min-w-px flex-1 flex-col items-start gap-[4px]"
              />
              <Input
                placeholder="Room number"
                showLabelText={false}
                showHelperText={false}
                showIconLeft={false}
                showIconRight={false}
                className="flex min-h-px min-w-px flex-1 flex-col items-start gap-[4px]"
              />
            </div>

            {/* Email */}
            <Input
              placeholder="Email"
              type="email"
              showLabelText={false}
              showHelperText={false}
              showIconLeft={false}
              showIconRight={false}
              className="flex w-full flex-col items-start gap-[4px]"
            />

            {/* Phone number */}
            <Input
              placeholder="Phone number"
              type="tel"
              showLabelText={false}
              showHelperText={false}
              showIconLeft={false}
              showIconRight={false}
              className="flex w-full flex-col items-start gap-[4px]"
            />

            {/* Password */}
            <Input
              placeholder="Password"
              type="password"
              showLabelText={false}
              showHelperText={false}
              showIconLeft={false}
              showIconRight={false}
              className="flex w-full flex-col items-start gap-[4px]"
            />

            {/* Confirm password */}
            <Input
              placeholder="Confirm password"
              type="password"
              showLabelText={false}
              showHelperText={false}
              showIconLeft={false}
              showIconRight={false}
              className="flex w-full flex-col items-start gap-[4px]"
            />
          </div>
        </div>

        {/* Button Section */}
        <div className="flex w-full flex-col items-center gap-[12px]">
          <Button
            label="Sign up"
            className="bg-primary focus:ring-primary flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-full px-[16px] py-[8px] focus:ring-2 focus:outline-none"
          />
          <HelperActionText text="Have an account?" actionText="Login" />
        </div>
      </div>
    </div>
  );
}
