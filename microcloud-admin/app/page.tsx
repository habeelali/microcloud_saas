"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/new-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error);
                setIsLoading(false);
                return;
            }

            const { token, roles } = await response.json();

            sessionStorage.setItem("authToken", token);
            sessionStorage.setItem("roles", JSON.stringify(roles));

            router.push("/admin/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            setError("An unexpected error occurred. Please try again later.");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-white">
            <div className="w-full max-w-md m-auto px-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl">
                    <div className="p-6 border-b border-neutral-800">
                        <h1 className="text-xl font-semibold tracking-tight text-white text-center">
                            Microcloud Admin Panel
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-sm text-red-400 text-center">{error}</p>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="username" className="block text-sm font-medium text-neutral-400">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-neutral-900 text-white rounded-lg border border-neutral-800
                  focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500
                  transition-colors duration-200 placeholder-neutral-600"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-400">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-neutral-900 text-white rounded-lg border border-neutral-800
                  focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500
                  transition-colors duration-200 placeholder-neutral-600"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500
                rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2
                focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900
                transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
