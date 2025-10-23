// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
// (Más adelante importaremos LoginPage, DashboardPage, etc.)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La ruta "/" (raíz) ahora cargará tu HomePage */}
        <Route path="/" element={<HomePage />} />
        
        {/* Aquí pondremos más rutas después, ej:
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        */}
      </Routes>
    </BrowserRouter>
  )
}

export default App