import { useState, useEffect, useCallback } from "react";

interface Transaction {
  trx_id: number;
  from_address: string;
  to_address: string;
  amount_sol: number;
  amount_usd: number;
  timestamp: string;
  subscription_id: number;
  trx_type: string;
  email: string;
}

export default function ManageTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      setError("Failed to load transactions");
      console.error("Error:", error);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearch = useCallback(() => {
    if (!searchTerm) {
      setFilteredTransactions(transactions);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = transactions.filter((transaction) =>
      transaction.email.toLowerCase().includes(term)
    );
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm]);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, handleSearch]);

  return (
    <div className="flex-1 flex flex-col bg-neutral-950">
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-xl font-semibold text-white">Manage Transactions</h1>
          <input
            type="text"
            placeholder="Search by email"
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
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.trx_id}
              className="p-4 bg-neutral-900 rounded-lg border border-neutral-800
                flex flex-col group hover:border-neutral-700 transition-colors"
            >
              <h3 className="font-medium text-white">Transaction Type: {transaction.trx_type}</h3>
              <p className="text-sm text-neutral-400">From: {transaction.from_address}</p>
              <p className="text-sm text-neutral-400">To: {transaction.to_address}</p>
              <p className="text-sm text-neutral-400">
                Amount (SOL): {transaction.amount_sol.toFixed(8)}
              </p>
              <p className="text-sm text-neutral-400">Amount (USD): ${transaction.amount_usd.toFixed(2)}</p>
              <p className="text-sm text-neutral-400">Timestamp: {new Date(transaction.timestamp).toLocaleString()}</p>
              <p className="text-sm text-neutral-400">Subscription ID: {transaction.subscription_id}</p>
              <p className="text-sm text-neutral-400">Email: {transaction.email}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
