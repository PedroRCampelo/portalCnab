import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import { AuthProvider }          from "./context/AuthContext.jsx";
import { ShellProvider }         from "./components/shell/ShellContext.jsx";
import AppLayout                 from "./components/shell/AppLayout.jsx";
import ProtectedRoute            from "./components/ProtectedRoute.jsx";
import AdminRoute                from "./components/AdminRoute.jsx";
import ScrollToTop               from "./components/ScrollToTop.jsx";
import BannerEmailPendente       from "./components/BannerEmailPendente.jsx";

// ── Landing (marketing) ──────────────────────────────────────────────────────
import HomePage                  from "./pages/landing/HomePage.jsx";
import PrivacidadePage           from "./pages/landing/PrivacidadePage.jsx";
import TermosPage                from "./pages/landing/TermosPage.jsx";
import ContatoPage               from "./pages/landing/ContatoPage.jsx";
import LoginPage                 from "./pages/landing/LoginPage.jsx";
import CadastroPage              from "./pages/landing/CadastroPage.jsx";
import VerificarEmailPage        from "./pages/landing/VerificarEmailPage.jsx";
import EsqueciSenhaPage          from "./pages/landing/EsqueciSenhaPage.jsx";
import RedefinirSenhaPage        from "./pages/landing/RedefinirSenhaPage.jsx";
import PlanosPage                from "./pages/landing/PlanosPage.jsx";

// ── App interno (envolvido em AppLayout) ─────────────────────────────────────
import FluxoCaixaPage            from "./pages/app/FluxoCaixaPage.jsx";
import RecebimentosPage          from "./pages/app/RecebimentosPage.jsx";
import ClientesPage              from "./pages/app/ClientesPage.jsx";
import ConfiguracoesPage         from "./pages/app/ConfiguracoesPage.jsx";
import PaywallPage               from "./pages/app/PaywallPage.jsx";
import TitulosPage               from "./pages/app/TitulosPage.jsx";
import TiposGastoPage            from "./pages/app/TiposGastoPage.jsx";
import PreferenciasAlertaPage    from "./pages/app/PreferenciasAlertaPage.jsx";

import RelatoriosPage            from "./pages/app/RelatoriosPage.jsx";
import AgingPagarPage            from "./pages/app/relatorios/AgingPagarPage.jsx";
import PorTipoGastoPage          from "./pages/app/relatorios/PorTipoGastoPage.jsx";
import PorFornecedorPage         from "./pages/app/relatorios/PorFornecedorPage.jsx";

import HistoricoPage             from "./pages/app/HistoricoPage.jsx";
import AssistenteCnabPage        from "./pages/app/AssistenteCnabPage.jsx";
import CnabChatPage              from "./pages/app/CnabChatPage.jsx";

// Páginas de retorno do checkout Stripe
import { UpgradeSucessoPage, UpgradeCanceladoPage } from "./pages/app/UpgradePages.jsx";

// ── Admin (envolvido em AppLayout) ───────────────────────────────────────────
import AdminUsuariosPage         from "./pages/admin/AdminUsuariosPage.jsx";
import CnabKnowledgePage         from "./pages/admin/CnabKnowledgePage.jsx";

// ── Tools (públicas, fora do shell) ──────────────────────────────────────────
import ExcelPage                 from "./pages/tools/ExcelPage.jsx";
import PdfPage                   from "./pages/tools/PdfPage.jsx";
import ValidaCnabPage            from "./pages/tools/ValidaCnabPage.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// Sprint A3.1 · App Shell
//
// Rotas dividas em 5 grupos:
//   1. LANDING_ROUTES — sem sidebar nem topbar (HomePage, Login, Cadastro, Planos, etc)
//   2. APP_ROUTES     — dentro de <AppLayout/> (TopBar + Sidebar)
//   3. PUBLIC_TOOLS   — sem shell, página standalone (ValidaCnab, Excel, Pdf)
//   4. PUBLIC_LEGAL   — sem shell, páginas legais (Privacidade, Termos, Contato)
//   5. UPGRADE        — retorno do Stripe pós-checkout (Sucesso, Cancelado)
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_ROUTES = ["/verificar-email", "/cadastro"];
const LANDING_ROUTES = [
    "/",
    "/login",
    "/cadastro",
    "/esqueci-senha",
    "/redefinir-senha",
    "/planos",
];
const PUBLIC_TOOL_ROUTES  = ["/valida-cnab", "/excel", "/pdf"];
const PUBLIC_LEGAL_ROUTES = ["/privacidade", "/termos", "/contato"];
const UPGRADE_ROUTES      = ["/upgrade/sucesso", "/upgrade/cancelado"];

function AppShell() {
    const { pathname } = useLocation();
    const isAuth     = AUTH_ROUTES.some(r => pathname.startsWith(r));
    const isLanding  = LANDING_ROUTES.includes(pathname);
    const isTool     = PUBLIC_TOOL_ROUTES.some(r => pathname.startsWith(r));
    const isLegal    = PUBLIC_LEGAL_ROUTES.some(r => pathname.startsWith(r));
    const isUpgrade  = UPGRADE_ROUTES.some(r => pathname.startsWith(r));

    // Rotas que usam o shell ERP (com AppLayout):
    //   tudo que NÃO é landing nem tool nem auth nem legal nem upgrade
    const useAppShell = !isLanding && !isAuth && !isTool && !isLegal && !isUpgrade;

    // Em rotas legacy (não-shell), aplicar classe antiga
    const shellClass = isLanding
        ? "app-shell app-shell--fullscreen"
        : (isAuth ? "app-shell app-shell--auth" : "app-shell");

    /* ── Caso 1: rotas que usam AppLayout (ERP shell) ────────────────────── */
    if (useAppShell) {
        return (
            <>
                <ScrollToTop/>
                <Routes>
                    <Route element={<AppLayout/>}>
                        {/* App interno */}
                        <Route path="/fluxo-caixa"         element={<ProtectedRoute><FluxoCaixaPage/></ProtectedRoute>}/>
                        <Route path="/recebimentos"        element={<ProtectedRoute><RecebimentosPage/></ProtectedRoute>}/>
                        <Route path="/clientes"            element={<ProtectedRoute><ClientesPage/></ProtectedRoute>}/>
                        <Route path="/configuracoes"       element={<ProtectedRoute><ConfiguracoesPage/></ProtectedRoute>}/>
                        <Route path="/titulos"             element={<ProtectedRoute><TitulosPage/></ProtectedRoute>}/>
                        <Route path="/tipos-gasto"         element={<ProtectedRoute><TiposGastoPage/></ProtectedRoute>}/>

                        {/* Central de Relatórios */}
                        <Route path="/relatorios"                   element={<ProtectedRoute><RelatoriosPage/></ProtectedRoute>}/>
                        <Route path="/relatorios/aging-pagar"       element={<ProtectedRoute><AgingPagarPage/></ProtectedRoute>}/>
                        <Route path="/relatorios/por-tipo-gasto"    element={<ProtectedRoute><PorTipoGastoPage/></ProtectedRoute>}/>
                        <Route path="/relatorios/por-fornecedor"    element={<ProtectedRoute><PorFornecedorPage/></ProtectedRoute>}/>

                        {/* Rota legada redirecionando pra nova */}
                        <Route path="/relatorios-titulos"   element={<ProtectedRoute><AgingPagarPage/></ProtectedRoute>}/>

                        <Route path="/preferencias-alerta" element={<ProtectedRoute><PreferenciasAlertaPage/></ProtectedRoute>}/>
                        <Route path="/historico"           element={<ProtectedRoute><HistoricoPage/></ProtectedRoute>}/>
                        <Route path="/paywall"             element={<ProtectedRoute><PaywallPage/></ProtectedRoute>}/>

                        {/* IA */}
                        <Route path="/assistente-cnab"     element={<AssistenteCnabPage/>}/>

                        {/* Admin */}
                        <Route path="/admin/usuarios"       element={<AdminRoute><AdminUsuariosPage/></AdminRoute>}/>
                        <Route path="/admin/cnab-knowledge" element={<AdminRoute><CnabKnowledgePage/></AdminRoute>}/>
                        <Route path="/admin/cnab-chat"      element={<AdminRoute><CnabChatPage/></AdminRoute>}/>
                    </Route>
                </Routes>
            </>
        );
    }

    /* ── Caso 2: rotas legacy (landing, auth, tools, legal, upgrade) ──────── */
    return (
        <div className={shellClass}>
            {!isLanding && !isTool && !isLegal && !isUpgrade && <div className="bg-orb bg-orb--2" aria-hidden="true"/>}
            {!isLanding && !isTool && !isLegal && !isUpgrade && <BannerEmailPendente/>}

            <ScrollToTop/>

            <Routes>
                {/* Landing */}
                <Route path="/"                 element={<HomePage/>}/>
                <Route path="/login"            element={<LoginPage/>}/>
                <Route path="/cadastro"         element={<CadastroPage/>}/>
                <Route path="/verificar-email"  element={<VerificarEmailPage/>}/>
                <Route path="/esqueci-senha"    element={<EsqueciSenhaPage/>}/>
                <Route path="/redefinir-senha"  element={<RedefinirSenhaPage/>}/>
                <Route path="/planos"           element={<PlanosPage/>}/>

                {/* Páginas legais públicas */}
                <Route path="/privacidade"      element={<PrivacidadePage/>}/>
                <Route path="/termos"           element={<TermosPage/>}/>
                <Route path="/contato"          element={<ContatoPage/>}/>

                {/* Tools públicas */}
                <Route path="/valida-cnab"      element={<ValidaCnabPage/>}/>
                <Route path="/excel"            element={<ExcelPage/>}/>
                <Route path="/pdf"              element={<PdfPage/>}/>

                {/* Retorno do Stripe pós-checkout */}
                <Route path="/upgrade/sucesso"   element={<UpgradeSucessoPage/>}/>
                <Route path="/upgrade/cancelado" element={<UpgradeCanceladoPage/>}/>
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ShellProvider>
                <AppShell/>
            </ShellProvider>
        </AuthProvider>
    );
}