import { Routes, Route } from "react-router-dom";
import "./App.css";

import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute      from "./components/ProtectedRoute.jsx";
import AdminRoute          from "./components/AdminRoute.jsx";
import Navbar              from "./components/Navbar.jsx";
import HomePage            from "./pages/HomePage.jsx";
import ExcelPage           from "./pages/ExcelPage.jsx";
import PdfPage             from "./pages/PdfPage.jsx";
import LoginPage           from "./pages/LoginPage.jsx";
import AdminUsuariosPage   from "./pages/AdminUsuariosPage.jsx";

export default function App() {
    return (
        <AuthProvider>
            <div className="app-shell">
                <div className="bg-orb bg-orb--1" aria-hidden="true"/>
                <div className="bg-orb bg-orb--2" aria-hidden="true"/>

                <Navbar/>

                <Routes>
                    <Route path="/"      element={<HomePage/>}/>
                    <Route path="/login" element={<LoginPage/>}/>

                    <Route path="/excel" element={
                        <ProtectedRoute><ExcelPage/></ProtectedRoute>
                    }/>
                    <Route path="/pdf" element={
                        <ProtectedRoute><PdfPage/></ProtectedRoute>
                    }/>

                    {/* Apenas ADMIN acessa */}
                    <Route path="/admin/usuarios" element={
                        <AdminRoute><AdminUsuariosPage/></AdminRoute>
                    }/>
                </Routes>
            </div>
        </AuthProvider>
    );
}