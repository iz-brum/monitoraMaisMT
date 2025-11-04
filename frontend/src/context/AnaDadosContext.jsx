// @file: frontend/src/context/AnaDadosContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { buscarEstacoesANA, buscarMediasDiariasUF } from "@services/anaService";

const AnaDadosContext = createContext();

export function AnaDadosProvider({ children }) {
  const [dados, setDados] = useState(null);
  const [dashboard, setDashboard] = useState(null);     // ← NOVO: guarda { dashboard_resumo, series }
  const [mediasPontos, setMediasPontos] = useState([]); // segue expondo a série para o gráfico
  const [mediaChuvaGeral, setMediaChuvaGeral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregarTudo() {
    setLoading(true);
    setErro(null);
    try {
      const inventario = await buscarEstacoesANA();
      setDados(inventario);

      const resp = await buscarMediasDiariasUF(); // { dashboard_resumo, series }
      setDashboard(resp);
      const series = Array.isArray(resp?.series) ? resp.series : [];
      setMediasPontos(series);

      const last = series.length ? series[series.length - 1] : null;
      setMediaChuvaGeral(typeof last?.media === "number" ? last.media : null);
    } catch (e) {
      setErro(e);
      setDashboard(null);
      setMediasPontos([]);
      setMediaChuvaGeral(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarTudo(); }, []);

  return (
    <AnaDadosContext.Provider
      value={{
        dados,
        dashboard,          // ← use isto no DashboardIndicadores
        mediasPontos,       // usado pelo gráfico
        mediaChuvaGeral,
        loading,
        erro,
        refresh: carregarTudo
      }}
    >
      {children}
    </AnaDadosContext.Provider>
  );
}

export function useAnaDados() {
  return useContext(AnaDadosContext);
}
