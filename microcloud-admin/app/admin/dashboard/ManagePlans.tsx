import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  plan_id: number;
  plan_name: string;
  vcpu: number;
  ram: number;
  storage: number;
  bandwidth: number;
  price: number;
  available: boolean;
  stock: number;
}

interface FormInputProps {
  label: string;
  type: string;
  value: string | number | boolean;
  onChange: (value: any) => void;
  ref?: React.RefObject<HTMLInputElement>;
  min?: number;
  step?: number;
}

const FormInput = ({ label, type, value, onChange, ref, min, step }: FormInputProps) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-neutral-300 mb-1">{label}</label>
    {type === 'checkbox' ? (
      <input
        ref={ref}
        type="checkbox"
        checked={value as boolean}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-red-500 rounded focus:ring-red-500 focus:ring-2 bg-neutral-800 border-neutral-700"
      />
    ) : (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        min={min}
        step={step}
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
      />
    )}
  </div>
);

export default function ManagePlans() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    plan_name: "",
    vcpu: 1,
    ram: 1,
    storage: 10,
    bandwidth: 1000,
    price: 5,
    available: true,
    stock: 0
  });
  const [error, setError] = useState("");

  const inputRefs = {
    planName: useRef<HTMLInputElement>(null),
    vcpu: useRef<HTMLInputElement>(null),
    ram: useRef<HTMLInputElement>(null),
    storage: useRef<HTMLInputElement>(null),
    bandwidth: useRef<HTMLInputElement>(null),
    price: useRef<HTMLInputElement>(null),
    stock: useRef<HTMLInputElement>(null)
  };

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/plans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      setError("Failed to load plans");
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingPlan;

    try {
      const response = await fetch("/api/plans", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(isEditing ? { plan_id: editingPlan.plan_id, ...formData } : formData),
      });

      if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'add'} plan`);

      isEditing ? setIsEditModalOpen(false) : setIsAddModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      setError(`Failed to ${isEditing ? 'update' : 'add'} plan`);
      console.error("Error:", error);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const response = await fetch(`/api/plans?plan_id=${planId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete plan");
      fetchPlans();
    } catch (error) {
      setError("Failed to delete plan");
      console.error("Error:", error);
    }
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      vcpu: plan.vcpu,
      ram: plan.ram,
      storage: plan.storage,
      bandwidth: plan.bandwidth,
      price: plan.price,
      available: plan.available,
      stock: plan.stock
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      plan_name: "",
      vcpu: 1,
      ram: 1,
      storage: 10,
      bandwidth: 1000,
      price: 5,
      available: true,
      stock: 0
    });
    setEditingPlan(null);
  };

  const Modal = ({ isOpen, onClose, title, children }: any) => {
    useEffect(() => {
      if (isOpen) {
        inputRefs.planName.current?.focus();
      }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-neutral-900 p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          {children}
        </div>
      </div>
    );
  };

  const ModalForm = () => (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Plan Name"
        type="text"
        value={formData.plan_name}
        onChange={(value) => updateFormData('plan_name', value)}
        ref={inputRefs.planName}
      />
      <FormInput
        label="vCPU Cores"
        type="number"
        value={formData.vcpu}
        onChange={(value) => updateFormData('vcpu', value)}
        ref={inputRefs.vcpu}
        min={1}
      />
      <FormInput
        label="RAM (MB)"
        type="number"
        value={formData.ram}
        onChange={(value) => updateFormData('ram', value)}
        ref={inputRefs.ram}
        min={1}
      />
      <FormInput
        label="Storage (GB)"
        type="number"
        value={formData.storage}
        onChange={(value) => updateFormData('storage', value)}
        ref={inputRefs.storage}
        min={10}
      />
      <FormInput
        label="Bandwidth (MBPS)"
        type="number"
        value={formData.bandwidth}
        onChange={(value) => updateFormData('bandwidth', value)}
        ref={inputRefs.bandwidth}
        min={100}
      />
      <FormInput
        label="Price (USD)"
        type="number"
        value={formData.price}
        onChange={(value) => updateFormData('price', value)}
        ref={inputRefs.price}
        min={1}
        step={0.01}
      />
      <FormInput
        label="Stock"
        type="number"
        value={formData.stock}
        onChange={(value) => updateFormData('stock', value)}
        ref={inputRefs.stock}
        min={0}
      />
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.available}
            onChange={(e) => updateFormData('available', e.target.checked)}
            className="w-4 h-4 text-red-500 rounded focus:ring-red-500 focus:ring-2 bg-neutral-800 border-neutral-700"
          />
          <span className="text-sm font-medium text-neutral-300">Available</span>
        </label>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => {
            resetForm();
            editingPlan ? setIsEditModalOpen(false) : setIsAddModalOpen(false);
          }}
          className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
        >
          {editingPlan ? 'Update' : 'Add'} Plan
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-xl font-semibold">Manage Plans</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors duration-200"
          >
            Add Plan
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
          {plans.map((plan) => (
            <div
              key={plan.plan_id}
              className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <h3 className="font-medium text-white">{plan.plan_name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm text-neutral-400">
                  <p>vCPU: {plan.vcpu}</p>
                  <p>RAM: {plan.ram} MB</p>
                  <p>Storage: {plan.storage} GB</p>
                  <p>Bandwidth: {plan.bandwidth} MBPS</p>
                  <p>Price: ${plan.price}</p>
                  <p>Stock: {plan.stock}</p>
                  <p>Status: {plan.available ? 'Available' : 'Unavailable'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => openEditModal(plan)}
                  className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.plan_id)}
                  className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          resetForm();
          setIsAddModalOpen(false);
        }}
        title="Add Plan"
      >
        <ModalForm />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          resetForm();
          setIsEditModalOpen(false);
        }}
        title="Edit Plan"
      >
        <ModalForm />
      </Modal>
    </div>
  );
}
