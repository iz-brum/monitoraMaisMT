import React from 'react';
import DraggablePortalPanel from '@components/layout/DraggablePortalPanel';
import HUDDinamico from '@components/layout/HUDDinamico';
import { useHUDManager } from '@hooks/useHUDManager';

import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, Customized, ScatterChart, Scatter, CartesianGrid } from 'recharts';

export default function FocoDetalhesFlutuante({ focosSelecionados, onClose }) {
  // console.log('[Debug] focosSelecionados:', focosSelecionados);

  const focosNormalizados = focosSelecionados.map(foco => ({
    ...foco,
    Hora: foco.horaAquisicao, // Normaliza o campo horaAquisicao para Hora
    FRP: foco.potenciaRadiativa, // Normaliza potenciaRadiativa para FRP
    Temp_Brilho: foco.temperaturaBrilho, // Normaliza temperaturaBrilho para Temp_Brilho
    Temp_Sec: foco.temperaturaBrilhoSecundaria, // Normaliza temperaturaBrilhoSecundaria para Temp_Sec
    Satélite: foco.nomeSatelite, // Normaliza nomeSatelite para Satélite
    Sensor: foco.instrumentoSensor, // Normaliza instrumentoSensor para Sensor
    Confiança: foco.nivelConfianca, // Normaliza nivelConfianca para Confiança
    Produto: foco.versaoProduto, // Normaliza versaoProduto para Produto
    Período: foco.indicadorDiaNoite, // Normaliza indicadorDiaNoite para Período
  }));

  const resumoPorPeriodo = Object.entries(
    focosNormalizados.reduce((acc, item) => {
      acc[item.Período] = (acc[item.Período] || 0) + 1;
      return acc;
    }, {})
  ).map(([periodo, count]) => ({
    Período: periodo,
    Focos: count,
  }));

  const mediaPorHora = Object.values(
    focosNormalizados.reduce((acc, item) => {
      if (!acc[item.Hora]) {
        acc[item.Hora] = {
          Hora: item.Hora,
          FRP: 0,
          Temp_Brilho: 0,
          count: 0
        };
      }
      acc[item.Hora].FRP += item.FRP;
      acc[item.Hora].Temp_Brilho += item.Temp_Brilho;
      acc[item.Hora].count += 1;
      return acc;
    }, {})
  ).map(item => ({
    Hora: item.Hora,
    FRP: item.FRP / item.count,
    Temp_Brilho: item.Temp_Brilho / item.count
  }));

  mediaPorHora.sort((a, b) => {
    const [h1, m1] = a.Hora.split(":").map(Number);
    const [h2, m2] = b.Hora.split(":").map(Number);
    return h1 - h2 || m1 - m2;
  });

  const focosOrdenados = [...focosNormalizados]
    .filter(foco => foco.Hora) // Filtra apenas os focos que possuem a propriedade Hora
    .sort((a, b) => {
      const [h1, m1] = a.Hora.split(":").map(Number);
      const [h2, m2] = b.Hora.split(":").map(Number);
      return h1 - h2 || m1 - m2;
    })
    .map((item, index) => ({
      ...item,
      index,
      label: `${item.Hora} - ${item.Satélite}`
    }));

  const temperaturasAgrupadas = Object.values(
    focosNormalizados.reduce((acc, item) => {
      if (!acc[item.Hora]) {
        acc[item.Hora] = {
          Hora: item.Hora,
          Temp_Brilho: 0,
          Temp_Sec: 0,
          count: 0
        };
      }
      acc[item.Hora].Temp_Brilho += item.Temp_Brilho;
      acc[item.Hora].Temp_Sec += item.Temp_Sec || 0;
      acc[item.Hora].count += 1;
      return acc;
    }, {})
  ).map(item => ({
    Hora: item.Hora,
    Temp_Brilho: Number((item.Temp_Brilho / item.count).toFixed(2)),
    Temp_Sec: Number((item.Temp_Sec / item.count).toFixed(2))
  }));

  const resumoPorDataHoraInteira = Object.entries(
    focosNormalizados.reduce((acc, item) => {
      if (item.dataAquisicao && item.Hora) {
        const hora = item.Hora.slice(0, 2) + ':00';
        const chave = `${item.dataAquisicao} ${hora}`;
        acc[chave] = (acc[chave] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([dataHora, count]) => {
    const [data, hora] = dataHora.split(' ');
    return {
      Data: data, // yyyy-mm-dd
      Hora: hora, // hh:00
      Focos: count
    };
  }).sort((a, b) => (a.Data + a.Hora).localeCompare(b.Data + b.Hora));

  const acumuladoFRP = focosOrdenados.reduce((acc, item) => {
    const acumuladoAnterior = acc.length > 0 ? acc[acc.length - 1].FRP_Acumulado : 0;
    const horaInteira = item.Hora?.slice(0, 2); // "06:44" => "06"
    acc.push({
      ...item,
      HoraInteira: `${horaInteira}h`, // ⬅️ Adiciona esse campo
      FRP_Acumulado: +(acumuladoAnterior + item.FRP).toFixed(2)
    });
    return acc;
  }, []);


  const abasIniciais = [
    {
      id: 'tabelaFocos',
      titulo: 'Tabela',
      conteudo: (
        <div className='hud-focos-calor compact'>
          <div>
          </div>
          <div className="hud-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Hora UTC+0</th>
                  <th className="numeric">FRP (MW)</th>
                  <th className="numeric">Temp. Brilho (K)</th>
                  <th className="numeric">Temp. Sec. (K)</th>
                  <th>Satélite</th>
                  <th>Sensor</th>
                  <th className="numeric">Confiança</th>
                  <th>Produto</th>
                  <th>Período</th>
                  <th className="numeric">Varredura (°)</th>
                  <th className="numeric">Trilha (km)</th>
                  <th>Lat</th>
                  <th>Long</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(focosNormalizados) ? focosNormalizados : []).map((foco, index) => (
                  <tr key={index}>
                    <td>{foco.dataAquisicao}</td>
                    <td>{foco.horaAquisicao}</td>
                    <td className="numeric">{foco.potenciaRadiativa}</td>
                    <td className="numeric">{foco.temperaturaBrilho}</td>
                    <td className="numeric">{foco.temperaturaBrilhoSecundaria}</td>
                    <td>{foco.nomeSatelite}</td>
                    <td>{foco.instrumentoSensor}</td>
                    <td className="numeric">{foco.nivelConfianca}</td>
                    <td>{foco.versaoProduto}</td>
                    <td>{foco.indicadorDiaNoite}</td>
                    <td className="numeric">{foco.resolucaoVarredura}</td>
                    <td className="numeric">{foco.resolucaoTrilha}</td>
                    <td>{foco.latitude}</td>
                    <td>{foco.longitude}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'graficoFocos',
      titulo: 'Gráficos',
      conteudo: (
        <div className="hud-focos-calor compact">
          <div className="graficos-container">
            {/* Gráfico de Barras – Focos por Hora */}
            <BarChart width={700} height={300} data={resumoPorDataHoraInteira} margin={{ top: 20, bottom: 20, left: 20 }}>
              <XAxis dataKey="Hora" />
              <YAxis
                label={{
                  value: "Qtd. de Focos",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#555",
                  fontSize: 16,
                  dx: -5,
                  dy: 30
                }}
              />
              <Tooltip
                offset={100}
                formatter={(valor) => [`${valor} focos`, "qtd"]}
                labelFormatter={(_, payload) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload.Data;
                    // Formata para "dd/mm"
                    const [ano, mes, dia] = data.split('-');
                    return `${dia}/${mes}`;
                  }
                  return '';
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Focos" fill="#4caf50" name="Focos de calor /h"
                animationDuration={3500}
                isAnimationActive={true}
              />
            </BarChart>

            {/* Gráfico de Barras – Contagem por Período (Dia/Noite) */}
            <BarChart width={400} height={300} data={resumoPorPeriodo} margin={{ top: 10, bottom: 20, left: 20 }}>
              <XAxis dataKey="Período" />
              <YAxis
                label={{
                  value: "Qtd. de Focos",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#555",
                  fontSize: 16,
                  dx: -5,
                  dy: 30
                }}
              />
              <Tooltip
                offset={40} // distância entre o tooltip e o ponto
                formatter={(valor) => {
                  return [`${valor} focos`, "qtd"]; // nome sobrescrito
                }}
              />
              <Legend verticalAlign="top" height={40} />
              <Bar dataKey="Focos" fill="#ff7043" name="Focos por período"
                animationDuration={3500}
                isAnimationActive={true}
              />
            </BarChart>

            {/* Gráfico de Área – FRP Acumulado */}
            <AreaChart
              width={700}
              height={320}
              data={acumuladoFRP}
              margin={{ top: 10, right: 20, left: 20, bottom: 40 }}
            >
              <defs>
                <linearGradient id="colorFRP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ff7300" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="HoraInteira"
                angle={-25}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />

              <YAxis
                label={{
                  value: "(MW)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#555",
                  fontSize: 16,
                  dy: 30,
                  dx: 5
                }}
                tickFormatter={value => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              />

              <Tooltip
                formatter={(value, name) => [`${value} MW`, name]}
                labelFormatter={(label) => {
                  if (!label) return 'Hora desconhecida';
                  const ponto = acumuladoFRP.find(item => item.HoraInteira === label);
                  return ponto?.Hora && ponto?.Satélite
                    ? `${ponto.Hora} - ${ponto.Satélite}`
                    : label;
                }}
                offset={100} // distância entre o tooltip e o ponto
              />

              <Legend verticalAlign="top" height={36} />

              <Area
                type="monotone"
                dataKey="FRP_Acumulado"
                stroke="#ff7300"
                fillOpacity={1}
                fill="url(#colorFRP)"
                name="FRP Acumulado"
                animationBegin={700}
                animationDuration={3500}
              />
            </AreaChart>
          </div>
        </div>
      ),
    },
  ];


  const {
    abasVisiveis,
    abaAtivaId,
    hudVisivel,
    fecharAba,
    fecharHUD,
    reabrirHUD,
    setAbaAtivaId,
  } = useHUDManager(abasIniciais);

  const isFocosTableVisible = abaAtivaId === 'tabelaFocos' || abaAtivaId === 'graficoFocos';

  return (
    <DraggablePortalPanel
      className={`draggable-portal-panel ${isFocosTableVisible ? 'draggable-portal-panel--focos' : ''}`}
      initialPosition={{ x: 200, y: 100 }}
      onClose={onClose}
    >
      {hudVisivel && (
        <HUDDinamico
          abas={abasVisiveis}
          abaAtivaId={abaAtivaId}
          onClose={fecharAba}
          onAbaChange={setAbaAtivaId}
        />
      )}
    </DraggablePortalPanel>
  );
}