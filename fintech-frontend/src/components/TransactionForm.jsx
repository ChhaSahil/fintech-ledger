import { useState } from 'react';
import axios from 'axios';

export default function TransactionForm({ refreshDashboard, accountId }) {
    // Standard AI Input
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    // 🆕 Manual Mode State (Hidden by default)
    const [showManual, setShowManual] = useState(false);
    const [manualData, setManualData] = useState({
        amount: '',
        category: 'Food', // Default category
        merchantName: '',
        note: ''
    });

    // 1. Try AI First
    const handleAiSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);
        setShowManual(false); // Hide manual form initially

        try {
            const response = await axios.post(
                `${API_URL}/api/transfer/ai?accountId=${accountId}`,
                input,
                { headers: { 'Content-Type': 'text/plain' } }
            );

            setStatus({ type: 'success', msg: `✅ ${response.data.message}` });
            setInput('');
            refreshDashboard();

        } catch (error) {
            console.error("AI Error:", error);
            // 🛑 AI FAILED! Show Error & Reveal Manual Form
            setStatus({ type: 'error', msg: '❌ AI was unsure. Please fill details manually to teach it.' });
            
            // Pre-fill note with what the user typed
            setManualData(prev => ({ ...prev, note: input }));
            setShowManual(true);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Handle Manual "Teaching" Submission
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // A. Record the actual transaction
            await axios.post(`${API_URL}/api/transfer/manual?accountId=${accountId}`, manualData);

            // B. Teach the AI (Send original text + correct values)
            await axios.post(`${API_URL}/api/transfer/train`, {
                userSentence: input, 
                amount: manualData.amount,
                category: manualData.category,
                merchant: manualData.merchantName
            });

            setStatus({ type: 'success', msg: '✅ Saved & Learned! I will remember this pattern.' });
            setInput('');
            setShowManual(false); // Hide form again
            refreshDashboard();

        } catch (error) {
            console.error("Manual Error", error);
            setStatus({ type: 'error', msg: 'Failed to save transaction.' });
        }
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: "20px", marginTop: "20px", borderRadius: "8px", backgroundColor: "#f8f9fa" }}>
            <h3>🤖 AI Expense Recorder</h3>
            
            {/* --- AI INPUT AREA --- */}
            <form onSubmit={handleAiSubmit}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. 'Spent 500 on Pizza'"
                    rows="2"
                    style={{ width: "95%", padding: "10px", marginBottom: "10px" }}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !input}
                    style={{ padding: "8px 15px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    {isLoading ? 'Processing...' : 'Record Expense'}
                </button>
            </form>

            {/* --- STATUS MESSAGE --- */}
            {status && (
                <p style={{ marginTop: "10px", fontWeight: "bold", color: status.type === 'success' ? 'green' : 'red' }}>
                    {status.msg}
                </p>
            )}

            {/* --- MANUAL FORM (Only visible if showManual is TRUE) --- */}
            {showManual && (
                <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px" }}>
                    <h4>📝 Manual Correction (Teaching Mode)</h4>
                    <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        
                        <input 
                            type="number" 
                            placeholder="Amount (₹)" 
                            value={manualData.amount}
                            onChange={e => setManualData({...manualData, amount: e.target.value})}
                            required
                            style={{ padding: "8px" }}
                        />

                        <input 
                            type="text" 
                            placeholder="Merchant (e.g. Starbucks)" 
                            value={manualData.merchantName}
                            onChange={e => setManualData({...manualData, merchantName: e.target.value})}
                            required
                            style={{ padding: "8px" }}
                        />

                        <select 
                            value={manualData.category}
                            onChange={e => setManualData({...manualData, category: e.target.value})}
                            style={{ padding: "8px" }}
                        >
                            <option value="Food">Food</option>
                            <option value="Transport">Transport</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Entertainment">Entertainment</option>
                        </select>

                        <button type="submit" style={{ padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                            Save & Teach AI
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}