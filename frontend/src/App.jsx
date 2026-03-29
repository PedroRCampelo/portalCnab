import { Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar    from "./components/Navbar.jsx";
import HomePage  from "./pages/HomePage.jsx";
import ExcelPage from "./pages/ExcelPage.jsx";
import PdfPage   from "./pages/PdfPage.jsx";

export default function App() {
    return (
        <div className="app-shell">
            <div className="bg-orb bg-orb--1" aria-hidden="true"/>
            <div className="bg-orb bg-orb--2" aria-hidden="true"/>

            <Navbar/>

            <Routes>
                <Route path="/"      element={<HomePage/>}/>
                <Route path="/excel" element={<ExcelPage/>}/>
                <Route path="/pdf"   element={<PdfPage/>}/>
                {/* futuro: /login /cadastro /pricing */}
            </Routes>
        </div>
    );
}