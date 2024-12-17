import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronDown } from 'lucide-react';

export default function ManageCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("ascend");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }
        const data = await response.json();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    const filtered = customers.filter((customer) =>
      customer.first_name.toLowerCase().includes(value.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(value.toLowerCase()) ||
      customer.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  };

  const handleSort = (value) => {
    setSortOrder(value);
    setIsDropdownOpen(false);
    const sorted = [...filteredCustomers].sort((a, b) => {
      if (value === "ascend") {
        return a.first_name.localeCompare(b.first_name);
      } else {
        return b.first_name.localeCompare(a.first_name);
      }
    });
    setFilteredCustomers(sorted);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleSaveEditCustomer = async () => {
    const token = sessionStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/customers`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingCustomer)
      });
      if (!response.ok) {
        throw new Error("Failed to update customer");
      }
      // Update the customer list after successful edit
      setFilteredCustomers(filteredCustomers.map((c) =>
        c.customer_id === editingCustomer.customer_id ? editingCustomer : c
      ));
      alert("Customer updated successfully");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const handleDeleteCustomer = async (customer_id) => {
    const token = sessionStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/customers`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customer_id })
      });
      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }
      // Update the customer list after successful deletion
      setFilteredCustomers(filteredCustomers.filter((c) => c.customer_id !== customer_id));
      alert("Customer deleted successfully");
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };


  const renderEditModal = () => {
    if (!isEditModalOpen || !editingCustomer) return null;

    return (
        <>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setIsEditModalOpen(false)}
        />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-full max-w-lg shadow-2xl transform transition-all">
            {/* Modal header */}
            <div className="border-b border-neutral-800 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Edit Customer</h2>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={editingCustomer.first_name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, first_name: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                    transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editingCustomer.last_name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, last_name: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                    transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                    transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                <select
                  value={editingCustomer.status}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                    transition-colors"
                >
                  <option value="Cancelled">Cancelled</option>
                  <option value="Pending Renewal">Pending Renewal</option>
                  <option value="Active">Active</option>
                  <option value="Provisioning">Provisioning</option>
                  <option value="Payment Pending">Payment Pending</option>
                </select>
              </div>
            </div>

            {/* Modal footer */}
            <div className="border-t border-neutral-800 px-6 py-4 flex justify-end gap-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-700 rounded-lg
                  hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditCustomer}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg
                  hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  return (
    <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
      {renderEditModal()}

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        {/* Search Input */}
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg
              text-white placeholder-neutral-400 focus:outline-none focus:ring-2
              focus:ring-red-500 focus:border-transparent"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-neutral-400" />
        </div>

        {/* Sort Dropdown */}
        <div className="relative w-full sm:w-1/3">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg
              text-white flex items-center justify-between hover:bg-neutral-700
              focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <span>
              {sortOrder === "ascend"
                ? "Sort by First Name (Ascending)"
                : "Sort by First Name (Descending)"}
            </span>
            <ChevronDown className="h-5 w-5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute w-full mt-2 bg-neutral-800 border border-neutral-700
              rounded-lg shadow-lg z-10">
              <button
                onClick={() => handleSort("ascend")}
                className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700
                  first:rounded-t-lg"
              >
                Sort by First Name (Ascending)
              </button>
              <button
                onClick={() => handleSort("descend")}
                className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700
                  last:rounded-b-lg"
              >
                Sort by First Name (Descending)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-800">
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Customer ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">First Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Last Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Plan</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Region</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Status</th>
              <th className="px-0 py-3 text-left text-sm font-medium text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {currentCustomers.map((customer) => (
              <tr key={customer.customer_id} className="hover:bg-neutral-800/50">
                <td className="px-6 py-4 text-sm text-white">{customer.customer_id}</td>
                <td className="px-6 py-4 text-sm text-white">{customer.first_name}</td>
                <td className="px-6 py-4 text-sm text-white">{customer.last_name}</td>
                <td className="px-6 py-4 text-sm text-white">{customer.email}</td>
                <td className="px-6 py-4 text-sm text-white">{customer.plan_name}</td>
                <td className="px-6 py-4 text-sm text-white">{customer.region_name}</td>
                <td className="px-6 py-4 text-sm text-white">{customer.status}</td>
                <td className="px-0 py-4 text-sm text-white">
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="px-0 py-1 mr-2 text-sm font-medium text-white bg-white-500 rounded-lg "
                  >
                    🖋️
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.customer_id)}
                    className="px-3 py-1 text-sm font-medium text-white bg-white-500 rounded-lg "
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-white disabled:text-neutral-600
              hover:bg-neutral-800 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page =>
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            )
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <span className="text-neutral-400">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${currentPage === page
                      ? "bg-red-500 text-white"
                      : "text-neutral-400 hover:bg-neutral-800"
                    }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-white disabled:text-neutral-600
              hover:bg-neutral-800 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
