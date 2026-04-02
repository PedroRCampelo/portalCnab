import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Envolve rotas que exigem autenticacao
// Salva a rota tentada para redirecionar de volta apos o login
export default function ProtectedRoute({ children }) {
    const { autenticado } = useAuth();
    const location = useLocation();

    if (!autenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}