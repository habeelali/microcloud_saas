import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Region {
  region_id: number;
  region_name: string;
  available: boolean;
}

export default function ManageRegions() {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [regionName, setRegionName] = useState("");
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleRegionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegionName(e.target.value);
  };

  const handleAvailableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvailable(e.target.checked);
  };

  const fetchRegions = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/regions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch regions");
      const data = await response.json();
      setRegions(data);
    } catch (error) {
      setError("Failed to load regions");
      console.error("Error:", error);
    }
  };

  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/regions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ region_name: regionName, available }),
      });

      if (!response.ok) throw new Error("Failed to add region");

      setIsAddModalOpen(false);
      setRegionName("");
      setAvailable(false);
      fetchRegions();
    } catch (error) {
      setError("Failed to add region");
      console.error("Error:", error);
    }
  };

  const handleEditRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegion) return;

    try {
      const response = await fetch("/api/regions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          region_id: editingRegion.region_id,
          region_name: regionName,
          available,
        }),
      });

      if (!response.ok) throw new Error("Failed to update region");

      setIsEditModalOpen(false);
      setEditingRegion(null);
      setRegionName("");
      setAvailable(false);
      fetchRegions();
    } catch (error) {
      setError("Failed to update region");
      console.error("Error:", error);
    }
  };

  const handleDeleteRegion = async (region_id: number) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`/api/regions?region_id=${region_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete region");

      fetchRegions();
    } catch (error) {
      setError("Failed to delete region");
      console.error("Error:", error);
    }
  };

  const openEditModal = (region: Region) => {
    setEditingRegion(region);
    setRegionName(region.region_name);
    setAvailable(region.available);
    setIsEditModalOpen(true);
  };

  const Modal = ({ isOpen, onClose, title, onSubmit, children }: any) => {
    return (
      <div
        className={`fixed inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-neutral-900 p-6 rounded-lg w-full max-w-md">
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          <form onSubmit={onSubmit}>
            {children}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white 
                  bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 
                  rounded-lg hover:bg-red-600 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      {/* Top Bar */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-xl font-semibold">Manage Regions</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 
              rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 
              focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900
              transition-colors duration-200"
          >
            Add Region
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {regions.map((region) => (
            <div
              key={region.region_id}
              className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 
                flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-white">{region.region_name}</h3>
                <span className={`text-sm ${region.available ? "text-green-500" : "text-red-500"}`}>
                  {region.available ? "Available" : "Unavailable"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(region)}
                  className="px-3 py-1.5 text-sm font-medium text-neutral-400 
                    hover:text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 
                    transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRegion(region.region_id)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 
                    rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Region Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Region"
        onSubmit={handleAddRegion}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Region Name</label>
            <input
              type="text"
              value={regionName}
              onChange={handleRegionNameChange}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg 
                text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="available"
              checked={available}
              onChange={handleAvailableChange}
              className="h-4 w-4 rounded border-neutral-700 text-red-500 
                focus:ring-red-500 focus:ring-offset-neutral-900"
            />
            <label htmlFor="available" className="ml-2 text-sm text-neutral-400">
              Available
            </label>
          </div>
        </div>
      </Modal>

      {/* Edit Region Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Region"
        onSubmit={handleEditRegion}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Region Name</label>
            <input
              type="text"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg 
                text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit-available"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 text-red-500 
                focus:ring-red-500 focus:ring-offset-neutral-900"
            />
            <label htmlFor="edit-available" className="ml-2 text-sm text-neutral-400">
              Available
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
