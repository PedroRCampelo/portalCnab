import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import { AuthProvider }          from "./context/AuthContext.jsx";
import ProtectedRoute            from "./components/ProtectedRoute.jsx";
import AdminRoute                from "./components/AdminRoute.jsx";
import Navbar                    from "./components/Navbar.jsx";
import HomePage                  from "./pages/HomePage.jsx";
import ExcelPage                 from "./pages/ExcelPage.jsx";
import PdfPage                   from "./pages/PdfPage.jsx";
import LoginPage                 from "./pages/LoginPage.jsx";
import CadastroPage              from "./pages/CadastroPage.jsx";
import VerificarEmailPage        from "./pages/VerificarEmailPage.jsx";
import AdminUsuariosPage         from "./pages/AdminUsuariosPage.jsx";
import HistoricoPage             from "./pages/HistoricoPage.jsx";
import UpgradePage               from "./pages/UpgradePage.jsx";
import { UpgradeSucessoPage, UpgradeCanceladoPage } from "./pages/UpgradePages.jsx";
import PlanosPage                from "./pages/PlanosPage.jsx";

const AUTH_ROUTES = ["/login", "/cadastro", "/verificar-email"];

function AppShell() {
    const { pathname } = useLocation();
    const isAuth = AUTH_ROUTES.some(r => pathname.startsWith(r));

    return (
        <div className={isAuth ? "app-shell app-shell--auth" : "app-shell"}>
            <div className="bg-orb bg-orb--1" aria-hidden="true"/>
            <div className="bg-orb bg-orb--2" aria-hidden="true"/>

            <Navbar/>

            <Routes>
                <Route path="/"                element={<HomePage/>}/>
                <Route path="/login"           element={<LoginPage/>}/>
                <Route path="/cadastro"        element={<CadastroPage/>}/>
                <Route path="/verificar-email" element={<VerificarEmailPage/>}/>

                <Route path="/excel"     element={<ProtectedRoute><ExcelPage/></ProtectedRoute>}/>
                <Route path="/pdf"       element={<ProtectedRoute><PdfPage/></ProtectedRoute>}/>
                <Route path="/historico" element={<ProtectedRoute><HistoricoPage/></ProtectedRoute>}/>
                <Route path="/upgrade"   element={<ProtectedRoute><UpgradePage/></ProtectedRoute>}/>
                <Route path="/upgrade/sucesso"   element={<ProtectedRoute><UpgradeSucessoPage/></ProtectedRoute>}/>
                <Route path="/upgrade/cancelado" element={<ProtectedRoute><UpgradeCanceladoPage/></ProtectedRoute>}/>
                <Route path="/planos"    element={<PlanosPage/>}/>

                <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuariosPage/></AdminRoute>}/>
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppShell/>
        </AuthProvider>
    );
}