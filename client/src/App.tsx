import { Navigate, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/common/Layout";
import { Spinner } from "./components/common/Spinner";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NovaMediacao from "./pages/NovaMediacao";
import Processo from "./pages/Processo";
import Modelos from "./pages/Modelos";
import Cejuscs from "./pages/Cejuscs";
import Perfil from "./pages/Perfil";

function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center text-brand-700">
        <Spinner tamanho={28} />
      </div>
    );
  }
  if (!usuario) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path="/nova-mediacao" element={<RotaProtegida><NovaMediacao /></RotaProtegida>} />
      <Route path="/processos/:id" element={<RotaProtegida><Processo /></RotaProtegida>} />
      <Route path="/modelos" element={<RotaProtegida><Modelos /></RotaProtegida>} />
      <Route path="/cejuscs" element={<RotaProtegida><Cejuscs /></RotaProtegida>} />
      <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
