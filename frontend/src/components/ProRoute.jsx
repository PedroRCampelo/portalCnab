import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const PLANO_PRO          = "10000000-0000-0000-0000-000000000002";
const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

// Rota exclusiva para assinantes Pro ou Whallet+ (e admin)
// Usuários sem plano são redirecionados para /planos
export default function ProRoute({ children }) {
    const { autenticado, usuario } = useAuth();

    if (!autenticado) return <Navigate to="/login" replace />;

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temPro         = usuario?.planoId === PLANO_PRO;
    const temWhalletPlus = usuario?.planoId === PLANO_WHALLET_PLUS;

    if (!isAdmin && !temPro && !temWhalletPlus) {
        return <Navigate to="/planos" replace />;
    }

    return children;
}