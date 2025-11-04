import Dashboard from './Dashboard';
import ReportLayout from './ReportLayout';
import ReportHeader from './ReportHeader';
import Loader from '@components/common/Loader';
import { Box, Typography, Chip, Stack, Divider, useTheme, Select, MenuItem, TextField, ButtonGroup, Button } from '@mui/material';
import * as MuiIcons from '@mui/icons-material';
void Dashboard, ReportLayout, ReportHeader, Loader;
import { useEffect, useState } from 'react';
import { montarUrl, buscarJson, logErroFetch } from '../shared/utils/apiHelpers';


// 
export default function ResumoTestes() {
    const [filtroStatus, setFiltroStatus] = useState('all');
    const [filtroBusca, setFiltroBusca] = useState('');
    const [ordem, setOrdem] = useState('status');
    const theme = useTheme();
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
                <Box sx={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Loader size={50} />
                </Box>
            </ReportLayout>
        );
    }

    // Cálculos dos dados (mantidos iguais)
    const suites = {};
    data.tests?.forEach(t => {
        if (!suites[t.suite]) suites[t.suite] = [];
        suites[t.suite].push(t);
    });

    const validTests = data.numTotalTests - data.numPendingTests || 1;
    const totalAsserts = data.tests?.reduce((acc, t) => acc + (t.numPassingAsserts || 0), 0);
    const testeMaisAsserts = data.tests?.reduce((max, t) =>
        (t.numPassingAsserts || 0) > (max.numPassingAsserts || 0) ? t : max, { numPassingAsserts: 0 });

    // Tempo total do processo (igual ao Home)
    const endTimes = data.testResults?.map(suite => suite.perfStats?.end).filter(Boolean);
    const tempoTotalProcesso = endTimes?.length && data.startTime
        ? Math.max(...endTimes) - data.startTime
        : 0;

    // Tempo total somado dos testes (já existente)
    const duracoes = data.tests?.map(t => t.duration).filter(Number.isFinite);
    const duracaoTotalTestes = duracoes?.reduce((a, b) => a + b, 0) || 0;
    const duracaoMedia = duracoes?.length ? duracaoTotalTestes / duracoes.length : 0;
    const duracaoMax = duracoes?.length ? Math.max(...duracoes) : 0;
    const duracaoMin = duracoes?.length ? Math.min(...duracoes) : 0;

    const porcentagemAprovados = ((data.numPassedTests / validTests) * 100).toFixed(2);
    const porcentagemFalhas = ((data.numFailedTests / validTests) * 100).toFixed(1);
    const porcentagemPendentes = ((data.numPendingTests / data.numTotalTests) * 100).toFixed(1);
    const porcentagemTodo = ((data.numTodoTests / data.numTotalTests) * 100).toFixed(1);

    const {
        generatedAt,
        numPendingTests,
        numFailedTests,
        numTodoTests,
        numRuntimeErrorTestSuites,
        snapshot
    } = data;

    const inicio = data.startTime ? new Date(data.startTime) : null;
    const fim = data.generatedAt ? new Date(data.generatedAt) : null;

    // Estilo compartilhado para chips
    const chipStyle = {
        px: 1,
        py: 2,
        fontSize: '.9125rem',
        fontWeight: 600,
        borderRadius: '5px',
        '&:hover': { transform: 'translateY(-1px)' },
        '& .MuiChip-label': {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
        },
    };

    const statusOptions = [
        { value: 'all', label: 'Todos' },
        { value: 'passed', label: 'Aprovado' },
        { value: 'failed', label: 'Falhou' },
        { value: 'pending', label: 'Pendente' },
        { value: 'todo', label: 'TODO' },
        { value: 'skipped', label: 'Ignorado' }
    ];

    const ordenarTests = (tests) => {
        if (ordem === 'duração') return [...tests].sort((a, b) => (b.duration || 0) - (a.duration || 0));
        if (ordem === 'asserts') return [...tests].sort((a, b) => (b.numPassingAsserts || 0) - (a.numPassingAsserts || 0));
        return ordenarPorStatus(tests);
    };

    const arquivosUnicos = Array.from(new Set(data.tests?.map(t => t.suite))).sort();

    const filtroOptions = [
        ...statusOptions,
        ...arquivosUnicos.map(arq => ({
            value: `file:${arq}`,
            label: `Arquivo: ${arq}`
        }))
    ];

    const suitesFiltradas = Object.entries(suites).map(([suite, tests]) => {
        const filtrados = tests.filter(t => {
            if (filtroStatus === 'all') return true;
            if (filtroStatus.startsWith('file:')) return t.suite === filtroStatus.replace('file:', '');
            return t.status === filtroStatus;
        }).filter(t =>
            filtroBusca === '' ||
            t.title.toLowerCase().includes(filtroBusca.toLowerCase()) ||
            t.suite.toLowerCase().includes(filtroBusca.toLowerCase())
        );
        return [suite, ordenarTests(filtrados)];
    }).filter(([_, tests]) => tests.length > 0);

    return (
        <ReportLayout sx={{ p: { xs: 2, md: 3 } }}>
            <ReportHeader
                title="Resumo dos Testes"
                generatedAt={generatedAt}
                Icon={MuiIcons.Summarize}
            />

            {/* Seção de Status Principal */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{
                    fontWeight: 600,
                    letterSpacing: '0.1px',
                    mb: 3,
                    pb: 1,
                    borderBottom: `1px solid`,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <MuiIcons.Assessment fontSize="medium" />
                    Visão Geral
                </Typography>

                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                    <Chip
                        icon={<MuiIcons.CheckCircle color="success" />}
                        label={
                            <>
                                <span>{data.numPassedTests} Aprovados</span>
                                <span style={{ opacity: 0.8, fontSize: '0.9em' }}>
                                    ({porcentagemAprovados}%)
                                </span>
                            </>
                        }
                        color="success"
                        sx={chipStyle}
                    />
                    <Chip
                        icon={<MuiIcons.Error color="error" />}
                        label={
                            <>
                                <span>{data.numFailedTests} Falhas</span>
                                <span style={{ opacity: 0.8, fontSize: '0.9em' }}>
                                    ({porcentagemFalhas}%)
                                </span>
                            </>
                        }
                        color="error"
                        sx={chipStyle}
                    />
                    <Chip
                        icon={<MuiIcons.PauseCircle color="warning" />}
                        label={
                            <>
                                <span>{data.numPendingTests} Pendentes</span>
                                <span style={{ opacity: 0.8, fontSize: '0.9em' }}>
                                    ({porcentagemPendentes}%)
                                </span>
                            </>
                        }
                        color="warning"
                        sx={chipStyle}
                    />
                    <Chip
                        icon={<MuiIcons.HelpOutline color="info" />}
                        label={
                            <>
                                <span>{data.numTodoTests} TODO</span>
                                <span style={{ opacity: 0.8, fontSize: '0.9em' }}>
                                    ({porcentagemTodo}%)
                                </span>
                            </>
                        }
                        color="info"
                        sx={chipStyle}
                    />
                </Stack>
            </Box>

            {/* Seção de Estatísticas de Tempo */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                }}>
                    <MuiIcons.Timer fontSize="small" />
                    Duração dos Testes
                </Typography>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                    gap: 3,
                    alignItems: 'stretch', // força altura igual
                    mb: 2
                }}>
                    <MetricCard
                        label="Duração Total (processo)"
                        value={msParaSegundos(tempoTotalProcesso)}
                    />
                    <MetricCard
                        label="Duração Total (soma dos testes)"
                        value={msParaSegundos(duracaoTotalTestes)}
                    />
                    <MetricCard
                        label="Duração Média"
                        value={msParaSegundos(duracaoMedia)}
                    />
                    <MetricCard
                        label="Duração Máxima"
                        value={msParaSegundos(duracaoMax)}
                    />
                    <MetricCard
                        label="Duração Mínima"
                        value={msParaSegundos(duracaoMin)}
                    />
                </Box>
                <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary', display: 'block' }}>
                    <b>Duração Total (processo):</b> tempo entre o início e o fim da execução de todos os testes, incluindo overhead, setup e teardown.<br />
                    <b>Duração Total (soma dos testes):</b> soma dos tempos individuais de cada teste, sem considerar intervalos ou overhead global.
                </Typography>
            </Box>

            {/* Seção de Execução */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                }}>
                    <MuiIcons.AccessTime fontSize="small" />
                    Execução
                </Typography>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 3
                }}>
                    <MetricCard
                        label="Início"
                        value={inicio ? inicio.toLocaleString('pt-BR') : '-'}
                        sx={{ labelFontSize: '1rem' }} // valor desejado
                    />
                    <MetricCard
                        label="Fim"
                        value={fim ? fim.toLocaleString('pt-BR') : '-'}
                        sx={{ labelFontSize: '1rem' }}
                    />
                </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Seção de Asserts */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 3,  // Aumentei o margin-bottom
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'text.primary'  // Garantindo consistência de cor
                }}>
                    <MuiIcons.Assessment fontSize="small" />
                    Asserts
                </Typography>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '260px 1fr' },
                        gap: 3,
                        alignItems: 'stretch',
                        position: 'relative',
                        '&:hover': {
                            '&::before': {
                                opacity: 1,
                            }
                        },
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -2,
                            left: -2,
                            right: -2,
                            bottom: -2,
                            background: 'linear-gradient(45deg, #ff00cc, #3333ff)',
                            borderRadius: 'inherit',
                            zIndex: -1,
                            opacity: 0,
                            transition: 'opacity 0.3s ease-in-out',
                        }
                    }}
                >
                    <MetricCard
                        label="Total de Asserts"
                        value={totalAsserts}
                        sx={{
                            minWidth: 0,
                            maxWidth: '100%',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        icon={
                            <Box
                                sx={{
                                    position: 'relative',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    color: 'secondary.main',
                                    p: '4px 8px',
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    borderRadius: '4px',
                                    transition: 'all 0.3s ease',
                                    width: '80px', // Largura fixa para caber apenas "expect()"
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        width: '135px', // Largura expandida para caber "expect().toBe()"
                                        color: 'primary.main',
                                        borderColor: 'primary.light',
                                        backgroundColor: 'action.hover',
                                        '& .assert-part': {
                                            opacity: 1,
                                            transform: 'translateX(0)'
                                        }
                                    }
                                }}
                            >
                                expect()
                                <Box
                                    className="assert-part"
                                    sx={{
                                        display: 'inline-block',
                                        opacity: 0,
                                        transform: 'translateX(-10px)',
                                        transition: 'all 0.3s ease 0.1s',
                                    }}
                                >
                                    .toBe()
                                </Box>
                            </Box>
                        }
                    />
                    <MetricCard
                        label="Maior Cenário"
                        value={`${testeMaisAsserts?.numPassingAsserts || 0} asserts`}
                        subvalue={testeMaisAsserts?.fullName || '-'}
                        sx={{
                            minWidth: 0,
                            maxWidth: '100%',
                            position: 'relative',
                            overflow: 'hidden',

                        }}
                        icon={
                            <MuiIcons.TrendingUp
                                sx={{
                                    color: 'warning.main',
                                    fontSize: '2rem',
                                    transition: 'transform 0.3s ease',
                                    '&:hover': { transform: 'rotate(45deg) translateY(-3px)' },
                                }}
                            />
                        }
                    />
                </Box>
            </Box>
            <Box sx={{
                p: 2,
                backgroundColor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        mt: 1,
                        mb: 2,
                        maxWidth: 900,
                        lineHeight: 1.7
                    }}
                >
                    <Box
                        component="span"
                        sx={{
                            display: 'inline-block',
                            backgroundColor: theme => theme.palette.primary.light,
                            color: theme => theme.palette.primary.contrastText,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 600,
                            mb: 1,
                            boxShadow: 1
                        }}
                    >
                        O que é um Assert?
                    </Box>

                    <Box component="p" sx={{ mt: 1.5, mb: 1.5 }}>
                        Um <b>assert</b> é uma afirmação no teste que verifica se algo está correto.
                    </Box>

                    <Box component="div" sx={{
                        backgroundColor: 'action.hover',
                        p: 1.5,
                        borderRadius: 1,
                        borderLeft: '3px solid',
                        borderColor: 'primary.main',
                        fontFamily: 'monospace',
                        mb: 1.5
                    }}>
                        <b>Exemplo:</b> expect(soma(2, 2)).toBe(4);
                    </Box>

                    <Box component="p" sx={{ mt: 1.5 }}>
                        Se a condição for falsa, o teste falha. Cada linha dessas é um assert.
                    </Box>
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Seção de Snapshots */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                }}>
                    <MuiIcons.CameraAlt fontSize="small" />
                    Snapshots
                </Typography>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                    gap: 3,
                    mb: 3
                }}>
                    <MetricCard
                        label="Total"
                        value={snapshot?.total || 0}
                    />
                    <MetricCard
                        label="Adicionados"
                        value={snapshot?.added || 0}
                        color="success"
                    />
                    <MetricCard
                        label="Removidos"
                        value={snapshot?.filesRemoved || 0}
                        color="error"
                    />
                    <MetricCard
                        label="Atualizados"
                        value={snapshot?.updated || 0}
                        color="warning"
                    />
                </Box>

                <Box sx={{
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="body2" component="div" sx={{
                        color: 'text.secondary',
                        lineHeight: 1.6,
                        '& strong': { color: 'text.primary' }
                    }}>
                        <strong>O que são Snapshots?</strong><br />
                        Snapshots são registros do output esperado de seus componentes. Quando os testes são executados, o Jest compara o resultado atual com o snapshot armazenado.

                        <Box component="ul" sx={{ pl: 2.5, mt: 1, mb: 1, '& li': { mb: 0.5 } }}>
                            <li><strong>Adicionados:</strong> Novos snapshots criados na execução atual</li>
                            <li><strong>Removidos:</strong> Snapshots obsoletos excluídos</li>
                            <li><strong>Atualizados:</strong> Snapshots modificados intencionalmente</li>
                        </Box>

                        <Typography variant="caption" component="div" sx={{
                            display: 'inline-block',
                            mt: 1,
                            p: 1,
                            backgroundColor: 'action.hover',
                            borderRadius: 1,
                            fontFamily: 'monospace'
                        }}>
                            Dica: Use <strong>--updateSnapshot</strong> para atualizar snapshots intencionalmente
                        </Typography>
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{
                fontWeight: 600,
                mb: 1.5,
                color: 'primary.main'
            }}>
                Filtros e Busca de Testes
            </Typography>
            <Typography variant="body2" sx={{
                color: 'text.secondary',
                mb: 2,
                maxWidth: 700
            }}>
                Utilize os filtros para visualizar apenas os testes de um status específico ou de um arquivo de teste. Você também pode buscar pelo nome do teste ou pelo arquivo usando o campo de busca.
            </Typography>

            {/* Seção de Suítes */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Select
                    value={filtroStatus}
                    onChange={e => setFiltroStatus(e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                >
                    {filtroOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                </Select>
                <TextField
                    value={filtroBusca}
                    onChange={e => setFiltroBusca(e.target.value)}
                    size="small"
                    label="Buscar teste"
                    sx={{ minWidth: 180 }}
                />
                <ButtonGroup size="small" variant="outlined">
                    <Button onClick={() => setOrdem('status')} variant={ordem === 'status' ? 'contained' : 'outlined'}>Status</Button>
                    <Button onClick={() => setOrdem('duração')} variant={ordem === 'duração' ? 'contained' : 'outlined'}>Duração</Button>
                    <Button onClick={() => setOrdem('asserts')} variant={ordem === 'asserts' ? 'contained' : 'outlined'}>Asserts</Button>
                </ButtonGroup>
            </Box>

            {suitesFiltradas.map(([suite, tests]) => (
                <Box key={suite} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{
                        fontWeight: 500,
                        mb: 1,
                        color: 'text.secondary'
                    }}>
                        {suite}
                    </Typography>

                    <Box component="ul" sx={{
                        pl: 0,
                        listStyleType: 'none',
                        '& li': {
                            py: 1,
                            px: 1.5,
                            mb: 1,
                            borderLeft: `3px solid ${theme.palette.primary.light}`,
                            backgroundColor: 'background.paper',
                            borderRadius: '0 4px 4px 0',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', // Sombra permanente sutil
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Sombra mais forte no hover
                                backgroundColor: 'action.hover',
                                borderLeftColor: theme.palette.primary.main,
                            },
                            '& .MuiTypography-root': {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap'
                            }
                        }
                    }}>
                        {tests.map(t => (
                            <li key={t.fullName}>
                                <Typography variant="body2" component="div">
                                    <Box component="span" sx={{
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        minWidth: '120px',
                                        display: 'inline-block'
                                    }}>
                                        {t.title}
                                    </Box>

                                    <Box component="span" sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}>
                                        <StatusChip status={t.status} />

                                        <Box component="span" sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            ml: 1
                                        }}>
                                            <MuiIcons.Assessment fontSize="inherit" color="action" />
                                            <span>{t.numPassingAsserts || 0} asserts</span>
                                        </Box>

                                        <Box component="span" sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            ml: 1
                                        }}>
                                            <MuiIcons.AccessTime fontSize="inherit" color="action" />
                                            <span>{t.duration ? msParaSegundos(t.duration) : '-'}</span>
                                        </Box>
                                    </Box>
                                </Typography>
                            </li>
                        ))}
                    </Box>
                </Box>
            ))}

        </ReportLayout>
    );
}

// Componente auxiliar para métricas
function MetricCard({ label, value, subvalue, icon, color, sx = {} }) {
    return (
        <Box sx={{
            p: 2,
            borderRadius: '8px',
            border: `1px solid`,
            borderColor: 'divider',
            height: '100%', // ocupa toda a célula do grid
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // centraliza verticalmente
            ...sx,
        }}>
            <Typography variant="overline" sx={{
                display: 'block',
                lineHeight: 1.5,
                letterSpacing: '0.5px',
                opacity: 0.8,
                mb: 0.5,
                fontSize: sx.labelFontSize || undefined
            }}>
                {label}
            </Typography>
            <Typography variant="h6" sx={{
                fontWeight: 600,
                color: color ? `${color}.main` : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                {icon && <span style={{ marginRight: 6, display: 'flex', alignItems: 'center' }}>{icon}</span>}
                {value}
            </Typography>
            {subvalue && (
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        mt: 0.5,
                        whiteSpace: 'normal', // permite quebra de linha
                        wordBreak: 'break-word', // quebra palavras longas
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {subvalue}
                </Typography>
            )}
        </Box>
    );
} void MetricCard;

// Componente especializado para métricas de tempo
function TimeMetricCard({ label, value, tooltip }) {
    return (
        <Tooltip title={tooltip} arrow>
            <Box sx={{
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1
                }
            }}>
                <Typography variant="body2" sx={{
                    fontWeight: 500,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: 'warning.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <MuiIcons.Timer sx={{ fontSize: 14, color: 'warning.contrastText' }} />
                    </Box>
                    {label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {value}
                </Typography>
            </Box>
        </Tooltip>
    );
} void TimeMetricCard;

// Componente para status dos testes
function StatusChip({ status }) {
    const config = {
        passed: { color: 'success', icon: <MuiIcons.CheckCircle fontSize="small" />, label: 'Aprovado' },
        failed: { color: 'error', icon: <MuiIcons.Error fontSize="small" />, label: 'Falhou' },
        pending: { color: 'warning', icon: <MuiIcons.PauseCircle fontSize="small" />, label: 'Pendente' },
        todo: { color: 'info', icon: <MuiIcons.HelpOutline fontSize="small" />, label: 'TODO' },
        skipped: { color: 'default', icon: <MuiIcons.PauseCircle fontSize="small" />, label: 'Pulado' }
    }[status] || { color: 'default', label: status };

    return (
        <Chip
            size="small"
            icon={config.icon}
            label={config.label}
            color={config.color}
            sx={{
                mx: 0.5,
                height: '24px',
                '& .MuiChip-label': { px: 0.5 }
            }}
        />
    );
} void StatusChip;

function msParaSegundos(ms) {
    return (ms / 1000).toFixed(3) + 's';
}

// Defina a prioridade dos status (pode ser exportado futuramente)
const STATUS_PRIORITY = ['passed', 'failed', 'pending', 'todo', 'skipped', 'unknown'];

function ordenarPorStatus(tests, prioridade = STATUS_PRIORITY) {
    const idx = status => {
        const i = prioridade.indexOf(status);
        return i === -1 ? prioridade.length : i;
    };
    return [...tests].sort((a, b) => idx(a.status) - idx(b.status));
}