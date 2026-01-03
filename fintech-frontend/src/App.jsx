import{BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import LoginPage from "./components/Auth/LoginPage";
import Dashboard from "./components/Dashboard"
import Register from "./components/Auth/Register";

function App() {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/register" />} />
        </Routes>
      </Router>
    )
} 

export default App