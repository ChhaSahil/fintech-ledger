import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // 👈 Import useNavigate

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate(); // 👈 Create the navigation hook

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    
    try {
      // 1. Send Login Request
      const res = await axios.post("http://localhost:8080/api/auth/login", formData);
      
      // 2. Save the Token
      localStorage.setItem("token", res.data); 

      // 3. CRITICAL FIX: Redirect to Dashboard
      navigate("/dashboard"); 

    } catch (err) {
      console.error(err);
      setError("Invalid Email or Password");
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="border p-2 rounded"
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="border p-2 rounded"
            onChange={handleChange}
            required
          />
          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">
            Login
          </button>
        </form>

        <div className="mt-4 text-center">
            <p className="text-sm">Don't have an account?</p>
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Create one now
            </Link>
        </div>
      </div>
    </div>
  );
}