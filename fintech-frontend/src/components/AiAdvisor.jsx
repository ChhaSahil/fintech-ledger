import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageSquare, Send, X, Bot, User, Sparkles } from "lucide-react";

export default function AiAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm your financial AI. Ask me: 'How much did I spend on food?'" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post("http://localhost:8080/api/analytics/ask", 
        userMsg, // Sending string directly as per your Controller
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" } }
      );
      
      setMessages(prev => [...prev, { role: "ai", text: res.data }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "ai", text: "I'm having trouble accessing your ledger right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* 1. CHAT WINDOW */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl border border-indigo-100 flex flex-col mb-4 animate-fade-in-up overflow-hidden ring-1 ring-slate-900/5">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                    <Bot size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Fintech Advisor</h3>
                    <div className="flex items-center gap-1 opacity-80">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-medium">Online</span>
                    </div>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${msg.role === "ai" ? "bg-white border-indigo-100 text-indigo-600" : "bg-violet-100 border-violet-200 text-violet-600"}`}>
                        {msg.role === "ai" ? <Sparkles size={14}/> : <User size={14}/>}
                    </div>
                    <div className={`p-3 text-sm rounded-2xl shadow-sm max-w-[85%] leading-relaxed ${
                        msg.role === "ai" 
                        ? "bg-white border border-indigo-50 text-slate-700 rounded-tl-none" 
                        : "bg-violet-600 text-white rounded-tr-none"
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex gap-3 animate-pulse">
                     <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 flex items-center justify-center"><Bot size={14} className="text-indigo-400"/></div>
                     <div className="bg-slate-200 h-8 w-24 rounded-2xl rounded-tl-none"></div>
                </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
                <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask about spending..."
                    className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 rounded-xl pl-4 pr-12 py-3 text-sm transition-all outline-none"
                />
                <button 
                    onClick={handleSend} 
                    disabled={loading || !input.trim()} 
                    className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg"
                >
                    <Send size={16} />
                </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-slate-400">AI can make mistakes. Check your ledger.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLOATING BUTTON */}
      {!isOpen && (
        <button 
            onClick={() => setIsOpen(true)} 
            className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-lg shadow-indigo-300 hover:shadow-xl hover:shadow-indigo-400 hover:-translate-y-1 transition-all duration-300"
        >
            <MessageSquare size={28} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      )}
    </div>
  );
}