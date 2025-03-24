import { Routes, Route } from "react-router-dom"

// auth
import LogIn from "./pages/auth/LogIn"
import Register from "./pages/auth/Register"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword from "./pages/auth/ResetPassword"

//editor
import Dashboard from "./pages/editor/Dashboard"

function App() {

  return (
    <Routes>
      {/* auth */}
      <Route path="/" element={<LogIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* editor */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
