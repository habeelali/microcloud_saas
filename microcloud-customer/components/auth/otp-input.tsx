"use client";

import { OTPInput as InputOTP } from "input-otp";
import { Dot } from "lucide-react";

interface OTPInputProps {
  onComplete: (otp: string) => void;
  isLoading?: boolean;
}

export function OTPInput({ onComplete, isLoading }: OTPInputProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <InputOTP
        maxLength={6}
        onComplete={onComplete}
        disabled={isLoading}
        render={({ slots }) => (
          <div className="flex gap-2">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className="relative w-10 h-12 text-center border rounded bg-muted"
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center text-2xl ${
                    slot.char ? "visible" : "invisible"
                  }`}
                >
                  {slot.char || <Dot className="w-4 h-4" />}
                </div>
                {slot.input}
              </div>
            ))}
          </div>
        )}
      />
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code sent to your email
      </p>
    </div>
  );
}