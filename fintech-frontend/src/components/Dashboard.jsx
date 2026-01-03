import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AiAdvisor from "./AiAdvisor"; 
import Stats from "./Stats"; // ✅ Ensure this file exists in src/components/
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  LogOut, 
  History, 
  Sparkles, 
  AlertCircle,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  HelpCircle,
  PlusCircle,
  ArrowRight,
  CheckCircle, 
  XCircle, 
  X,
  Brain,
  Pencil,
  Save,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // TOAST STATE 🍞
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ category: "", merchantName: "", amount: "", note: "" });

  // BRAIN MEMORY STATE 🧠
  const [showBrain, setShowBrain] = useState(false);
  const [brainData, setBrainData] = useState([]);

  // MODES: 'RECORD', 'DEPOSIT'
  const [activeTab, setActiveTab] = useState("RECORD");

  // Input States
  const [inputText, setInputText] = useState(""); 
  const [aiFailed, setAiFailed] = useState(false); 

  // Manual Form States 
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("Food"); 
  const [merchant, setMerchant] = useState("");
  // DELETE MODAL STATE 🗑️
  const [deletingTxn, setDeletingTxn] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData(token);
  }, []);

  // Helper: Auto-dismiss toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  // START EDITING
  const startEditing = (txn) => {
    setEditingId(txn.id);
    setEditForm({
      category: txn.category,
      merchantName: txn.merchantName,
      amount: txn.amount,
      note: txn.note || ""
    });
  };

  // SAVE EDIT & TRAIN AI
  const saveEdit = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`http://localhost:8080/api/transactions/${editingId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast("Updated & AI Retrained!", "success");
      setEditingId(null);
      fetchData(token); // Refresh list
    } catch (err) {
      showToast("Failed to update.", "error");
    }
  };

  const confirmDelete = (txn) => {
    setDeletingTxn(txn);
  };

  // 2. EXECUTE DELETE (API CALL)
  const executeDelete = async () => {
    if (!deletingTxn) return;
    
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8080/api/transactions/${deletingTxn.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast("Transaction Deleted", "success");
      setDeletingTxn(null); // Close Modal
      fetchData(token);     // Refresh List
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const fetchData = async (token) => {
    try {
      const res = await axios.get("http://localhost:8080/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
      const calculatedBal = res.data.reduce((acc, txn) => {
        return txn.expense ? acc - parseFloat(txn.amount) : acc + parseFloat(txn.amount);
      }, 0);
      setBalance(calculatedBal);
    } catch (err) {
      console.error("Data load failed", err);
    }
  };

  // 🧠 FETCH AI MEMORY
  const fetchBrainData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8080/api/transactions/training-data", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBrainData(res.data);
      setShowBrain(true);
    } catch (err) {
      showToast("Could not fetch AI memory", "error");
    }
  };

  const getCategoryIcon = (cat) => {
    switch(cat?.toLowerCase()) {
      case 'food': return <Utensils size={18} />;
      case 'travel': return <Car size={18} />;
      case 'shopping': return <ShoppingBag size={18} />;
      case 'bills': return <Zap size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  // 1. AI Recording
  const handleAiRecord = async () => {
    if(!inputText.trim()) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://localhost:8080/api/transactions/ai", 
        { text: inputText }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("AI Recorded your expense!", "success");
      setInputText("");
      fetchData(token);
    } catch (err) {
      setAiFailed(true);
      setNote(inputText); 
      showToast("AI couldn't understand that.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Manual Fallback
  const handleManualFix = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://localhost:8080/api/transactions/spend", {
        amount: parseFloat(amount),
        category: category,
        merchantName: merchant,
        note: note,
        originalText: inputText 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      showToast("Expense Saved & AI Trained!", "success");
      setAiFailed(false);
      setInputText("");
      setAmount(""); setMerchant(""); setNote("");
      fetchData(token);
    } catch (err) {
      showToast("Failed to save expense.", "error");
    }
  };

  // 3. Deposit
  const handleDeposit = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://localhost:8080/api/transactions/deposit", {
        amount: parseFloat(amount),
        source: "User Deposit",
        note: note
      }, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Money Added Successfully!", "success");
      setAmount(""); setNote("");
      fetchData(token);
    } catch (err) {
      showToast("Deposit Failed.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      
      {/* --- TOAST --- */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 animate-slide-in ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <XCircle size={24} />}
          <div>
            <h4 className="font-bold text-sm">{toast.type === "success" ? "Success" : "Error"}</h4>
            <p className="text-sm opacity-90">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:bg-white/20 p-1 rounded-full">
            <X size={18} />
          </button>
        </div>
      )}

      {/* --- NAVBAR --- */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600">
            <Wallet className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">Fintech<span className="text-slate-900">Ledger</span></span>
          </div>
          <button 
            onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} 
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* --- HERO --- */}
        <div className="mb-10">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-200">
            <p className="text-indigo-100 font-medium mb-1">Total Balance</p>
            <h1 className="text-5xl font-bold tracking-tight">
              ₹ {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h1>
            <div className="mt-6 flex gap-4 text-sm font-medium text-indigo-100/80">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><TrendingUp size={14}/> Income</span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><TrendingDown size={14}/> Expenses</span>
            </div>
          </div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COL: INPUT (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button 
                  onClick={() => { setActiveTab("RECORD"); setAiFailed(false); }} 
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "RECORD" ? "text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <Sparkles size={16} /> Record Expense
                </button>
                <button 
                  onClick={() => { setActiveTab("DEPOSIT"); setAiFailed(false); }} 
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "DEPOSIT" ? "text-emerald-600 bg-emerald-50/50 border-b-2 border-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <PlusCircle size={16} /> Add Money
                </button>
              </div>

              <div className="p-6">
                {activeTab === "RECORD" && (
                    <div>
                        {!aiFailed ? (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-slate-500 mb-2">
                                  Use AI to record instantly
                                </label>
                                <div className="relative">
                                  <textarea 
                                      value={inputText}
                                      onChange={(e) => setInputText(e.target.value)}
                                      placeholder="e.g. 'Lunch at McDonalds for 300'"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 h-32 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 resize-none"
                                  />
                                  <div className="absolute bottom-3 right-3 text-xs text-slate-400">Powered by AI</div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                  <button 
                                      onClick={handleAiRecord} 
                                      disabled={loading || !inputText.trim()}
                                      className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-200"
                                  >
                                      {loading ? <span className="animate-pulse">Analyzing...</span> : <>Record Transaction <ArrowRight size={18}/></>}
                                  </button>
                                  {/* 🧠 BRAIN BUTTON */}
                                  <button 
                                      onClick={fetchBrainData}
                                      className="px-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center"
                                      title="View AI Memory"
                                  >
                                      <Brain size={20} />
                                  </button>
                                </div>
                            </div>
                        ) : (
                            /* MANUAL FALLBACK FORM */
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
                                  <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
                                  <div>
                                    <h4 className="text-sm font-bold text-red-700">AI Needs Help</h4>
                                    <p className="text-xs text-red-600 mt-1">We couldn't fully understand "{inputText}". Please verify details below to help us learn.</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold text-slate-700"/>
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-700">
                                      {["Food", "Travel", "Shopping", "Bills", "Other"].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div className="mb-4">
                                  <label className="text-xs font-bold text-slate-500 uppercase">Merchant</label>
                                  <input type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-700"/>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setAiFailed(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                    <button onClick={handleManualFix} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all">Save & Train</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === "DEPOSIT" && (
                  <div className="animate-fade-in">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
                          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 p-3 bg-emerald-50/30 border border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg text-emerald-800 placeholder-emerald-800/20" placeholder="0.00"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source / Note</label>
                        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Monthly Salary" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"/>
                      </div>
                      <button onClick={handleDeposit} className="mt-2 w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">Deposit Funds</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COL: STATS & HISTORY (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* 📊 NEW STATS CHART */}
            <div className="animate-fade-in-up">
                <Stats transactions={history} />
            </div>

            {/* 📜 EXISTING HISTORY LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col max-h-[600px]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                  <History size={18} className="text-slate-400"/> Recent Activity
                </h2>
              </div>
              <div className="p-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p>No transactions yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {history.map((txn) => (
                      <li key={txn.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                        
                        {/* CHECK: ARE WE EDITING THIS ROW? */}
                        {editingId === txn.id ? (
                          // ✏️ EDIT MODE UI
                          <div className="flex items-center gap-2 w-full animate-fade-in">
                            <select 
                              value={editForm.category}
                              onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                              className="p-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-indigo-500"
                            >
                              {["Food", "Travel", "Shopping", "Bills", "Other"].map(c => <option key={c}>{c}</option>)}
                            </select>
                            
                            <input 
                              type="text" 
                              value={editForm.merchantName}
                              onChange={(e) => setEditForm({...editForm, merchantName: e.target.value})}
                              className="p-2 bg-white border border-slate-300 rounded text-sm w-full outline-none focus:border-indigo-500"
                            />
            
                            <input 
                              type="number" 
                              value={editForm.amount}
                              onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                              className="p-2 bg-white border border-slate-300 rounded text-sm w-24 outline-none focus:border-indigo-500"
                            />
            
                            <button onClick={saveEdit} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                              <Save size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          // 👀 VIEW MODE UI
                          <>
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.expense ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                {txn.expense ? getCategoryIcon(txn.category) : <Wallet size={18} />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-700 text-sm">
                                  {txn.merchantName || txn.source || "Transfer"}
                                </p>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    {txn.category} 
                                    {txn.note && <span className="w-1 h-1 bg-slate-300 rounded-full"></span>}
                                    {txn.note}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className={`font-bold text-sm ${txn.expense ? "text-red-600" : "text-emerald-600"}`}>
                                  {txn.expense ? "-" : "+"} ₹{parseFloat(txn.amount).toLocaleString()}
                                </span>
                                {/* EDIT BUTTON (Only shows on hover) */}
                                <button 
                                  onClick={() => startEditing(txn)}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-indigo-600 transition-all"
                                  title="Edit & Fix AI"
                                >
                                  <Pencil size={16} />
                                </button>

                                {/* DELETE */}
                                <button 
                                  onClick={() => confirmDelete(txn)} // 👈 Changed this
                                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <AiAdvisor />

        {/* --- BRAIN MODAL --- */}
        {showBrain && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
                    <button onClick={() => setShowBrain(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
                    <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">🧠 AI Memory (Learned Patterns)</h3>
                    <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-xs text-indigo-700">
                        These examples are injected into the AI context to help it understand your personal spending habits better.
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto space-y-3">
                        {brainData.length === 0 ? <p className="text-gray-500 italic text-center p-4">The AI hasn't learned anything yet. <br/>Correct it manually to train it!</p> : (
                            brainData.map((item) => (
                                <div key={item.id} className="bg-slate-50 p-3 rounded border border-slate-200 text-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-700">"{item.userSentence}"</p>
                                        <p className="text-xs text-slate-400 mt-1">Learned: {item.category} • {item.merchant}</p>
                                    </div>
                                    <span className="font-bold text-indigo-600">₹{item.amount}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
{deletingTxn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative border border-slate-100 transform transition-all scale-100">
            
            {/* Warning Icon */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="bg-red-50 p-3 rounded-full mb-3">
                <AlertTriangle className="text-red-500 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Delete Transaction?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to remove this? This action cannot be undone.
              </p>
            </div>

            {/* Transaction Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Merchant</span>
                <span className="font-bold text-slate-700">{deletingTxn.merchantName || "Unknown"}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-700">{deletingTxn.category}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Amount</span>
                <span className={`font-bold ${deletingTxn.expense ? "text-red-600" : "text-emerald-600"}`}>
                  {deletingTxn.expense ? "-" : "+"} ₹{parseFloat(deletingTxn.amount).toLocaleString()}
                </span>
              </div>
              {deletingTxn.note && (
                <div className="pt-2 mt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-400 italic">"{deletingTxn.note}"</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingTxn(null)} 
                className="flex-1 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
              >
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}