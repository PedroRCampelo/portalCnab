import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Rota exclusiva para ADMIN
// Usuarios autenticados sem perfil ADMIN sao redirecionados para /excel
export default function AdminRoute({ children }) {
    const { autenticado, usuario } = useAuth();

    if (!autenticado) return <Navigate to="/login" replace />;
    if (usuario?.perfil !== "ADMIN") return <Navigate to="/excel" replace />;

    return children;
}