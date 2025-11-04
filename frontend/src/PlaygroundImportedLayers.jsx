import DraggablePortalPanel from '@components/layout/DraggablePortalPanel';
void DraggablePortalPanel
import HUDDinamico from '@components/layout/HUDDinamico';
void HUDDinamico
import { useHUDManager } from '@hooks/useHUDManager';

import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, Customized, ScatterChart, Scatter, CartesianGrid } from 'recharts';

export default function PlaygroundImportedLayers() {

    const focosBrutos = [
        { Data: "2025-07-03", Hora: "01:02", FRP: 9.52, Temp_Brilho: 309.16, Temp_Sec: 289.37, Satélite: "Terra", Sensor: "MODIS", Confianca: 77, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.49, Trilha: 47.88 },
        { Data: "2025-07-03", Hora: "01:02", FRP: 246.37, Temp_Brilho: 397.8, Temp_Sec: 296.98, Satélite: "Terra", Sensor: "MODIS", Confianca: 100, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.89, Trilha: 136.67 },
        { Data: "2025-07-03", Hora: "01:02", FRP: 143.77, Temp_Brilho: 376.74, Temp_Sec: 294.48, Satélite: "Terra", Sensor: "MODIS", Confianca: 100, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.23, Trilha: 82.99 },
        { Data: "2025-07-03", Hora: "01:02", FRP: 52.98, Temp_Brilho: 344.67, Temp_Sec: 290.73, Satélite: "Terra", Sensor: "MODIS", Confianca: 100, Produto: "C6.1 (quase tempo real)", Periodo: "Dia", Varredura: 1.74, Trilha: 191.43 },
        { Data: "2025-07-03", Hora: "01:02", FRP: 75.83, Temp_Brilho: 355.17, Temp_Sec: 291.67, Satélite: "Terra", Sensor: "MODIS", Confianca: 100, Produto: "C6.1 (quase tempo real)", Periodo: "Dia", Varredura: 1.43, Trilha: 49.12 },
        { Data: "2025-07-03", Hora: "04:59", FRP: 1.25, Temp_Brilho: 322.94, Temp_Sec: 287.33, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.95, Trilha: 177.36 },
        { Data: "2025-07-03", Hora: "04:59", FRP: 1.16, Temp_Brilho: 303.24, Temp_Sec: 286.66, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.6, Trilha: 151.82 },
        { Data: "2025-07-03", Hora: "04:59", FRP: 0.7, Temp_Brilho: 297.43, Temp_Sec: 286.56, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.75, Trilha: 230.94 },
        { Data: "2025-07-03", Hora: "04:59", FRP: 0.7, Temp_Brilho: 299.25, Temp_Sec: 286.71, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.36, Trilha: 25.68 },
        { Data: "2025-07-03", Hora: "04:59", FRP: 0.7, Temp_Brilho: 305.66, Temp_Sec: 286.49, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Dia", Varredura: 1.92, Trilha: 210.47 },
        { Data: "2025-07-03", Hora: "04:59", FRP: 1.02, Temp_Brilho: 302.02, Temp_Sec: 286.78, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.66, Trilha: 65.27 },
        { Data: "2025-07-03", Hora: "04:59", FRP: 1.12, Temp_Brilho: 305.59, Temp_Sec: 286.51, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.71, Trilha: 181.34 },
        { Data: "2025-07-03", Hora: "06:16", FRP: 4.18, Temp_Brilho: 298.36, Temp_Sec: 286.76, Satélite: "Suomi-NPP", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.86, Trilha: 47.88 },
        { Data: "2025-07-03", Hora: "06:16", FRP: 4.18, Temp_Brilho: 340.03, Temp_Sec: 288.11, Satélite: "Suomi-NPP", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.24, Trilha: 228.09 },
        { Data: "2025-07-03", Hora: "06:16", FRP: 6.19, Temp_Brilho: 316.16, Temp_Sec: 287.18, Satélite: "Suomi-NPP", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.61, Trilha: 57.03 },
        { Data: "2025-07-03", Hora: "06:08", FRP: 11.5, Temp_Brilho: 300.6, Temp_Sec: 288.95, Satélite: "Aqua", Sensor: "MODIS", Confianca: 30, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.47, Trilha: 36.52 },
        { Data: "2025-07-03", Hora: "01:02", FRP: 9, Temp_Brilho: 305.29, Temp_Sec: 290.75, Satélite: "Terra", Sensor: "MODIS", Confianca: 64, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.67, Trilha: 71.58 },
        { Data: "2025-07-03", Hora: "01:02", FRP: 10.11, Temp_Brilho: 306.69, Temp_Sec: 290.94, Satélite: "Terra", Sensor: "MODIS", Confianca: 69, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.38, Trilha: 93.84 },
        { Data: "2025-07-03", Hora: "13:27", FRP: 19.34, Temp_Brilho: 306.2, Temp_Sec: 291.74, Satélite: "Terra", Sensor: "MODIS", Confianca: 59, Produto: "C6.1 (quase tempo real)", Periodo: "Dia", Varredura: 1.78, Trilha: 164.91 },
        { Data: "2025-07-03", Hora: "13:27", FRP: 14.45, Temp_Brilho: 304.37, Temp_Sec: 292.43, Satélite: "Terra", Sensor: "MODIS", Confianca: 21, Produto: "C6.1 (quase tempo real)", Periodo: "Dia", Varredura: 1.9, Trilha: 189.79 },
        { Data: "2025-07-03", Hora: "04:57", FRP: 1.29, Temp_Brilho: 299.89, Temp_Sec: 289.15, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.5, Trilha: 105.66 },
        { Data: "2025-07-03", Hora: "17:05", FRP: 2.89, Temp_Brilho: 301.52, Temp_Sec: 289.47, Satélite: "Terra", Sensor: "MODIS", Confianca: 65, Produto: "C6.1 (quase tempo real)", Periodo: "Dia", Varredura: 1.62, Trilha: 118.44 },
        { Data: "2025-07-03", Hora: "17:41", FRP: 7.34, Temp_Brilho: 309.78, Temp_Sec: 290.12, Satélite: "Aqua", Sensor: "MODIS", Confianca: 91, Produto: "C6.1 (quase tempo real)", Periodo: "Dia", Varredura: 1.55, Trilha: 64.73 },
        { Data: "2025-07-03", Hora: "18:00", FRP: 3.15, Temp_Brilho: 298.11, Temp_Sec: 288.25, Satélite: "Suomi-NPP", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.84, Trilha: 136.82 },
        { Data: "2025-07-03", Hora: "18:27", FRP: 6.78, Temp_Brilho: 310.93, Temp_Sec: 291.67, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.73, Trilha: 84.12 },
        { Data: "2025-07-03", Hora: "19:10", FRP: 4.91, Temp_Brilho: 307.22, Temp_Sec: 290.42, Satélite: "Aqua", Sensor: "MODIS", Confianca: 55, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.91, Trilha: 77.98 },
        { Data: "2025-07-03", Hora: "20:45", FRP: 5.66, Temp_Brilho: 308.39, Temp_Sec: 291.33, Satélite: "Terra", Sensor: "MODIS", Confianca: 89, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.47, Trilha: 163.55 },
        { Data: "2025-07-03", Hora: "21:18", FRP: 3.78, Temp_Brilho: 304.66, Temp_Sec: 290.22, Satélite: "NOAA-20", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.69, Trilha: 119.31 },
        { Data: "2025-07-03", Hora: "22:40", FRP: 2.52, Temp_Brilho: 296.85, Temp_Sec: 287.91, Satélite: "Suomi-NPP", Sensor: "VIIRS", Confianca: "nominal", Produto: "C2.0 (quase tempo real)", Periodo: "Noite", Varredura: 1.53, Trilha: 92.05 },
        { Data: "2025-07-03", Hora: "23:12", FRP: 8.45, Temp_Brilho: 311.48, Temp_Sec: 292.04, Satélite: "Terra", Sensor: "MODIS", Confianca: 97, Produto: "C6.1 (quase tempo real)", Periodo: "Noite", Varredura: 1.58, Trilha: 102.63 }
    ];

    const resumoPorPeriodo = Object.entries(
        focosBrutos.reduce((acc, item) => {
            acc[item.Periodo] = (acc[item.Periodo] || 0) + 1;
            return acc;
        }, {})
    ).map(([periodo, count]) => ({
        Periodo: periodo,
        Focos: count,
    }));

    const mediaPorHora = Object.values(
        focosBrutos.reduce((acc, item) => {
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

    const focosOrdenados = [...focosBrutos]
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
        focosBrutos.reduce((acc, item) => {
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

    const resumoPorHoraInteira = Object.entries(
        focosBrutos.reduce((acc, item) => {
            const hora = item.Hora.slice(0, 2);
            acc[hora] = (acc[hora] || 0) + 1;
            return acc;
        }, {})
    ).map(([hora, count]) => ({
        Hora: `${hora}:00`,
        Focos: count
    })).sort((a, b) => parseInt(a.Hora) - parseInt(b.Hora));

    const acumuladoFRP = focosOrdenados.reduce((acc, item, index) => {
        const acumuladoAnterior = acc.length > 0 ? acc[acc.length - 1].FRP_Acumulado : 0;
        acc.push({
            ...item,
            FRP_Acumulado: +(acumuladoAnterior + item.FRP).toFixed(2)
        });
        return acc;
    }, []);



    const initialAbas = [
        {
            id: 'tab7',
            titulo: 'Gráficos de Focos de Calor',
            conteudo: (
                <div className="hud-graficos-focos-calor">
                    <h4>📈 Gráficos de Focos de Calor</h4>
                    <div className="graficos-container">
                        <ScatterChart
                            width={700}
                            height={320}
                            margin={{ top: 20, right: 20, bottom: 20, left: 30 }}
                        >
                            <CartesianGrid />
                            <XAxis
                                type="number"
                                dataKey="Varredura"
                                name="Varredura"
                                label={{
                                    value: "Varredura (°)",
                                    position: "insideBottom",
                                    offset: -10,
                                    fill: "#555",
                                    fontSize: 12,
                                }}
                            />
                            <YAxis
                                type="number"
                                dataKey="Trilha"
                                name="Trilha"
                                label={{
                                    value: "Trilha (km)",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "#555",
                                    fontSize: 12,
                                    dx: -15,
                                    dy: 15
                                }}
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ payload }) => {
                                    if (!payload || !payload.length) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '8px' }}>
                                            <strong>{d.Satélite} – {d.Sensor}</strong><br />
                                            Varredura: {d.Varredura}°<br />
                                            Trilha: {d.Trilha} km<br />
                                            Hora: {d.Hora}
                                        </div>
                                    );
                                }}
                            />
                            {Array.from(new Set(focosBrutos.map(f => f.Satélite))).map((sat, i) => (
                                <Scatter
                                    key={sat}
                                    name={sat}
                                    data={focosBrutos.filter(f => f.Satélite === sat)}
                                    fill={['#2196f3', '#e91e63', '#ff9800', '#4caf50', '#9c27b0'][i % 5]}
                                    animationDuration={2000}
                                />
                            ))}
                        </ScatterChart>

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
                                dataKey="index"
                                tickFormatter={(value, index) => {
                                    const current = acumuladoFRP[index];
                                    const previous = acumuladoFRP[index - 1];
                                    return !previous || current.Hora !== previous.Hora ? current.Hora : '';
                                }}
                                angle={-25}
                                textAnchor="end"
                                height={60}
                            />

                            <YAxis
                                label={{
                                    value: "FRP Acumulado (MW)",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "#555",
                                    fontSize: 12,
                                    dy: 50,
                                    dx: 10
                                }}
                            />

                            <Tooltip
                                formatter={(value, name) => [value, name]}
                                labelFormatter={(i) => acumuladoFRP[i]?.label}
                            />
                            <Legend verticalAlign="top" height={36} />

                            <Area
                                type="monotone"
                                dataKey="FRP_Acumulado"
                                stroke="#ff7300"
                                fillOpacity={1}
                                fill="url(#colorFRP)"
                                name="FRP Acumulado"
                                animationBegin={700}     // 0.7s delay
                                animationDuration={3500} // mais lenta
                            />
                        </AreaChart>

                        {/* Gráfico de Dispersão – FRP vs Temp_Brilho */}
                        <ScatterChart
                            width={700}
                            height={320}
                            margin={{ top: 20, right: 20, bottom: 20, left: 30 }}
                        >
                            <CartesianGrid />
                            <XAxis
                                type="number"
                                dataKey="Temp_Brilho"
                                name="Temperatura de Brilho"
                                label={{
                                    value: "Temperatura de Brilho (K)",
                                    position: "insideBottom",
                                    offset: -10,
                                    fill: "#555",
                                    fontSize: 12,
                                }}
                            />
                            <YAxis
                                type="number"
                                dataKey="FRP"
                                name="Potência FRP"
                                label={{
                                    value: "FRP (MW)",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "#555",
                                    fontSize: 12,
                                    dx: -15,
                                    dy: 15
                                }}
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                formatter={(value, name) => [value, name]}
                                labelFormatter={() => ''}
                                content={({ payload }) => {
                                    if (!payload || !payload[0]) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '8px' }}>
                                            <strong>{d.Hora}</strong><br />
                                            Temp: {d.Temp_Brilho} K<br />
                                            FRP: {d.FRP} MW
                                            Satélite: {d.Satélite}<br />
                                        </div>
                                    );
                                }}
                            />
                            <Scatter
                                name="Focos"
                                data={focosBrutos}
                                fill="#f44336"
                                animationBegin={600}     // 0.6s delay
                                animationDuration={2500} // mais lenta
                            />
                        </ScatterChart>

                        {/* Gráfico de Linha - FRP */}
                        <LineChart width={700} height={320} data={focosOrdenados}>
                            <Legend
                                verticalAlign="top"
                                align="center"
                            />
                            {/* Eixo X com marcação apenas no início de cada grupo de horário */}
                            <XAxis
                                dataKey="index"
                                tickFormatter={(value, index) => {
                                    const current = focosOrdenados[index];
                                    const previous = focosOrdenados[index - 1];
                                    return !previous || current.Hora !== previous.Hora ? current.Hora : '';
                                }}
                                angle={-25}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                label={{
                                    value: "POTÊNCIA EM MW",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "#555",
                                    fontSize: 12,
                                    dy: 50, // ⬅️ Desloca para o meio verticalmente (ajuste conforme altura)
                                    dx: 10  // ⬅️ Opcional: distância do eixo
                                }}
                            />

                            <Tooltip
                                formatter={(value, name) => [value, name]}
                                labelFormatter={(i) => focosOrdenados[i]?.label}
                            />
                            <Line type="monotone" dataKey="FRP" stroke="#8884d8" dot
                                animationBegin={700}     // 0.7s delay
                                animationDuration={3500} // mais lenta
                            />

                            {/* SOMBRA entre blocos de horário iguais */}
                            <Customized component={({ xAxisMap, yAxisMap }) => {
                                const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
                                const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];

                                const shadows = [];
                                let lastHora = null;
                                let startX = null;

                                focosOrdenados.forEach((d, i) => {
                                    const x = xAxis.scale(i);
                                    if (d.Hora !== lastHora) {
                                        if (startX !== null) {
                                            shadows.push({ x: startX, width: x - startX });
                                        }
                                        startX = x;
                                        lastHora = d.Hora;
                                    }
                                });

                                // Último grupo
                                if (startX !== null) {
                                    const lastX = xAxis.scale(focosOrdenados.length);
                                    shadows.push({ x: startX, width: lastX - startX });
                                }

                                return (
                                    <>
                                        {shadows.map((s, i) => (
                                            <rect
                                                key={i}
                                                x={s.x}
                                                y={yAxis.y} // começa no topo da área do YAxis
                                                width={s.width}
                                                height={yAxis.height} // altura apenas da área de dados
                                                fill={i % 2 === 0 ? '#e8f0ff' : '#ffffff'}
                                                opacity={0.3}
                                            />
                                        ))}
                                    </>
                                );
                            }} />

                        </LineChart>

                        {/* Gráfico de Barra - Temp_Brilho/Temp_Sec */}
                        <BarChart
                            width={700}
                            height={350}
                            data={temperaturasAgrupadas}
                            margin={{ left: 30, right: 0, top: 10, bottom: 20 }} // ⬅️ Aumenta margem esquerda
                        >
                            <XAxis dataKey="Hora" angle={0} textAnchor="end" />
                            <YAxis
                                domain={['dataMin - 5', 'dataMax + 5']}
                                label={{
                                    value: "TEMPERTURA EM KELVIN",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "#555",
                                    fontSize: 12,
                                    dy: 50, // ⬅️ Desloca para o meio verticalmente (ajuste conforme altura)
                                    dx: -15  // ⬅️ Opcional: distância do eixo
                                }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Temp_Brilho" name="Temp. Brilho" fill="#82ca9d"
                                animationDuration={3500}
                                isAnimationActive={true}
                            />
                            <Bar dataKey="Temp_Sec" name="Temp. Secundária" fill="#8884d8"
                                animationDuration={2500}
                                isAnimationActive={true}
                            />
                        </BarChart>

                        {/* Gráfico de Barras – Contagem por Período (Dia/Noite) */}
                        <BarChart width={400} height={300} data={resumoPorPeriodo} margin={{ top: 10, bottom: 20, left: 20 }}>
                            <XAxis dataKey="Periodo" />
                            <YAxis
                                label={{
                                    value: "Qtd. de Focos",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "#555",
                                    fontSize: 12,
                                    dx: -10,
                                    dy: 30
                                }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Focos" fill="#ff7043" name="Focos por período"
                                animationDuration={3500}
                                isAnimationActive={true}
                            />
                        </BarChart>

                        {/* Gráfico de Barras – Focos por Hora */}
                        <BarChart width={700} height={300} data={resumoPorHoraInteira} margin={{ top: 20, bottom: 20, left: 20 }}>
                            <XAxis dataKey="Hora" />
                            <YAxis
                                label={{
                                    value: "Qtd. de Focos",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "#555",
                                    fontSize: 12,
                                    dx: -10,
                                    dy: 30
                                }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Focos" fill="#4caf50" name="Focos por hora"
                                animationDuration={3500}
                                isAnimationActive={true}
                            />
                        </BarChart>

                    </div>
                </div>
            ),
        },
        {
            id: 'tab0',
            titulo: 'Focos de Calor',
            conteudo: (
                <div className="hud-focos-calor compact">
                    <div className="foco-header">
                        <strong>Focos de calor (4) – Área: 9,56 km²</strong>
                    </div>
                    <div className="hud-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Hora UTC+0</th>
                                    <th>FRP (MW)</th>
                                    <th>Temp. Brilho</th>
                                    <th>Temp. sec.</th>
                                    <th>Satélite</th>
                                    <th>Sensor</th>
                                    <th>Confiança</th>
                                    <th>Produto</th>
                                    <th>Período</th>
                                    <th>Varredura (°)</th>
                                    <th>Trilha (km)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>2025-07-03</td>
                                    <td>01:02</td>
                                    <td className="numeric">5.28</td>
                                    <td className="numeric">303.15 K</td>
                                    <td className="numeric">291.19 K</td>
                                    <td>Terra</td>
                                    <td>MODIS</td>
                                    <td className="numeric">53%</td>
                                    <td>C6.1 (NRT)</td>
                                    <td>Noite</td>
                                    <td className="numeric">1.47</td>
                                    <td className="numeric">93.84</td>
                                </tr>
                                <tr>
                                    <td>2025-07-03</td>
                                    <td>01:02</td>
                                    <td className="numeric">21.74</td>
                                    <td className="numeric">323.56 K</td>
                                    <td className="numeric">292.81 K</td>
                                    <td>Terra</td>
                                    <td>MODIS</td>
                                    <td className="numeric">100%</td>
                                    <td>C6.1 (NRT)</td>
                                    <td>Noite</td>
                                    <td className="numeric">1.43</td>
                                    <td className="numeric">49.12</td>
                                </tr>
                                <tr>
                                    <td>2025-07-03</td>
                                    <td>04:10</td>
                                    <td className="numeric">2.49</td>
                                    <td className="numeric">319.97 K</td>
                                    <td className="numeric">289.73 K</td>
                                    <td>NOAA-21</td>
                                    <td>VIIRS</td>
                                    <td>nominal</td>
                                    <td>C2.0 (NRT)</td>
                                    <td>Noite</td>
                                    <td className="numeric">1.84</td>
                                    <td className="numeric">136.82</td>
                                </tr>
                                <tr>
                                    <td>2025-07-03</td>
                                    <td>04:36</td>
                                    <td className="numeric">3.67</td>
                                    <td className="numeric">320.46 K</td>
                                    <td className="numeric">290.85 K</td>
                                    <td>Suomi-NPP</td>
                                    <td>VIIRS</td>
                                    <td>nominal</td>
                                    <td>C2.0 (NRT)</td>
                                    <td>Noite</td>
                                    <td className="numeric">1.86</td>
                                    <td className="numeric">47.88</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ),
        },
        {
            id: 'tab1',
            titulo: 'Resumo',
            conteudo: (
                <div>
                    <p><strong>Este é um painel com múltiplas abas.</strong> Personalize como quiser usando componentes dinâmicos, formulários ou visualizações de dados.</p>

                    <ul>
                        <li>✅ Suporta <strong>conteúdo personalizado</strong> por aba.</li>
                        <li>🧩 Pode exibir <strong>tabelas, formulários</strong> ou qualquer componente React.</li>
                        <li>🖱️ Painel <strong>arrastável</strong> com suporte a eventos do mapa (opcional).</li>
                        <li>🪟 Totalmente <strong>portável</strong>: funciona dentro ou fora do mapa.</li>
                        <li>📌 Abas com <strong>scroll lateral inteligente</strong> e setas de navegação quando necessário.</li>
                        <li>🎨 Estilo visual com <strong>efeito glass</strong>, sombras e responsividade nativa.</li>
                        <li>⚙️ Comportamento <strong>modular e extensível</strong> via hooks como <code>useHUDManager</code>.</li>
                        <li>🔁 Estado das abas <strong>sincronizável</strong> com eventos externos (opcional).</li>
                    </ul>

                    <div>
                        <p><strong>Dica:</strong> Utilize o componente <code>HUDDinamico</code> junto com <code>DraggablePortalPanel</code> para montar painéis interativos em qualquer lugar da sua interface.</p>
                        <p><strong>Exemplo:</strong> Ideal para dashboards flutuantes, painéis de controle sobre mapas, ou layouts complexos sem perder portabilidade.</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'tab2',
            titulo: 'Tabela',
            conteudo: (
                <div>
                    <h4>📊 Informações de Usuário</h4>
                    <div className="hud-table-wrapper">
                        <table className="hud-table">
                            <thead>
                                <tr>
                                    <th>Campo</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 30 }, (_, i) => (
                                    <tr key={i}>
                                        <td>Campo {i + 1}</td>
                                        <td>Valor {i + 1}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ),
        },
        {
            id: 'tab3',
            titulo: 'Formulário',
            conteudo: (
                <div>
                    {/* Cabeçalho */}
                    <h4>📝 Formulário de Cadastro</h4>

                    {/* Conteúdo com scroll se necessário */}
                    <div>
                        <form>
                            {/* Nome */}
                            <div>
                                <label htmlFor="nome">Nome:</label>
                                <input
                                    id="nome"
                                    type="text"
                                    placeholder="Digite seu nome"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email">Email:</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="exemplo@email.com"
                                />
                            </div>

                            {/* Gênero */}
                            <div>
                                <label htmlFor="genero">Gênero:</label>
                                <select
                                    id="genero"
                                >
                                    <option>Masculino</option>
                                    <option>Feminino</option>
                                    <option>Outro</option>
                                </select>
                            </div>

                            {/* Comentários */}
                            <div>
                                <label htmlFor="comentarios">Comentários:</label>
                                <textarea
                                    id="comentarios"
                                    className="hud-textarea-comentarios"
                                    placeholder="Deixe aqui seu comentário..."
                                    rows={4}
                                    maxLength={500}
                                />
                            </div>
                            {/* Botão SEMPRE visível */}
                            <button type="submit"> Enviar </button>
                        </form>
                    </div>
                </div>
            ),
        },
        {
            id: 'tab4',
            titulo: 'Insights',
            conteudo: (
                <div>
                    <h4>📈 Destaques Recentes</h4>
                    <ul>
                        <li>🚀 Crescimento de usuários: <strong>+18%</strong> em comparação ao último mês</li>
                        <li>💬 Feedback positivo: <strong>92%</strong> das avaliações foram 4 estrelas ou mais</li>
                        <li>📅 Próximo evento agendado: <strong>24 de junho às 14h</strong></li>
                        <li>⏱️ Tempo médio de uso: <strong>12m 43s</strong> por sessão</li>
                    </ul>

                    <blockquote>
                        “A simplicidade é o último grau de sofisticação.” – Leonardo da Vinci
                    </blockquote>
                </div>
            ),
        },
        {
            id: 'tab5',
            titulo: 'Mapa & Info',
            conteudo: (
                <div>
                    <h4>Monitoramento de Focos de Calor</h4>
                    <img
                        src="https://s2-g1.glbimg.com/FfF2VF0__9arUKqElXYE2mTn7iM=/1200x/smart/filters:cover():strip_icc()/i.s3.glbimg.com/v1/AUTH_59edd422c0c84a879bd37670ae4f538a/internal_photos/bs/2024/3/G/dkiLuUTUyOgMn91t3q1Q/mapa-focos-calor-2024-3103.jpg"
                        alt="Mapa de focos de calor em Mato Grosso"
                    />
                    <p>
                        O mapa acima apresenta os focos de calor detectados no estado de Mato Grosso entre <strong>01/01 e 31/03/2024</strong>, totalizando <strong>3.334 ocorrências</strong>. As áreas mais afetadas estão localizadas principalmente nos biomas <span style={{ color: '#4caf50' }}><strong>Amazônia</strong></span> e <span style={{ color: '#ff9800' }}><strong>Cerrado</strong></span>, com destaque para a porção norte do estado.
                    </p>
                    <p>
                        A visualização utiliza dados do <code>INPE (2024)</code> e apresenta os limites municipais e de biomas segundo o <code>IBGE (2019)</code>. O levantamento foi realizado pelo Instituto Centro de Vida (ICV).
                    </p>
                    <p>
                        Utilize este painel para análise ambiental, definição de áreas prioritárias e planejamento de ações de prevenção a incêndios florestais.
                    </p>
                </div>
            ),
        },
        {
            id: 'tab6',
            titulo: 'Configurações',
            conteudo: (
                <div>
                    <h4>⚙️ Preferências de Interface</h4>
                    <form>
                        {/* Tema */}
                        <div>
                            <label htmlFor="tema">Tema:</label>
                            <select id="tema">
                                <option>Claro</option>
                                <option>Escuro</option>
                                <option>Sistema</option>
                            </select>
                        </div>

                        {/* Estilo de Interface */}
                        <div>
                            <label htmlFor="estiloInterface">Estilo:</label>
                            <select id="estiloInterface">
                                <option>Moderno</option>
                                <option>Clássico</option>
                                <option>Minimalista</option>
                            </select>
                        </div>

                        {/* Densidade de Elementos */}
                        <div className="radio-group">
                            <label className="radio-label">Densidade:</label>
                            <div className="radio-options-vertical">
                                <label className="radio-item">
                                    <input type="radio" name="densidade" value="confortavel" defaultChecked />
                                    <span>Confortável</span>
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="densidade" value="compacta" />
                                    <span>Compacta</span>
                                </label>
                            </div>
                        </div>

                        {/* Notificações */}
                        <div>
                            <label htmlFor="notificacoes">Notificações:</label>
                            <select id="notificacoes">
                                <option>Habilitadas</option>
                                <option>Somente críticas</option>
                                <option>Desativadas</option>
                            </select>
                        </div>

                        {/* Idioma */}
                        <div>
                            <label htmlFor="idioma">Idioma:</label>
                            <select id="idioma">
                                <option>Português</option>
                                <option>Inglês</option>
                                <option>Espanhol</option>
                            </select>
                        </div>

                        {/* Unidade de medida */}
                        <div>
                            <label htmlFor="unidade">Unidade de Medida:</label>
                            <select id="unidade">
                                <option>Métrica (m, km)</option>
                                <option>Imperial (ft, mi)</option>
                            </select>
                        </div>

                        {/* Volume de Som */}
                        <div>
                            <label htmlFor="volume">Volume:</label>
                            <input type="range" id="volume" name="volume" min="0" max="100" step={1} />
                        </div>

                        {/* Animação de Transição */}
                        <div>
                            <label htmlFor="transicao">Duração da Transição (ms):</label>
                            <input type="range" id="transicao" name="transicao" min="100" max="2000" step="100" />
                        </div>

                        {/* Fonte (Tamanho) */}
                        <div>
                            <label htmlFor="tamanhoFonte">Tamanho da Fonte (px):</label>
                            <input type="number" id="tamanhoFonte" name="tamanhoFonte" min="5" max="30" />
                        </div>

                        {/* Cor do Tema */}
                        <div className="color-picker-group">
                            <label htmlFor="corPrimaria">Cor Primária:</label>
                            <input type="color" id="corPrimaria" name="corPrimaria" />
                        </div>

                        {/* Ativar sons */}
                        <div className="checkbox-group">
                            <label htmlFor="ativarSom">
                                <input type="checkbox" id="ativarSom" />
                                Ativar sons do sistema
                            </label>
                        </div>

                        {/* Ativar modo noturno automático */}
                        <div className="checkbox-group">
                            <label htmlFor="modoNoturnoAuto">
                                <input type="checkbox" id="modoNoturnoAuto" />
                                Modo noturno automático
                            </label>
                        </div>

                        {/* Modo Compacto */}
                        <div className="radio-group">
                            <label className="radio-label">Modo de Interface:</label>
                            <div className="radio-options-vertical">
                                <label className="radio-item">
                                    <input type="radio" name="modoInterface" value="normal" defaultChecked />
                                    <span>Normal</span>
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="modoInterface" value="compacto" />
                                    <span>Compacto</span>
                                </label>
                            </div>
                        </div>

                        {/* Horário Preferido */}
                        <div style={{ marginTop: "1rem" }}>
                            <label htmlFor="horarioPreferido">Horário Preferido:</label>
                            <input type="time" id="horarioPreferido" name="horarioPreferido" />
                        </div>

                        {/* Semana de Referência */}
                        <div style={{ marginTop: "1rem" }}>
                            <label htmlFor="semanaReferencia">Semana de Referência:</label>
                            <input type="week" id="semanaReferencia" name="semanaReferencia" />
                        </div>

                        {/* Mês Preferido */}
                        <div style={{ marginTop: "1rem" }}>
                            <label htmlFor="mesPreferido">Mês Preferido:</label>
                            <input type="month" id="mesPreferido" name="mesPreferido" />
                        </div>

                        {/* Data de Preferência */}
                        <div>
                            <label htmlFor="dataPreferida">Data Preferida:</label>
                            <input type="date" id="dataPreferida" name="dataPreferida" />
                        </div>

                        {/* Agendamento (Data + Hora) */}
                        <div style={{ marginTop: "1rem" }}>
                            <label htmlFor="agendamento">Agendamento:</label>
                            <input type="datetime-local" id="agendamento" name="agendamento" />
                        </div>

                        {/* Upload de Foto */}
                        <div className="file-upload-wrapper-centered">
                            <label htmlFor="fotoUpload" className="file-label">
                                📁 Selecionar arquivo
                            </label>
                            <input type="file" id="fotoUpload" className="file-input" />
                            <span className="file-name">Nenhum arquivo selecionado</span>
                        </div>

                        {/* Telefone de Contato */}
                        <div style={{ marginTop: "1rem" }}>
                            <label htmlFor="telefoneContato">Telefone de Contato:</label>
                            <input type="tel" id="telefoneContato" name="telefoneContato" placeholder="(XX) XXXX-XXXX" />
                        </div>

                        {/* Site Pessoal */}
                        <div style={{ marginTop: "1rem" }}>
                            <label htmlFor="sitePessoal">Site Pessoal:</label>
                            <input type="url" id="sitePessoal" name="sitePessoal" placeholder="https://..." />
                        </div>

                        {/* Botões */}
                        <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
                            <button type="submit">Salvar</button>
                            <button type="reset">Redefinir</button>
                        </div>
                    </form>
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
        setAbaAtivaId
    } = useHUDManager(initialAbas);

    const isFocosTableVisible = abaAtivaId === 'tab0' || abaAtivaId === 'tab7';

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundImage: 'url("https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1920&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {!hudVisivel && (
                <button
                    onClick={reabrirHUD}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        padding: '8px 16px',
                        backgroundColor: '#4a6bdf',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#3a5bd9'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#4a6bdf'}
                >
                    Reabrir Painel
                </button>
            )}

            {hudVisivel && (
                <DraggablePortalPanel
                    className={`draggable-portal-panel ${isFocosTableVisible ? 'draggable-portal-panel--focos' : ''}`}
                    onClose={fecharHUD}
                >
                    <HUDDinamico
                        abas={abasVisiveis}
                        abaAtivaId={abaAtivaId}
                        onClose={fecharAba}
                        onAbaChange={setAbaAtivaId}
                    />
                </DraggablePortalPanel>
            )}
        </div>
    );
}