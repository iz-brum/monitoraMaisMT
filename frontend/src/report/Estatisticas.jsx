import React, { useEffect, useState } from 'react';
import ReportLayout from './ReportLayout';
import ReportHeader from './ReportHeader';
import Loader from '@components/common/Loader';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, Paper } from '@mui/material';
import {
    ReferenceLine, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
void React, ReportLayout, ReportHeader, Loader, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, Paper, ReferenceLine, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line;
import { montarUrl, buscarJson, logErroFetch } from '../shared/utils/apiHelpers';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

const MetricCard = ({ label, value }) => (
    <Box sx={{
        p: 2,
        borderLeft: '3px solid',
        borderColor: 'primary.main',
        backgroundColor: 'action.hover',
        borderRadius: '0 4px 4px 0'
    }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
);
void MetricCard

const STATUS_COLORS = {
    passed: "#4caf50",
    failed: "#f44336",
    pending: "#ff9800",
    todo: "#2196f3",
    skipped: "#9e9e9e",
    unknown: "#bdbdbd"
};

const ChartContainer = ({ children, title }) => (
    <Box sx={{
        mb: 4,
        p: 3,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1
    }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>{title}</Typography>
        <Box sx={{ height: 300 }}>
            {children}
        </Box>
    </Box>
);
void ChartContainer

function descendingComparator(a, b) {
    return b.duration - a.duration;
}

function getComparator(order) {
    return order === 'desc'
        ? descendingComparator
        : (a, b) => -descendingComparator(a, b);
}

function stableSort(array, comparator) {
    const stabilized = array.map((el, idx) => [el, idx]);
    stabilized.sort((a, b) => {
        const cmp = comparator(a[0], b[0]);
        if (cmp !== 0) return cmp;
        return a[1] - b[1];
    });
    return stabilized.map((el) => el[0]);
}

const ROWS_PER_PAGE = 10;

function SlowTestsTable({ rows }) {
    const [order, setOrder] = useState('desc');
    const [page, setPage] = useState(0);

    const handleSort = () => setOrder(order === 'desc' ? 'asc' : 'desc');
    const handleChangePage = (_, newPage) => setPage(newPage);

    const sortedRows = stableSort(rows, getComparator(order));
    const paginatedRows = sortedRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

    return (
        <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ m: 2, fontWeight: 600 }}>
                Testes Mais Demorados
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>Arquivo</TableCell>
                        <TableCell sortDirection={order} sx={{ minWidth: 160 }}>
                            <TableSortLabel
                                active
                                direction={order}
                                onClick={handleSort}
                            >
                                Duração (s)
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedRows.map((row, idx) => (
                        <TableRow
                            key={row.name + row.suite}
                            sx={page === 0 && idx < 10
                                ? { backgroundColor: 'action.selected', fontWeight: 600 }
                                : {}
                            }
                        >
                            <TableCell sx={page === 0 && idx < 10 ? { fontWeight: 600 } : {}}>{row.name}</TableCell>
                            <TableCell sx={page === 0 && idx < 10 ? { fontWeight: 600 } : {}}>{row.suite}</TableCell>
                            <TableCell sx={page === 0 && idx < 10 ? { fontWeight: 600 } : {}}>
                                {(row.duration / 1000).toFixed(3)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={rows.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={ROWS_PER_PAGE}
                rowsPerPageOptions={[ROWS_PER_PAGE]}
            />
        </TableContainer>
    );
}


export default function Estatisticas() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const url = montarUrl('/relatorios/test-meta-report.json');
        buscarJson(url)
            .then(setData)
            .catch(logErroFetch);
    }, []);

    if (!data) {
        return (
            <ReportLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <Loader size={80} />
                </Box>
            </ReportLayout>
        );
    }

    // Data preparation
    const tests = Array.isArray(data.tests) ? data.tests : [];
    const statusData = Object.entries(
        tests.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {})
    ).map(([status, count]) => ({ status, count }));

    const tempoPorTeste = tests
        .filter(t => Number.isFinite(t.duration))
        .map(t => ({ name: t.title, duration: t.duration, suite: t.suite }));

    const assertsPorTeste = tests.map(t => ({
        name: t.title,
        asserts: t.numPassingAsserts || 0,
        suite: t.suite
    }));

    const arquivoData = Object.entries(
        tests.reduce((acc, t) => ({ ...acc, [t.suite]: (acc[t.suite] || 0) + 1 }), {})
    ).map(([suite, count]) => ({
        suite,
        percent: Number(((count / tests.length) * 100).toFixed(1)),
        count
    }));

    // Aggregate metrics
    const totalAsserts = assertsPorTeste.reduce((a, b) => a + b.asserts, 0);
    const duracoes = tempoPorTeste.map(t => t.duration);
    const duracaoTotal = duracoes.reduce((a, b) => a + b, 0);
    const duracaoMedia = duracoes.length ? duracaoTotal / duracoes.length : 0;


    // Gera lista de arquivos únicos
    const arquivos = Array.from(new Set(tests.map(t => t.suite)));

    // Gera lista de status únicos
    const statusList = Object.keys(STATUS_COLORS);

    // Monta dados agrupados por arquivo
    const statusPorArquivo = arquivos.map(suite => {
        const grupo = { suite };
        statusList.forEach(status => {
            grupo[status] = tests.filter(t => t.suite === suite && t.status === status).length;
        });
        return grupo;
    });

    return (
        <ReportLayout sx={{ p: 3 }}>
            <ReportHeader
                title="Estatísticas dos Testes"
                generatedAt={data.generatedAt}
                Icon={QueryStatsIcon}
            />

            {/* Aggregate Metrics */}
            <Box sx={{
                p: 3,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Métricas Gerais</Typography>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                    gap: 2
                }}>
                    <MetricCard label="Total de Testes" value={tests.length} />
                    <MetricCard label="Total de Asserts" value={totalAsserts} />
                    <MetricCard label="Duração Total" value={`${(duracaoTotal / 1000).toFixed(3)} s`} />
                    <MetricCard label="Duração Média" value={`${(duracaoMedia / 1000).toFixed(3)} s`} />
                </Box>
            </Box>

            {/* Status Distribution */}
            <ChartContainer title="Distribuição de Status por Arquivo">
                <ResponsiveContainer width="100%" height={Math.max(300, arquivos.length * 40)}>
                    <BarChart
                        data={statusPorArquivo}
                        layout="vertical"
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="suite" width={220} />
                        <Tooltip />
                        {statusList.map(status => (
                            <Bar
                                key={status}
                                dataKey={status}
                                stackId="a"
                                fill={STATUS_COLORS[status]}
                                name={status}
                                radius={[0, 4, 4, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>

            {/* Execution Time */}
            <ChartContainer title="Tempo de Execução">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempoPorTeste.slice(0, 20)}>
                        <XAxis dataKey="name" hide />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [`${value}ms`, "Duração"]} />
                        <Line
                            type="monotone"
                            dataKey="duration"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>



            {/* Asserts Distribution - Versão Aprimorada */}
            <ChartContainer title="Distribuição de Asserts por Teste">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={assertsPorTeste.slice(0, 15)}
                        layout="vertical"
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <XAxis
                            type="number"
                            domain={[0, 'dataMax + 1']}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={480} // aumenta espaço para rótulo
                        />
                        <Tooltip
                            formatter={(value) => [`${value} asserts`, 'Quantidade']}
                        />
                        <Bar
                            dataKey="asserts"
                            radius={[0, 4, 4, 0]}
                            minPointSize={2}
                        >
                            {assertsPorTeste.slice(0, 15).map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    strokeWidth={1}
                                />
                            ))}
                        </Bar>
                        <ReferenceLine
                            x={0}
                            strokeWidth={1}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>

            {/* Tests by File */}
            <ChartContainer title="Testes por Arquivo">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={arquivoData}
                            dataKey="count"
                            nameKey="suite"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ suite, percent }) => `${percent}%`}
                        >
                            {arquivoData.map((entry, idx) => (
                                <Cell key={entry.suite} fill={`hsl(${(idx * 60) % 360}, 70%, 60%)`} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} testes`, name]} />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>

            {/* Top 10 Slowest Tests */}
            <SlowTestsTable rows={tempoPorTeste} />

        </ReportLayout>
    );
}
