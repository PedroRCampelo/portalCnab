import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import { AuthProvider }          from "./context/AuthContext.jsx";
import ProtectedRoute            from "./components/ProtectedRoute.jsx";
import AdminRoute                from "./components/AdminRoute.jsx";
import ScrollToTop               from "./components/ScrollToTop.jsx";
import Navbar                    from "./components/Navbar.jsx";
import BannerEmailPendente       from "./components/BannerEmailPendente.jsx";
import HomePage                  from "./pages/HomePage.jsx";
import ExcelPage                 from "./pages/ExcelPage.jsx";
import PdfPage                   from "./pages/PdfPage.jsx";
import LoginPage                 from "./pages/LoginPage.jsx";
import CadastroPage              from "./pages/CadastroPage.jsx";
import VerificarEmailPage        from "./pages/VerificarEmailPage.jsx";
import EsqueciSenhaPage          from "./pages/EsqueciSenhaPage.jsx";
import RedefinirSenhaPage        from "./pages/RedefinirSenhaPage.jsx";
import AdminUsuariosPage         from "./pages/AdminUsuariosPage.jsx";
import CnabKnowledgePage         from "./pages/CnabKnowledgePage.jsx";
import CnabChatPage              from "./pages/CnabChatPage.jsx";
import AssistenteCnabPage        from "./pages/AssistenteCnabPage.jsx";
import HistoricoPage             from "./pages/HistoricoPage.jsx";
import UpgradePage               from "./pages/UpgradePage.jsx";
import { UpgradeSucessoPage, UpgradeCanceladoPage } from "./pages/UpgradePages.jsx";
import PlanosPage                from "./pages/PlanosPage.jsx";
import TitulosPage               from "./pages/TitulosPage.jsx";
import TiposGastoPage            from "./pages/TiposGastoPage.jsx";
import PreferenciasAlertaPage    from "./pages/PreferenciasAlertaPage.jsx";
import GestaFinanceiraPage       from "./pages/GestaoFinanceiraPage.jsx";
import ValidaCnabPage            from "./pages/ValidaCnabPage.jsx";
import RelatoriosTitulosPage     from "./pages/RelatoriosTitulosPage.jsx";
import ClientesPage from "./pages/ClientesPage.jsx";
import RecebimentosPage from "./pages/RecebimentosPage.jsx";
import FluxoCaixaPage from "./pages/FluxoCaixaPage.jsx";
import ConfiguracoesPage from "./pages/ConfiguracoesPage.jsx";

const AUTH_ROUTES = ["/verificar-email", "/cadastro"];

function AppShell() {
    const { pathname } = useLocation();
    const isAuth = AUTH_ROUTES.some(r => pathname.startsWith(r));

    return (
        <div className={isAuth ? "app-shell app-shell--auth" : "app-shell"}>
            <div className="bg-orb bg-orb--2" aria-hidden="true"/>

            <Navbar/>
            <BannerEmailPendente/>
            <ScrollToTop/>

            <Routes>
                <Route path="/"                element={<HomePage/>}/>
                <Route path="/login"           element={<LoginPage/>}/>
                <Route path="/cadastro"        element={<CadastroPage/>}/>
                <Route path="/verificar-email"  element={<VerificarEmailPage/>}/>
                <Route path="/esqueci-senha"    element={<EsqueciSenhaPage/>}/>
                <Route path="/redefinir-senha"  element={<RedefinirSenhaPage/>}/>

                <Route path="/valida-cnab"  element={<ValidaCnabPage/>}/>
                <Route path="/excel"     element={<ExcelPage/>}/>
                <Route path="/pdf"       element={<PdfPage/>}/>
                <Route path="/historico" element={<ProtectedRoute><HistoricoPage/></ProtectedRoute>}/>
                <Route path="/titulos"            element={<ProtectedRoute><TitulosPage/></ProtectedRoute>}/>
                <Route path="/tipos-gasto"        element={<ProtectedRoute><TiposGastoPage/></ProtectedRoute>}/>
                <Route path="/relatorios-titulos" element={<ProtectedRoute><RelatoriosTitulosPage/></ProtectedRoute>}/>
                <Route path="/preferencias-alerta" element={<ProtectedRoute><PreferenciasAlertaPage/></ProtectedRoute>}/>
                <Route path="/gestao-financeira"  element={<GestaFinanceiraPage/>}/>
                <Route path="/upgrade"   element={<ProtectedRoute><UpgradePage/></ProtectedRoute>}/>
                <Route path="/upgrade/sucesso"   element={<ProtectedRoute><UpgradeSucessoPage/></ProtectedRoute>}/>
                <Route path="/upgrade/cancelado" element={<ProtectedRoute><UpgradeCanceladoPage/></ProtectedRoute>}/>
                <Route path="/assistente-cnab"    element={<AssistenteCnabPage/>}/>
                <Route path="/planos"    element={<PlanosPage/>}/>

                <Route path="/admin/usuarios"       element={<AdminRoute><AdminUsuariosPage/></AdminRoute>}/>
                <Route path="/admin/cnab-knowledge" element={<AdminRoute><CnabKnowledgePage/></AdminRoute>}/>
                <Route path="/admin/cnab-chat"      element={<AdminRoute><CnabChatPage/></AdminRoute>}/>

                <Route path="/clientes" element={<ProtectedRoute><ClientesPage/></ProtectedRoute>}/>
                <Route path="/recebimentos" element={<ProtectedRoute><RecebimentosPage/></ProtectedRoute>}/>
                <Route path="/fluxo-caixa" element={<ProtectedRoute><FluxoCaixaPage/></ProtectedRoute>}/>

                <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage/></ProtectedRoute>}/>
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