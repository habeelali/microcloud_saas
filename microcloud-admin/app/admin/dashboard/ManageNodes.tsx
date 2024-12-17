import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Node {
  node_id: number;
  node_ip: string;
  node_ssh_port: number;
  region_name: string;
}

interface Region {
  region_id: number;
  region_name: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, onSubmit, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-neutral-900 rounded-xl border border-neutral-700 w-full max-w-lg shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="border-b border-neutral-800 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4 space-y-4">
              {children}
            </div>
            <div className="border-t border-neutral-800 px-6 py-4 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-700 rounded-lg
                  hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg
                  hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default function ManageNodes() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [formData, setFormData] = useState({
    nodeIp: "",
    nodeSshPort: "",
    nodeRegion: ""
  });
  const [error, setError] = useState("");

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      nodeIp: "",
      nodeSshPort: "",
      nodeRegion: ""
    });
  }, []);

  const fetchNodes = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/nodes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch nodes");
      const data = await response.json();
      setNodes(data);
    } catch (error) {
      setError("Failed to load nodes");
      console.error("Error:", error);
    }
  }, []);

  const fetchRegions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchNodes();
    fetchRegions();
  }, [fetchNodes, fetchRegions]);

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/nodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          node_ip: formData.nodeIp,
          node_ssh_port: parseInt(formData.nodeSshPort),
          node_region: parseInt(formData.nodeRegion)
        }),
      });

      if (!response.ok) throw new Error("Failed to add node");

      setIsAddModalOpen(false);
      resetForm();
      fetchNodes();
    } catch (error) {
      setError("Failed to add node");
      console.error("Error:", error);
    }
  };

  const handleEditNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    try {
      const response = await fetch("/api/nodes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          node_id: editingNode.node_id,
          node_ip: formData.nodeIp,
          node_ssh_port: parseInt(formData.nodeSshPort),
          node_region: parseInt(formData.nodeRegion)
        }),
      });

      if (!response.ok) throw new Error("Failed to update node");

      setIsEditModalOpen(false);
      setEditingNode(null);
      resetForm();
      fetchNodes();
    } catch (error) {
      setError("Failed to update node");
      console.error("Error:", error);
    }
  };

  const handleDeleteNode = async (nodeIp: string) => {
    if (!confirm("Are you sure you want to delete this node?")) return;

    try {
      const response = await fetch(`/api/nodes?node_ip=${nodeIp}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete node");
      fetchNodes();
    } catch (error) {
      setError("Failed to delete node");
      console.error("Error:", error);
    }
  };

  const openEditModal = (node: Node) => {
    setEditingNode(node);
    setFormData({
      nodeIp: node.node_ip,
      nodeSshPort: node.node_ssh_port.toString(),
      nodeRegion: regions.find(region => region.region_name === node.region_name)?.region_id.toString() || ""
    });
    setIsEditModalOpen(true);
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="nodeIp" className="block text-sm font-medium text-neutral-300 mb-1">
          Node IP
        </label>
        <input
          id="nodeIp"
          name="nodeIp"
          type="text"
          value={formData.nodeIp}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors"
          required
        />
      </div>
      <div>
        <label htmlFor="nodeSshPort" className="block text-sm font-medium text-neutral-300 mb-1">
          SSH Port
        </label>
        <input
          id="nodeSshPort"
          name="nodeSshPort"
          type="number"
          value={formData.nodeSshPort}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors"
          required
        />
      </div>
      <div>
        <label htmlFor="nodeRegion" className="block text-sm font-medium text-neutral-300 mb-1">
          Region
        </label>
        <select
          id="nodeRegion"
          name="nodeRegion"
          value={formData.nodeRegion}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors"
          required
        >
          <option value="">Select a region</option>
          {regions.map((region) => (
            <option key={region.region_id} value={region.region_id}>
              {region.region_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-xl font-semibold text-white">Manage Nodes</h1>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg
              hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20
              flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Node
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {nodes.map((node) => (
            <div
              key={node.node_id}
              className="p-4 bg-neutral-900 rounded-lg border border-neutral-800
                flex items-center justify-between group hover:border-neutral-700
                transition-colors"
            >
              <div>
                <h3 className="font-medium text-white">{node.node_ip}</h3>
                <p className="text-sm text-neutral-400">SSH Port: {node.node_ssh_port}</p>
                <p className="text-sm text-neutral-400">Region: {node.region_name}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => openEditModal(node)}
                  className="p-2 text-neutral-400 hover:text-white bg-neutral-800
                    rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteNode(node.node_ip)}
                  className="p-2 text-neutral-400 hover:text-white bg-red-500/20
                    rounded-lg hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Node"
        onSubmit={handleAddNode}
      >
        {renderForm()}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Node"
        onSubmit={handleEditNode}
      >
        {renderForm()}
      </Modal>
    </div>
  );
}
