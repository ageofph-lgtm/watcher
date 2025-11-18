import Dashboard from './pages/Dashboard';
import Relatorios from './pages/Relatorios';
import Frota from './pages/Frota';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Relatorios": Relatorios,
    "Frota": Frota,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};