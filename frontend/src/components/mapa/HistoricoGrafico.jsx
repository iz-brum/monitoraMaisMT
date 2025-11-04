import React from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const CORES = {
  chuva: '#0478d6ff', // azul
  nivel: '#43a047',  // verde
  vazao: 'orange',  // laranja
};

export default function HistoricoGrafico({ dados, tipo }) {
  // Filtra os dados para o tipo selecionado
  const dadosFiltrados = dados
    .map(d => ({
      ...d,
      valor: d[tipo] !== null && d[tipo] !== undefined ? Number(d[tipo]) : null
    }))
    .filter(d => d.valor !== null && !isNaN(d.valor));

  // Verifica se há dados válidos
  if (!dadosFiltrados || dadosFiltrados.length === 0) {
    return (
      <div className="grafico-vazio">
        <img
          src="/assets/imgs/img_icon_not_find.png"
          alt="Sem dados"
        />
        <span>Sem dados históricos.</span>
      </div>
    );
  }

  // Define label e unidade conforme o tipo
  const label = tipo === 'chuva' ? 'Chuva'
    : tipo === 'nivel' ? "Nível"
      : tipo === 'vazao' ? "Vazão"
        : 'Valor';

  // Cor da linha
  const corLinha = CORES[tipo] || '#1976d2';

  // Formatação do tooltip
  const formatarTooltip = (value) => {
    return [`${value} ${label.split(' ')[1] || ''}`.trim(), label];
  };

  // Formatação do label do tooltip (exibe data e HH:mm)
  const formatarTooltipLabel = (v) => {
    if (!v) return '';
    try {
      const dataHora = parseISO(v);
      const dataFormatada = format(dataHora, 'dd/MM');
      const horaFormatada = format(dataHora, 'HH:mm');
      return `${dataFormatada} ${horaFormatada}`;
    } catch {
      return v;
    }
  };

  const formatarHoraAdaptativo = (() => {
    let formato = 'dd/MM';
    if (dados.length >= 2) {
      const inicio = parseISO(dados[0].dataHoraMedicao);
      const fim = parseISO(dados[dados.length - 1].dataHoraMedicao);
      const minutosTotais = differenceInMinutes(fim, inicio);

      if (minutosTotais <= 60) {
        formato = 'HH:mm';
      } else if (minutosTotais <= 60 * 24) {
        formato = 'HH:mm';
      } else {
        formato = 'dd/MM';
      }
    }

    return (valor) => {
      try {
        return format(parseISO(valor), formato);
      } catch {
        return valor;
      }
    };
  })();

  // Função para calcular largura dinâmica do eixo Y
  const calcularLarguraEixoY = () => {
    const valores = dados.map(item => Number(item[tipo])).filter(v => !isNaN(v));
    const maiorValor = Math.max(...valores, 0);

    const amostraFormatada = maiorValor.toFixed(3);

    const span = document.createElement("span");
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.style.fontSize = "12px";
    span.style.fontFamily = "sans-serif";
    span.innerText = amostraFormatada;

    document.body.appendChild(span);
    const largura = span.getBoundingClientRect().width;
    document.body.removeChild(span);

    return largura + 5;
  };

  const calcularDominioY = () => {
    const valores = dados.map(d => Number(d[tipo])).filter(v => !isNaN(v));
    if (valores.length === 0) return [0, 'auto'];

    let min = Math.min(...valores);
    let max = Math.max(...valores);

    // Força o mínimo a ser 0 para o tipo 'chuva'
    if (tipo === 'chuva') {
      min = 0;
      // Se max === min, adiciona margem
      if (max === 0) {
        max = 0.1; // força visualização mínima
      }
    } else {
      if (min === max) {
        return [min - 1, max + 1];
      }
      const padding = (max - min) * 0.1;
      min = min - padding;
      max = max + padding;
    }

    return [min, max];
  };

  // Função para customizar os ticks do eixo X
  const customTicks = () => {
    if (!dados || dados.length === 0) return [];

    const total = dados.length;
    const maxTicks = 6;

    // Garante que mesmo em poucos dados, o início e fim apareçam
    const inicio = parseISO(dados[0].dataHoraMedicao);
    const fim = parseISO(dados[total - 1].dataHoraMedicao);
    const duracaoTotalMs = fim.getTime() - inicio.getTime();

    const ticks = [];

    for (let i = 0; i < maxTicks; i++) {
      const offset = (i / (maxTicks - 1)) * duracaoTotalMs;
      const alvo = new Date(inicio.getTime() + offset);

      // Pega o ponto mais próximo no tempo
      const maisProximo = dados.reduce((acc, curr) => {
        const currTime = parseISO(curr.dataHoraMedicao).getTime();
        const accTime = parseISO(acc.dataHoraMedicao).getTime();
        return Math.abs(currTime - alvo.getTime()) < Math.abs(accTime - alvo.getTime()) ? curr : acc;
      });

      const tick = maisProximo.dataHoraMedicao;
      if (!ticks.includes(tick)) {
        ticks.push(tick);
      }
    }

    return ticks;
  };

  // Renderiza o gráfico de barra se o tipo for 'chuva'
  if (tipo === 'chuva') {
    return (
      <ResponsiveContainer width="100%" height={295}>
        <BarChart data={dadosFiltrados} margin={{ top: 20, right: 20, left: 8, bottom: -5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(235, 185, 91)" />
          <XAxis
            dataKey="dataHoraMedicao"
            tickFormatter={formatarHoraAdaptativo}
            ticks={customTicks()}
            stroke="rgb(0, 0, 0)"
            tick={{ fill: 'rgb(0, 0, 0)', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(0, 0, 0, 0.35)', strokeWidth: 1 }}
            tickLine={{ stroke: 'rgba(0,0,0,0.6)', strokeWidth: 1 }}
          />
          <YAxis
            stroke="rgb(0, 0, 0)"
            tick={{ fill: 'rgb(0, 0, 0)', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(0, 0, 0, 0.35)', strokeWidth: 1 }}
            tickLine={{ stroke: 'rgba(0, 0, 0, 0.6)', strokeWidth: 1 }}
            width={calcularLarguraEixoY()}
            domain={calcularDominioY()}
            tickFormatter={(value) => Number(value).toFixed(2)}
            tickCount={11}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(30,30,30,0.95)', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, fontSize: 14 }}
            itemStyle={{ color: corLinha }}
            formatter={formatarTooltip}
            labelFormatter={formatarTooltipLabel}
          />
          <Bar
            dataKey="valor"
            name={`${label} (mm)`}
            fill={corLinha}
            isAnimationActive={true}
            barSize={25}
            minPointSize={0}
          />
          <Legend verticalAlign="top" height={20} wrapperStyle={{ marginTop: -15 }} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // caso contrário: nível ou vazão (gráfico de linha)
  return (
    <ResponsiveContainer width="100%" height={295}>
      <LineChart data={dadosFiltrados} margin={{ top: 20, right: 20, left: 8, bottom: -5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(235, 185, 91)" />
        <XAxis
          dataKey="dataHoraMedicao"
          tickFormatter={formatarHoraAdaptativo}
          ticks={customTicks()}
          stroke="rgb(0, 0, 0)"
          tick={{ fill: 'rgb(0, 0, 0)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(0, 0, 0, 0.35)', strokeWidth: 1 }}
          tickLine={{ stroke: 'rgba(0, 0, 0, 0.6)', strokeWidth: 1 }}
        />
        <YAxis
          stroke="rgb(0, 0, 0)"
          tick={{ fill: 'rgb(0, 0, 0)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(0, 0, 0, 0.35)', strokeWidth: 1 }}
          tickLine={{ stroke: 'rgba(0, 0, 0, 0.6)', strokeWidth: 1 }}
          width={calcularLarguraEixoY()}
          domain={calcularDominioY()}
          tickFormatter={(value) => Number(value).toFixed(2)}
          tickCount={11}
        />
        <Tooltip
          contentStyle={{ backgroundColor: 'rgba(30,30,30,0.95)', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, fontSize: 14 }}
          itemStyle={{ color: corLinha }}
          formatter={formatarTooltip}
          labelFormatter={formatarTooltipLabel}
        />
        <Line
          type="monotone"
          dataKey="valor"
          name={`${label} (${tipo === 'chuva' ? 'mm' : tipo === 'nivel' ? 'cm' : 'm³/s'})`}
          stroke={corLinha}
          strokeWidth={4}
          dot={false}
          activeDot={{ r: 6, fill: corLinha, stroke: '#fff', strokeWidth: 3 }}
          isAnimationActive={false}
        />
        <Legend verticalAlign="top" height={20} wrapperStyle={{ marginTop: -15 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}