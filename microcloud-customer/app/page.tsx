import { LoginForm } from "@/components/auth/login-form";
import { MicrocloudLogo } from "@/components/microcloud-logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 microcloud-gradient">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <MicrocloudLogo className="h-12 w-12" />
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your dashboard
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Not a customer yet?{" "}
          <a
            href="https://www.microcloud.tech"
            className="font-medium text-primary hover:text-primary/90 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Microcloud today
          </a>
        </p>
      </div>
    </main>
  );
}