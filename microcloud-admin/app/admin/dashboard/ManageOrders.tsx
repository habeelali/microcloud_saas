import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search, ChevronDown } from "lucide-react";

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("ascend");
  const [loadingOrder, setLoadingOrder] = useState(null); 

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    const filtered = orders.filter((order) =>
      order.email.toLowerCase().includes(value.toLowerCase()) ||
      order.plan_name.toLowerCase().includes(value.toLowerCase()) ||
      order.region_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleProvision = async (order) => {
    setLoadingOrder(order.email);
    try {
      const response = await fetch("http://143.110.243.146:9999/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: order.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to provision order");
      }

      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error("Error provisioning order:", error);
    } finally {
      setLoadingOrder(null);
    }
  };

  const handleCancel = async (order) => {
    try {
      // Disable the cancel button while the request is being processed
      alert(`Cancelling order for ${order.email}`);
  
      const response = await fetch('/api/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: order.email }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        alert(`Error cancelling order: ${result.error || 'Unknown error occurred'}`);
      } else {
        alert(`Order for ${order.email} cancelled successfully.`);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert('An error occurred while cancelling the order. Please try again later.');
    }
  };
  

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const formatDate = (isoString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(isoString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search by email, plan, or region"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-neutral-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-800">
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Purchase Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Plan</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Region</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Payment Time</th>
              <th className="px-0 py-3 text-left text-sm font-medium text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {currentOrders.map((order) => (
              <tr key={order.email} className="hover:bg-neutral-800/50">
                <td className="px-6 py-4 text-sm text-white">{formatDate(order.purchase_date)}</td>
                <td className="px-6 py-4 text-sm text-white">{order.email}</td>
                <td className="px-6 py-4 text-sm text-white">{order.plan_name}</td>
                <td className="px-6 py-4 text-sm text-white">{order.region_name}</td>
                <td className="px-6 py-4 text-sm text-white">{formatDate(order.timestamp)}</td>
                <td className="px-0 py-4 text-sm text-white">
                  <button
                    onClick={() => handleProvision(order)}
                    disabled={loadingOrder === order.email}
                    className={`px-4 py-2 mr-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      loadingOrder === order.email ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {loadingOrder === order.email ? 'Provisioning...' : 'Provision'}
                  </button>
                  <button
                    onClick={() => handleCancel(order)}
                    disabled={loadingOrder === order.email}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      loadingOrder === order.email ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-neutral-400">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-white disabled:text-neutral-600 hover:bg-neutral-800 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                currentPage === page
                  ? 'bg-red-500 text-white'
                  : 'text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-white disabled:text-neutral-600 hover:bg-neutral-800 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
