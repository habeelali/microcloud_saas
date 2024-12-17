"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import QRCode from 'qrcode.react';
export const dynamic = "force-dynamic";

// Constants
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const RECIPIENT_ADDRESS = '6ezBoKUGFxMoBZh3uLpgkntHscgcKvXpqBhkZzJ7HztJ';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

function PaymentPageContent() {
  const searchParams = useSearchParams();

  // State management
  const [connection, setConnection] = useState<Connection | null>(null);
  const [transactionConfirmed, setTransactionConfirmed] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [amountUsd, setAmountUsd] = useState<number | null>(null);
  const [amountSol, setAmountSol] = useState<number | null>(null);
  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidOrder, setIsValidOrder] = useState(false);

  // Get query parameters and initialize
  useEffect(() => {
    if (!searchParams) {
      setError('Missing required parameters (USD amount or order ID)');
      setIsLoading(false);
      return;
    }

    const usdAmount = searchParams.get('planAmount');
    const sessionId = searchParams.get('customerId');

    if (!usdAmount || !sessionId) {
      setError('Missing required parameters (USD amount or order ID)');
      setIsLoading(false);
      return;
    }

    const parsedAmount = parseFloat(usdAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Invalid USD amount provided');
      setIsLoading(false);
      return;
    }

    setAmountUsd(parsedAmount);

    // Validate session ID with the backend using the GET method
    const validateOrder = async () => {
      try {
        const response = await fetch(`/api/order?customerId=${sessionId}&planAmount=${parsedAmount}`, {
          method: 'GET',
        });

        if (!response.ok) {
          const responseBody = await response.text();
          console.error('Validation failed:', responseBody);
          throw new Error('Order with the specified ID and amount does not exist.');
        }

        const data = await response.json();
        console.log('Order validation response:', data);

        if (data.status !== 'Payment Pending') {
          throw new Error('The payment window for this order has expired.');
        }

        // If the order is valid, proceed
        setIsValidOrder(true);

        // Initialize Solana connection
        try {
          const conn = new Connection(SOLANA_RPC_URL, 'confirmed');
          setConnection(conn);
        } catch (e) {
          setError('Failed to establish Solana connection');
          setIsLoading(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to validate order');
        setIsLoading(false);
      }
    };

    validateOrder();
  }, [searchParams]);

  // Fetch initial data and calculate SOL amount
  useEffect(() => {
    if (!connection || !amountUsd || !isValidOrder) return;

    const fetchInitialData = async () => {
      try {
        const [priceResponse, balance] = await Promise.all([
          fetch(COINGECKO_API_URL),
          connection.getBalance(new PublicKey(RECIPIENT_ADDRESS))
        ]);

        if (!priceResponse.ok) {
          throw new Error('Failed to fetch SOL price');
        }

        const priceData = await priceResponse.json();
        const currentSolPrice = priceData.solana.usd;
        setSolPrice(currentSolPrice);

        // Calculate SOL amount based on USD amount and current price
        // Add 1% buffer for price fluctuations
        const calculatedSolAmount = (amountUsd / currentSolPrice) * 1.01;
        setAmountSol(calculatedSolAmount);

        const solBalance = balance / LAMPORTS_PER_SOL;
        setInitialBalance(solBalance);
        setCurrentBalance(solBalance);
        setIsLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch initial data');
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [connection, amountUsd, isValidOrder]);

  // Poll for balance changes
  useEffect(() => {
    if (!connection || !initialBalance || !amountSol || !isValidOrder) return;

    const recipientPublicKey = new PublicKey(RECIPIENT_ADDRESS);
    const customerId = searchParams?.get('customerId');
    const intervalId = setInterval(async () => {
      try {
        const newBalance = await connection.getBalance(recipientPublicKey);
        const newSolBalance = newBalance / LAMPORTS_PER_SOL;
        setCurrentBalance(newSolBalance);

        const receivedAmount = newSolBalance - initialBalance;
        const expectedAmount = amountSol;
        const tolerance = 0.000001;

        if (receivedAmount >= expectedAmount - tolerance) {
          setTransactionConfirmed(true);
          clearInterval(intervalId);

          const senderAddress = await findSenderAddress(connection, RECIPIENT_ADDRESS, initialBalance);
          await updateOrderStatus(customerId, senderAddress, RECIPIENT_ADDRESS, amountSol, amountUsd);
        }
      } catch (e) {
        console.error('Balance polling failed:', e);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [connection, initialBalance, amountSol, isValidOrder]);

  // Function to update order status to "Provisioning"
  const updateOrderStatus = async (
    customerId: string,
    senderAddress: string | null,
    recipientAddress: string,
    amountSol: number,
    amountUsd: number
  ) => {
    try {
      const requestBody = {
        customer_id: customerId,
        from_address: senderAddress || 'Unknown',
        to_address: recipientAddress,
        amount_sol: amountSol,
        amount_usd: amountUsd,
      };

      const response = await fetch('/api/order', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PATCH_API_KEY}`, // Include the API key
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseBody = await response.text();
        console.error('Failed to update order status:', responseBody);
        throw new Error('Failed to update order status');
      }
      try {
        const response = await fetch('/api/sendPaymentEmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customerId }),
        });
    
        const data = await response.json();
    
        if (response.ok) {
          console.log('Success:', data.message);
        } else {
          console.error('Error:', data.message);
        }
      } catch (error) {
        console.error('Request failed:', error);
      }
      console.log('Order status updated successfully:', await response.json());
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const findSenderAddress = async (connection: Connection, recipientAddress: string, initialBalance: number) => {
    const recipientPublicKey = new PublicKey(recipientAddress);

    try {
      const signatures = await connection.getSignaturesForAddress(recipientPublicKey, { limit: 10 });

      for (const { signature } of signatures) {
        const transaction = await connection.getTransaction(signature, { commitment: "confirmed" });

        if (transaction && transaction.meta) {
          const recipientIndex = transaction.transaction.message.accountKeys.findIndex((key) =>
            key.equals(recipientPublicKey)
          );

          const preBalance = transaction.meta.preBalances[recipientIndex] / LAMPORTS_PER_SOL;
          const postBalance = transaction.meta.postBalances[recipientIndex] / LAMPORTS_PER_SOL;

          // Check if this transaction increased the recipient's balance
          if (postBalance - preBalance > 0) {
            // Assume the sender is the first signer
            const senderPublicKey = transaction.transaction.message.accountKeys[0];
            console.log("Sender Address Found:", senderPublicKey.toString());
            return senderPublicKey.toString();
          }
        }
      }
    } catch (error) {
      console.error("Error finding sender address:", error);
    }
    return null;
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; // Prevent scrolling
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100 font-sans">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 bg-center" />

      <div className="relative z-10 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left Pane - Payment Details */}
          <div className="p-8 lg:p-16 flex flex-col justify-center border-r border-red-500/10">
            <div className="space-y-8 max-w-xl">
              <div className="text-left space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">MicroCloud</h1>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                  Complete Payment
                </h2>
                <p className="text-xl text-zinc-400">
                  Send the requested amount in SOL to continue
                </p>
              </div>

              {error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-red-400">
                    <span>⚠️</span>
                    <p>{error}</p>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center gap-3 text-zinc-400 p-8">
                  <div className="w-5 h-5 animate-spin border-2 border-t-transparent border-red-500 rounded-full" />
                  <span>Loading payment details...</span>
                </div>
              ) : (
                isValidOrder && (
                  <div className="bg-zinc-900/50 backdrop-blur-sm p-8 rounded-2xl border border-red-500/10 space-y-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-400">Solana Address</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-black/30 px-3 py-1 rounded-lg">
                            {RECIPIENT_ADDRESS.slice(0, 20)}...{RECIPIENT_ADDRESS.slice(-4)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(RECIPIENT_ADDRESS)}
                            className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                          >
                            {copied ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-zinc-400">📋</span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-red-500/10 pt-4">
                        <span className="text-zinc-400">Amount (USD)</span>
                        <span className="font-mono text-xl text-white">
                          ${amountUsd?.toFixed(2)} USD
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-red-500/10 pt-4">
                        <span className="text-zinc-400">Amount (SOL)</span>
                        <span className="font-mono text-xl text-red-500">
                          {amountSol?.toFixed(6)} SOL
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-red-500/10 pt-4">
                        <span className="text-zinc-400">SOL Price</span>
                        <span className="font-mono">${solPrice?.toFixed(2)} USD</span>
                      </div>

                      <div className="bg-zinc-800/30 p-4 rounded-lg">
                        <p className="text-sm text-zinc-400">
                          A 1% buffer has been added to account for price fluctuations during the transaction.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Pane - QR Code */}
          <div className="p-8 lg:p-16 flex flex-col justify-center items-center bg-black/20 backdrop-blur-sm">
            {!error && !isLoading && solPrice && amountSol && isValidOrder && (
              <div className="space-y-8">
                <div className="bg-zinc-900/50 p-8 rounded-2xl border border-red-500/10 shadow-lg shadow-red-500/5">
                  <QRCode
                    value={`solana:${RECIPIENT_ADDRESS}?amount=${amountSol.toFixed(6)}`}
                    size={280}
                    level="H"
                    includeMargin
                    renderAs="svg"
                  />
                </div>

                {transactionConfirmed ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                    <span className="text-3xl text-green-500 block mb-4">✓</span>
                    <h2 className="text-2xl font-bold text-green-500 mb-2">
                      Payment Confirmed!
                    </h2>
                    <p className="text-green-200">
                      Thank you for your payment.
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-lg">
                      <div className="w-4 h-4 animate-spin border-2 border-t-transparent border-red-500 rounded-full" />
                      <span className="text-zinc-400">Awaiting payment...</span>
                    </div>
                    <p className="text-sm text-zinc-500">
                      Please send the exact amount to complete the transaction
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}

export default PaymentPage;
