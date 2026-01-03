import {useEffect, useState} from "react";
import axios from "axios";

export default function TransferForm({refreshDashboard}){
    const [receiverId, setReceiverId] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');

    const handleTransfer = async(e) => {
        e.preventDefault();
        setMessage("");
        try{
            const payload = {
                senderId: 1,
                receiverId: parseInt(receiverId),
                amount: parseFloat(amount) 
            };
            const response = await axios.post('http://localhost:8080/api/transfer', payload);
            console.log("Transfer Response: ", response.data);
            setMessage("Transfer successful!");
            setAmount('');
            setReceiverId('');
            refreshDashboard();
        }catch(error){
            console.log("Transfer Error: ", error);
            setMessage("Transfer failed!");
        }
    };
    return (
        <div style={{ border: "1px solid #ccc", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
            <h3>💸 Send Money</h3>
            <form onSubmit={handleTransfer}>
                <div style={{ marginBottom: "10px" }}>
                    <label>Receiver ID: </label>
                    <input 
                        type="number" 
                        value={receiverId}
                        onChange={(e) => setReceiverId(e.target.value)}
                        placeholder="e.g. 2"
                        required 
                        style={{ marginLeft: "10px", padding: "5px" }}
                    />
                </div>
                
                <div style={{ marginBottom: "10px" }}>
                    <label>Amount ($): </label>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 50"
                        required 
                        style={{ marginLeft: "25px", padding: "5px" }}
                    />
                </div>

                <button type="submit" style={{ padding: "8px 15px", backgroundColor: "#007bff", color: "white", border: "none", cursor: "pointer" }}>
                    Send Money
                </button>
            </form>
            {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
        </div>
    )
}