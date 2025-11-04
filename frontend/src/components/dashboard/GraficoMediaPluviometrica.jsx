import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Loader from '@components/common/Loader';
import { useAnaDados } from '@context/AnaDadosContext';
import { useAnaErro } from '@context/AnaErroContext';

export default function GraficoMediaPluviometrica() {
    const { mediasPontos, loading } = useAnaDados(); // mediasPontos agora é `series`
    const { erroAna } = useAnaErro();

    // arredonda para 2 casas e garante número
    const round2 = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
    };

    // Adaptar `series` → { data:'DD/MM', media:Number(2 casas), dataISO:'YYYY-MM-DD' }
    const dados = (mediasPontos || []).map(p => {
        const iso = (p.dia || '').slice(0, 10);
        const [yyyy, mm, dd] = iso.split('-');
        return {
            data: iso && mm && dd ? `${dd}/${mm}` : '',
            media: round2(p.media),     // ← média com 2 casas decimais
            dataISO: iso
        };
    });

    // Tooltip com 2 casas
    const formatarTooltip = (value, _name, props) => {
        const dISO = props?.payload?.dataISO;
        const val = typeof value === 'number' ? value.toFixed(2) : value; // ← 2 casas
        if (!dISO) return [`${val} mm`, ''];
        const dt = new Date(dISO + 'T00:00:00');
        if (isNaN(dt.getTime())) return [`${val} mm`, ''];
        const diaSemana = format(dt, 'EEEE', { locale: ptBR });
        return [`${val} mm`, diaSemana];
    };

    const calcularLarguraEixoY = () => {
        const max = Math.max(...dados.map(i => i.media), 0);
        return (String(max.toFixed(0)).length * 12) + 20;
    };

    if (erroAna) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 100 }}>
                <div style={{ color: "#fff", background: "#e2600fa1", border: "1.5px solid #b28704", borderRadius: 4, padding: "2px 8px", fontSize: 13, fontWeight: 700, boxShadow: "0 1px 4px rgba(0,0,0,0.10)", letterSpacing: 0.2, textAlign: "center" }}>
                    Erro ao buscar dados
                </div>
            </div>
        );
    }
    if (loading) return <Loader />;

    return (
        <div style={{ width: '100%', height: '96%', minHeight: '100px', flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dados} margin={{ top: 25, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <XAxis
                        dataKey="data"
                        stroke="#fff"
                        tick={{ fill: '#fff' }}
                        axisLine={{ strokeWidth: 2 }}
                        tickLine={{ strokeWidth: 2 }}
                        padding={{ left: 30, right: 30 }}
                    />
                    <YAxis
                        stroke="#fff"
                        tick={{ fill: '#fff' }}
                        width={calcularLarguraEixoY()}
                        tickMargin={3}
                        domain={[0, 'auto']}
                        axisLine={{ strokeWidth: 2 }}
                        tickLine={{ strokeWidth: 2 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px 12px' }}
                        formatter={formatarTooltip}
                        labelFormatter={label => label}
                        separator={<br />}
                    />
                    <Line
                        type="monotone"
                        dataKey="media"
                        stroke="#0074d9"
                        strokeWidth={2}
                        dot={{ fill: '#0074d9', r: 4 }}
                        label={{ position: 'top', fill: '#fff', fontSize: 12, formatter: (v) => v, offset: 10 }}
                        animationBegin={700}
                        animationDuration={3500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
