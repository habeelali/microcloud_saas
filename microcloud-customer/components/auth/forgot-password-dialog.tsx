"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { OTPInput } from "./otp-input";
import axios from "axios";

export function ForgotPasswordDialog() {
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "otp" | "newPassword">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle Email Submit (Send OTP)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents default form submission
    setIsLoading(true);
    try {
      await axios.post("/api/forgot-password", {
        email,
        action: "sendOtp",
      });
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Please check your email for the OTP code.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Submission
  const handleOTPSubmit = async (otp: string) => {
    setIsLoading(true);
    try {
      await axios.post("/api/forgot-password", {
        email,
        action: "validateOtp",
        otp,
      });
      setStep("newPassword");
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents default form submission
    const newPassword = e.currentTarget['newPassword'].value;
    const confirmPassword = e.currentTarget['confirmPassword'].value;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/api/forgot-password", {
        email,
        action: "updatePassword",
        newPassword,
      });
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
      setStep("email");
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0 font-normal">
          Forgot password?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "otp" && "Enter the code sent to your email"}
            {step === "newPassword" && "Enter your new password"}
          </DialogDescription>
        </DialogHeader>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <OTPInput onComplete={handleOTPSubmit} isLoading={isLoading} />
          </div>
        )}

        {step === "newPassword" && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <Input
              name="newPassword"
              type="password"
              placeholder="New password"
              disabled={isLoading}
            />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
