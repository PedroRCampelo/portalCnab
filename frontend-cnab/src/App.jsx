import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import LandingPage        from "./LandingPage.jsx";
import ValidaCnabPage     from "./pages/ValidaCnabPage.jsx";
import ExcelPage          from "./pages/ExcelPage.jsx";
import PdfPage            from "./pages/PdfPage.jsx";
import AssistenteCnabPage from "./pages/AssistenteCnabPage.jsx";
import LoginPage          from "./pages/LoginPage.jsx";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/"                 element={<LandingPage/>}/>
                    <Route path="/login"            element={<LoginPage/>}/>
                    <Route path="/valida-cnab"      element={<ValidaCnabPage/>}/>
                    <Route path="/excel"            element={<ExcelPage/>}/>
                    <Route path="/pdf"              element={<PdfPage/>}/>
                    <Route path="/assistente-cnab"  element={<AssistenteCnabPage/>}/>
                    <Route path="*"                 element={<LandingPage/>}/>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
