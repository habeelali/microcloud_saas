import { useState, useEffect, useCallback } from "react";

interface Instance {
  instance_id: number;
  container_id: string;
  plan_name: string;
  node_region: string;
  node_ip: string;
  email: string;
}

export default function ManageInstances() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<Instance[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const fetchInstances = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/instances", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch instances");
      const data = await response.json();
      setInstances(data);
      setFilteredInstances(data);
    } catch (error) {
      setError("Failed to load instances");
      console.error("Error:", error);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const handleSearch = useCallback(() => {
    if (!searchTerm) {
      setFilteredInstances(instances);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = instances.filter(
      (instance) =>
        instance.email.toLowerCase().includes(term) ||
        instance.container_id.toLowerCase().includes(term) ||
        instance.node_ip.toLowerCase().includes(term)
    );
    setFilteredInstances(filtered);
  }, [instances, searchTerm]);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, handleSearch]);

  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-xl font-semibold text-white">Manage Instances</h1>
          <input
            type="text"
            placeholder="Search by email, container ID, or node IP"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {filteredInstances.map((instance) => (
            <div
              key={instance.instance_id}
              className="p-4 bg-neutral-900 rounded-lg border border-neutral-800
                flex flex-col group hover:border-neutral-700 transition-colors"
            >
              <h3 className="font-medium text-white">{instance.plan_name}</h3>
              <p className="text-sm text-neutral-400">Container ID: {instance.container_id}</p>
              <p className="text-sm text-neutral-400">Region: {instance.node_region}</p>
              <p className="text-sm text-neutral-400">Node IP: {instance.node_ip}</p>
              <p className="text-sm text-neutral-400">Email: {instance.email}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
