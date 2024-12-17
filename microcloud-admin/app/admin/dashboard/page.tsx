"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import AdminLogs from "./AdminLogs";
import ManageCustomers from "./ManageCustomers";
import ManageRegions from "./ManageRegions";
import ManageNodes from "./ManageNodes";
import ManagePlans from "./ManagePlans";
import ManageInstances from "./ManageInstances";
import ManageTransactions from "./ManageTransactions";
import ManageOrders from "./ManageOrders";
import ManageTickets from "./ManageTickets";

const ROLE_LINKS = {
    superadmin: [
        "dashboard",
        "adminLogs",
        "manageOrders",
        "manageCustomers",
        "manageTransactions",
        "manageInstances",
        "manageNodes",
        "managePlans",
        "manageRegions",
        "manageTickets",
    ],
    customer_support: [
        "dashboard",
        "manageCustomers",
        "manageInstances",
        "manageTickets",
        "manageTransactions",
        "customerLogs",
    ],
    order_department: [
        "dashboard",
        "manageOrders",
        "manageInstances",
        "manageTransactions",
    ],
    region_manager: ["dashboard", "manageRegions", "managePlans", "manageNodes"],
};

export default function Dashboard() {
    const router = useRouter();

    const [stats, setStats] = useState({ total_users: 0, total_instances: 0 });
    const [activeTab, setActiveTab] = useState("dashboard");
    const [allowedLinks, setAllowedLinks] = useState<string[]>([]);
    const [isClient, setIsClient] = useState(false); // State to track if we're on the client-side

    useEffect(() => {
        setIsClient(true); // This ensures the effect is only run in the browser

        if (typeof window !== "undefined") {
            const token = sessionStorage.getItem("authToken");

            if (!token) {
                router.push("/admin/login");
            } else {
                try {
                    const decoded = jwtDecode<{ exp: number }>(token);
                    const currentTime = Math.floor(Date.now() / 1000);

                    if (decoded.exp < currentTime) {
                        sessionStorage.clear();
                        router.push("/admin/login");
                    }
                } catch (error) {
                    console.error("Invalid token:", error);
                    sessionStorage.clear();
                    router.push("/admin/login");
                }
            }

            const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");
            if (roles.length > 0) {
                const allLinks = roles.reduce<string[]>((acc, role) => {
                    return [...new Set([...acc, ...(ROLE_LINKS[role] || [])])];
                }, []);
                setAllowedLinks(allLinks);
            } else {
                router.push("/admin/login"); // Redirect if no roles found
            }
        }

        const fetchStats = async () => {
            try {
                const token = sessionStorage.getItem("authToken");
                const response = await fetch("/api/dashboard-stats", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch stats");
                }
                const data = await response.json();
                console.log("Fetched stats:", data);

                if (Array.isArray(data) && data.length > 0) {
                    setStats(data[0]);
                } else {
                    throw new Error("Invalid data structure");
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
                setError("Unable to load dashboard stats. Please try again later.");
            }
        };

        fetchStats();
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push("/");
    };

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
    };

    const renderLink = (tab: string, label: string, icon: string) => {
        if (!allowedLinks.includes(tab)) return null;

        return (
            <a
                href="#"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${activeTab === tab
                    ? "bg-red-500/10 text-red-500"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                    }`}
                onClick={() => handleTabClick(tab)}
            >
                {icon} | {label}
            </a>
        );
    };

    // Ensure rendering only after the client-side has loaded
    if (!isClient) {
        return null; // Render nothing server-side or during the initial load
    }

    return (
        <div className="flex h-screen bg-neutral-950 text-white">
            {/* Sidebar */}
            <div className="w-64 bg-neutral-900 border-r border-neutral-800">
                <div className="p-6">
                    <h1 className="text-xl font-semibold tracking-tight text-white">Microcloud Admin</h1>
                </div>

                {/* Navigation Menu */}
                <nav className="mt-6">
                    <div className="px-3">
                        <div className="space-y-1">
                            {renderLink("dashboard", "Dashboard", "💻")}
                            {renderLink("adminLogs", "Audit Logs", "📕")}
                            {renderLink("manageOrders", "Manage Orders", "💱")}
                            {renderLink("manageCustomers", "Manage Customers", "🧑🏾‍🦱")}
                            {renderLink("manageTransactions", "Manage Transactions", "💸")}
                            {renderLink("manageInstances", "Manage Instances", "🖥️")}
                            {renderLink("manageNodes", "Manage Nodes", "🌐")}
                            {renderLink("managePlans", "Manage Plans", "🏅")}
                            {renderLink("manageRegions", "Manage Regions", "🌎")}
                            {renderLink("manageTickets", "Manage Tickets", "💬")}
                        </div>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                    <div className="flex items-center justify-end h-full px-6">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500
                rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2
                focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900
                transition-colors duration-200"
                        >
                            Sign out
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">
                    <div
                        className={
                            activeTab === "manageInstances" ||
                                activeTab === "manageNodes" ||
                                activeTab === "managePlans" ||
                                activeTab === "manageRegions" ||
                                activeTab === "manageTransactions"
                                ? ""
                                : "p-8"
                        }
                    >
                        {activeTab === "dashboard" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">Welcome back!</h2>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {/* Total Users */}
                                    <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
                                        <h3 className="text-sm font-medium text-neutral-400">Total Users</h3>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {stats.total_users !== undefined ? stats.total_users : "Loading..."}
                                        </p>
                                    </div>

                                    {/* Total Revenue/Instances */}
                                    <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
                                        <h3 className="text-sm font-medium text-neutral-400">Total Revenue</h3>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {stats.total_instances !== undefined ? "$" + stats.total_instances : "Loading..."}
                                        </p>
                                    </div>

                                    {/* Total Nodes */}
                                    <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
                                        <h3 className="text-sm font-medium text-neutral-400">Total Nodes</h3>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {stats.total_nodes !== undefined ? stats.total_nodes : "Loading..."}
                                        </p>
                                    </div>

                                    {/* Pending Orders */}
                                    <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
                                        <h3 className="text-sm font-medium text-neutral-400">Pending Orders</h3>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {stats.pending_orders !== undefined ? stats.pending_orders : "Loading..."}
                                        </p>
                                    </div>

                                    {/* Open Tickets */}
                                    <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
                                        <h3 className="text-sm font-medium text-neutral-400">Open Tickets</h3>
                                        <p className="mt-2 text-3xl font-semibold text-white">
                                            {stats.open_tickets !== undefined ? stats.open_tickets : "Loading..."}
                                        </p>
                                    </div>

                                    {/* Logged In As */}
                                    <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
                                        <h3 className="text-sm font-medium text-neutral-400">Logged In As</h3>
                                        <p className="mt-2 text-xl font-medium text-white">
                                            {(() => {
                                                const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");
                                                if (roles.length > 0) {
                                                    const roleMap = {
                                                        superadmin: "Super Administrator",
                                                        customer_support: "Customer Support",
                                                        order_department: "Order Management",
                                                        region_manager: "Region Manager",
                                                    };
                                                    return roleMap[roles[0]] || "Unknown Role";
                                                }
                                                return "No Role Found";
                                            })()}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        )}
                        {activeTab === "adminLogs" && <AdminLogs />}
                        {activeTab === "manageRegions" && <ManageRegions />}
                        {activeTab === "manageCustomers" && <ManageCustomers />}
                        {activeTab === "manageTransactions" && <ManageTransactions />}
                        {activeTab === "manageNodes" && <ManageNodes />}
                        {activeTab === "manageInstances" && <ManageInstances />}
                        {activeTab === "managePlans" && <ManagePlans />}
                        {activeTab === "manageOrders" && <ManageOrders />}
                        {activeTab === "manageTickets" && <ManageTickets />}
                    </div>
                </main>
            </div>
        </div>
    );
}
