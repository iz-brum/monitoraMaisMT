import React, { useEffect, useState } from 'react';
import ReportLayout from './ReportLayout';
import ReportHeader from './ReportHeader';
import Loader from '@components/common/Loader';
import { montarUrl, buscarJson, logErroFetch } from '../shared/utils/apiHelpers';
import { Box, Chip, Typography, Stack, Divider } from '@mui/material';
import { CheckCircle, Error, PauseCircle, HelpOutline, Description } from '@mui/icons-material';

export default function Home() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const url = montarUrl('/relatorios/test-meta-report.json');
        buscarJson(url).then(setData).catch(logErroFetch);
    }, []);

    if (!data) {
        return (
            <ReportLayout>
                <Loader />
            </ReportLayout>
        );
    }

    const {
        numTotalTests,
        numPassedTests,
        numFailedTests,
        numPendingTests,
        numTodoTests,
        startTime,
        testResults
    } = data;

    const endTimes = (testResults || []).map(suite => suite.perfStats?.end).filter(Boolean);
    const totalDuration = endTimes.length && startTime ? Math.max(...endTimes) - startTime : 0;
    const validTests = numTotalTests - numPendingTests || 1;
    const successPercentage = ((numPassedTests / validTests) * 100).toFixed(2);
    const failPercentage = ((numFailedTests / validTests) * 100).toFixed(2);

    // Estilo minimalista para chips
    const chipStyle = {
        px: 1.5,
        py: 0.5,
        fontSize: '0.8125rem',
        fontWeight: 500,
        borderRadius: '6px',
        '&:hover': {
            transform: 'translateY(-1px)'
        }
    };

    return (
        <ReportLayout sx={{
            p: { xs: 2, md: 3 },
            '& > * + *': {
                mt: 4
            }
        }}>
            <ReportHeader
                title="Relatório de Testes"
                generatedAt={data.generatedAt}
                Icon={Description}
            />

            {/* Seção de Status */}
            <Box>
                <Typography variant="h5" sx={{
                    fontWeight: 600,
                    letterSpacing: '0.1px',
                    mb: 3,
                    pb: 1,
                    borderBottom: `1px solid`,
                    borderColor: 'divider'
                }}>
                    Resumo da Execução
                </Typography>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 1.5, sm: 2, md: 3 }}
                    sx={{
                        flexWrap: 'wrap',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        mb: 3,
                        '& .MuiChip-root': {
                            px: 1.5,
                            py: 1.8,
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                            borderRadius: '4px', // Valor fixo para o border-radius (pode ajustar para 8px, 12px, etc)
                            '& .MuiChip-icon': {
                                fontSize: { xs: '1rem', sm: '1.2rem' },
                                mr: { xs: 0.5, sm: 1 }
                            }
                        }
                    }}
                >
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, auto)' }, // 2 colunas em mobile, 4 em telas maiores
                        gap: { xs: 1.5, sm: 2, md: 2 },
                        mb: 3,
                        alignItems: 'center',
                        justifyItems: { xs: 'flex-start', sm: 'center' }, // Alinhamento adaptável
                        width: { xs: '100%', sm: 'auto' },
                    }}>
                        <Chip
                            icon={<CheckCircle color="success" />}
                            label={`${numPassedTests} passaram`}
                            color="success"
                            sx={{
                                borderRadius: '4px',
                                width: { xs: '100%', sm: 'auto' }, // Largura total em mobile
                                justifyContent: 'flex-start' // Alinha ícone e texto
                            }}
                        />
                        <Chip
                            icon={<Error color="error" />}
                            label={`${numFailedTests} falharam`}
                            color="error"
                            sx={{
                                borderRadius: '4px',
                                width: { xs: '100%', sm: 'auto' },
                                justifyContent: 'flex-start'
                            }}
                        />
                        <Chip
                            icon={<PauseCircle color="warning" />}
                            label={`${numPendingTests} pendentes`}
                            color="warning"
                            sx={{
                                borderRadius: '4px',
                                width: { xs: '100%', sm: 'auto' },
                                justifyContent: 'flex-start'
                            }}
                        />
                        <Chip
                            icon={<HelpOutline color="info" />}
                            label={`${numTodoTests} TODO`}
                            color="info"
                            sx={{
                                borderRadius: '4px',
                                width: { xs: '100%', sm: 'auto' },
                                justifyContent: 'flex-start'
                            }}
                        />
                    </Box>
                </Stack>
            </Box>

            {/* Seção de Métricas */}
            <Box sx={{
                display: 'grid',
                gridTemplateAreas: {
                    xs: `"total success"
         "fail duration"`,
                    sm: `"total success fail duration"`
                },
                gap: 3,
                mt: 4
            }}>
                <MetricCard
                    label="Total de Testes"
                    value={numTotalTests}
                    sx={{ gridArea: 'total' }}
                />
                <MetricCard
                    label="Taxa de Sucesso"
                    value={`${successPercentage}%`}
                    sx={{ gridArea: 'success' }}
                />
                <MetricCard
                    label="Taxa de Falha"
                    value={`${failPercentage}%`}
                    sx={{ gridArea: 'fail' }}
                />
                <MetricCard
                    label="Duração Total"
                    value={`${(totalDuration / 1000)}s`}
                    sx={{ gridArea: 'duration' }}
                />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Legenda de Status - Versão Final */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{
                    fontWeight: 500,
                    mb: 2
                }}>
                    Legenda de Status
                </Typography>

                <Box sx={{
                    display: { xs: 'grid', sm: 'flex' }, // Grid em mobile, flex em telas maiores
                    gridTemplateColumns: { xs: '1fr 1fr' }, // 2 colunas apenas em mobile
                    gap: { xs: 1.5, sm: 2 }, // Espaçamento adaptável
                    flexWrap: 'wrap', // Para telas médias
                    alignItems: 'center'
                }}>
                    <Chip
                        icon={<CheckCircle color="success" />}
                        label="Aprovado"
                        color="success"
                        sx={{
                            px: 1.5,
                            py: 1.8,
                            fontSize: '0.8rem',
                            borderRadius: '4px',
                            width: { xs: '100%', sm: 'auto' }, // Largura total apenas em mobile
                            justifyContent: 'flex-start',
                            '& .MuiChip-icon': {
                                fontSize: '1rem',
                                mr: 0.5
                            }
                        }}
                    />
                    <Chip
                        icon={<Error color="error" />}
                        label="Falhou"
                        color="error"
                        sx={{
                            px: 1.5,
                            py: 1.8,
                            fontSize: '0.8rem',
                            borderRadius: '4px',
                            width: { xs: '100%', sm: 'auto' },
                            justifyContent: 'flex-start',
                            '& .MuiChip-icon': {
                                fontSize: '1rem',
                                mr: 0.5
                            }
                        }}
                    />
                    <Chip
                        icon={<PauseCircle color="warning" />}
                        label="Pendente"
                        color="warning"
                        sx={{
                            px: 1.5,
                            py: 1.8,
                            fontSize: '0.8rem',
                            borderRadius: '4px',
                            width: { xs: '100%', sm: 'auto' },
                            justifyContent: 'flex-start',
                            '& .MuiChip-icon': {
                                fontSize: '1rem',
                                mr: 0.5
                            }
                        }}
                    />
                    <Chip
                        icon={<HelpOutline color="info" />}
                        label="TODO"
                        color="info"
                        sx={{
                            px: 1.5,
                            py: 1.8,
                            fontSize: '0.8rem',
                            borderRadius: '4px',
                            width: { xs: '100%', sm: 'auto' },
                            justifyContent: 'flex-start',
                            '& .MuiChip-icon': {
                                fontSize: '1rem',
                                mr: 0.5
                            }
                        }}
                    />
                </Box>
            </Box>
        </ReportLayout>
    );
}

void MetricCard
// Componente de métrica refinado
function MetricCard({ label, value }) {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
        }}>
            <Typography variant="overline" sx={{
                letterSpacing: '0.5px',
                opacity: 0.8,
                lineHeight: 1.5
            }}>
                {label}
            </Typography>
            <Typography variant="h5" sx={{
                fontWeight: 600,
                letterSpacing: '-0.5px'
            }}>
                {value}
            </Typography>
        </Box>
    );
}