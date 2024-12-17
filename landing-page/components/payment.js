import { useEffect, useState } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import QRCode from 'qrcode.react';
import { Loader2, Copy, CheckCircle, AlertCircle } from 'lucide-react';

// Constants
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const RECIPIENT_ADDRESS = '6ezBoKUGFxMoBZh3uLpgkntHscgcKvXpqBhkZzJ7HztJ';
const AMOUNT_USD = 0.01;
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

function App() {
  const [connection, setConnection] = useState(null);
  const [transactionConfirmed, setTransactionConfirmed] = useState(false);
  const [solPrice, setSolPrice] = useState(null);
  const [amountSol, setAmountSol] = useState(null);
  const [initialBalance, setInitialBalance] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const conn = new Connection(SOLANA_RPC_URL, 'confirmed');
    setConnection(conn);
    const recipientPublicKey = new PublicKey(RECIPIENT_ADDRESS);

    const fetchSolPriceAndInitialBalance = async () => {
      try {
        const response = await fetch(COINGECKO_API_URL);
        const data = await response.json();
        const price = data.solana.usd;
        setSolPrice(price);

        const solAmount = AMOUNT_USD / price;
        setAmountSol(solAmount);

        const balance = await conn.getBalance(recipientPublicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
        setInitialBalance(solBalance);
        setCurrentBalance(solBalance);
      } catch (e) {
        setError('Failed to fetch SOL price or initial balance');
        console.error(e);
      }
    };

    fetchSolPriceAndInitialBalance();

    if (initialBalance !== null && amountSol !== null) {
      const intervalId = setInterval(async () => {
        try {
          const newBalance = await conn.getBalance(recipientPublicKey);
          const newSolBalance = newBalance / LAMPORTS_PER_SOL;
          setCurrentBalance(newSolBalance);

          const receivedAmount = newSolBalance - initialBalance;
          const expectedAmount = amountSol;
          const tolerance = 0.000001;

          if (Math.abs(receivedAmount - expectedAmount) < tolerance) {
            setTransactionConfirmed(true);
            clearInterval(intervalId);
          }
        } catch (e) {
          setError('Failed to fetch balance during polling');
          console.error(e);
        }
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [initialBalance, amountSol]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 font-sans">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop')] opacity-5 bg-cover bg-center" />
      
      <div className="relative z-10 min-h-screen">
        <div className="grid grid-cols-2 h-screen">
          {/* Left Pane */}
          <div className="p-12 flex flex-col justify-center border-r border-red-500/10">
            <div className="space-y-6">
              <div className="text-left space-y-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                  Solana Payment
                </h1>
                <p className="text-xl text-gray-400">
                  Send ${AMOUNT_USD.toFixed(2)} in SOL to complete your transaction
                </p>
              </div>

              {solPrice && amountSol ? (
                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-red-500/20 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-gray-400">Solana Address</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-black/30 px-3 py-1 rounded-lg">
                          {RECIPIENT_ADDRESS.slice(0, 20)}...{RECIPIENT_ADDRESS.slice(-4)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(RECIPIENT_ADDRESS)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Amount (SOL)</span>
                      <span className="font-mono text-xl text-red-500">{amountSol.toFixed(6)} SOL</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">SOL Price</span>
                      <span className="font-mono">${solPrice.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading payment details...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-200">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane */}
          <div className="p-12 flex flex-col justify-center items-center">
            {solPrice && amountSol && (
              <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-red-500/20 shadow-lg shadow-red-500/10 flex items-center justify-center">
                  <div className="flex items-center justify-center">
                    <QRCode
                      value={`solana:${RECIPIENT_ADDRESS}?amount=${amountSol.toFixed(6)}`}
                      size={280}
                      level="H"
                      includeMargin
                      renderAs="svg"
                    />
                  </div>
                </div>

                {transactionConfirmed ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-500 mb-2">Payment Confirmed!</h2>
                    <p className="text-green-200">Thank you for your payment.</p>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      <span className="text-gray-400">Awaiting payment confirmation...</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Please ensure you send the exact amount to complete the transaction
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

export default App;