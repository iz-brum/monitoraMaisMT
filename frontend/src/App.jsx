import { Routes, Route, Link } from "react-router-dom";
import DashboardIndicadores from '@components/dashboard/DashboardIndicadores'
import DashboardGraficos from '@components/dashboard/DashboardGraficos'
import DashboardMapaCidades from '@components/dashboard/DashboardMapaCidades'
import PlaygroundImportedLayers from './PlaygroundImportedLayers'
import { MapStateProvider } from '@context/MapaContexto';
import ConteudoDinamico from '@components/layout/ConteudoDinamico';
import Home from './report/Home';
import ResumoTestes from './report/ResumoTestes';
import DetalhesCenarios from './report/DetalhesCenarios';
import Estatisticas from './report/Estatisticas';
import { AnaErroProvider } from '@context/AnaErroContext';
import { setRequestDate } from './services/dateControl';
import { AnaDadosProvider } from '@context/AnaDadosContext'; // <-- Adicione esta linha
import './App.css'
import './styles/layout.css'

setRequestDate('hoje');

function App() {
  return (
    <MapStateProvider>
      <AnaErroProvider>
        <AnaDadosProvider>
          <div className="app-layout">
              <Routes>
                <Route path="/" element={
                  <>
                    <div className="section"><DashboardIndicadores /></div>
                    <div className="section"><DashboardMapaCidades /></div>
                    <div className="section last-section"><DashboardGraficos /></div>
                  </>
                } />
                <Route path="/layers-panel" element={
                  <div className="section">
                    <PlaygroundImportedLayers />
                  </div>
                } />
                <Route path="/external" element={<ExternalHUDPage />} />
                <Route path="/relatorio-testes" element={<Home />} />
                <Route path="/relatorio-testes/resumo" element={<ResumoTestes />} />
                <Route path="/relatorio-testes/detalhes" element={<DetalhesCenarios />} />
                <Route path="/relatorio-testes/estatisticas" element={<Estatisticas />} />
              </Routes>
          </div>
        </AnaDadosProvider>
      </AnaErroProvider>
    </MapStateProvider>
  );
}
export default App;

void ExternalHUDPage
function ExternalHUDPage() {
  return (
    <div style={{ background: "#222", minHeight: "100vh", padding: 24 }}>
      <ConteudoDinamico external />
    </div>
  );
}