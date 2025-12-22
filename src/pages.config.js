import Dashboard from './pages/Dashboard';
import Frota from './pages/Frota';
import Home from './pages/Home';
import Relatorios from './pages/Relatorios';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Frota": Frota,
    "Home": Home,
    "Relatorios": Relatorios,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};