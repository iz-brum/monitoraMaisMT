import React, { useEffect, useState } from 'react';
import ReportLayout from './ReportLayout';
import ReportHeader from './ReportHeader';
import Loader from '@components/common/Loader';
import BlocoInfoCenario from './BlocoInfoCenario';
import {
    Box,
    Typography,
    Chip,
    Divider,
    Select,
    MenuItem,
    TextField,
    ButtonGroup,
    Button,
} from '@mui/material';
import { montarUrl, buscarJson, logErroFetch } from '../shared/utils/apiHelpers';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import TimerIcon from '@mui/icons-material/Timer';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LabelImportantIcon from '@mui/icons-material/LabelImportant';
import BalanceIcon from '@mui/icons-material/Balance';
import { color } from 'chart.js/helpers';

const STATUS_CONFIG = {
    passed: { icon: '✔', label: 'Aprovado', color: 'success' },
    failed: { icon: '✖', label: 'Falhou', color: 'error' },
    pending: { icon: '⏸', label: 'Pendente', color: 'warning' },
    todo: { icon: '📝', label: 'TODO', color: 'info' },
    skipped: { icon: '⏭', label: 'Ignorado', color: 'default' },
    unknown: { icon: '?', label: 'Desconhecido', color: 'default' }
};

export default function DetalhesCenarios() {
    const [data, setData] = useState(null);
    const [filtroStatus, setFiltroStatus] = useState('all');
    const [filtroArquivo, setFiltroArquivo] = useState('all');
    const [filtroBusca, setFiltroBusca] = useState('');
    const [ordem, setOrdem] = useState('status');

    useEffect(() => {
        const url = montarUrl('/relatorios/test-meta-report.json');
        buscarJson(url)
            .then(setData)
            .catch(logErroFetch);
    }, []);

    if (!data) {
        return (
            <ReportLayout>
                <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader size={60} />
                </Box>
            </ReportLayout>
        );
    }

    // Processamento dos dados
    const cenarios = Array.isArray(data.tests) ? data.tests : [];
    const arquivos = [...new Set(cenarios.map(t => t.suite))];
    const statusDisponiveis = [...new Set(cenarios.map(t => t.status))];

    const cenariosFiltrados = cenarios.filter(t =>
        (filtroStatus === 'all' || t.status === filtroStatus) &&
        (filtroArquivo === 'all' || t.suite === filtroArquivo) &&
        (filtroBusca === '' || t.title.toLowerCase().includes(filtroBusca.toLowerCase()))
    );

    // Ordenação
    const cenariosOrdenados = [...cenariosFiltrados].sort((a, b) => {
        if (ordem === 'status') return STATUS_PRIORITY.indexOf(a.status) - STATUS_PRIORITY.indexOf(b.status);
        if (ordem === 'duração') return (b.duration || 0) - (a.duration || 0);
        if (ordem === 'asserts') return (b.numPassingAsserts || 0) - (a.numPassingAsserts || 0);
        return 0;
    });

    const cenariosPorArquivo = cenariosOrdenados.reduce((acc, test) => {
        if (!acc[test.suite]) acc[test.suite] = [];
        acc[test.suite].push(test);
        return acc;
    }, {});

    const estiloPre = {
        backgroundColor: theme => theme.palette.mode === 'light' ? '#f5f5f5' : '#232323',
        borderRadius: 1,
        fontFamily: 'monospace',
        fontSize: '0.95em',
        p: 1.5,
        mb: 1,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        border: '1px solid',
        borderColor: theme => theme.palette.divider,
        color: theme => theme.palette.text.primary,
        overflowX: 'auto'
    };

    // Agrupa cenários por describe
    const cenariosPorDescribe = {};
    cenarios.forEach(test => {
        const describe = Array.isArray(test.ancestorTitles) && test.ancestorTitles.length > 0
            ? test.ancestorTitles[0]
            : 'Sem grupo';
        if (!cenariosPorDescribe[describe]) cenariosPorDescribe[describe] = [];
        cenariosPorDescribe[describe].push(test);
    });



    return (
        <ReportLayout sx={{ 
            p: 3
             }}>
            <ReportHeader
                title="Detalhes dos Cenários"
                generatedAt={data.generatedAt}
                Icon={ContentPasteSearchIcon}
            />

            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <Select
                    value={filtroStatus}
                    onChange={e => setFiltroStatus(e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="all">Todos status</MenuItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        statusDisponiveis.includes(key) && (
                            <MenuItem key={key} value={key}>{config.label}</MenuItem>
                        )
                    ))}
                </Select>

                <Select
                    value={filtroArquivo}
                    onChange={e => setFiltroArquivo(e.target.value)}
                    size="small"
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="all">Todos arquivos</MenuItem>
                    {arquivos.map(arquivo => (
                        <MenuItem key={arquivo} value={arquivo}>
                            {arquivo.split('/').pop()}
                        </MenuItem>
                    ))}
                </Select>

                <TextField
                    value={filtroBusca}
                    onChange={e => setFiltroBusca(e.target.value)}
                    size="small"
                    label="Buscar cenário"
                    sx={{ minWidth: 180 }}
                />

                <ButtonGroup size="small" variant="outlined">
                    <Button
                        onClick={() => setOrdem('status')}
                        variant={ordem === 'status' ? 'contained' : 'outlined'}
                    >
                        Status
                    </Button>
                    <Button
                        onClick={() => setOrdem('duração')}
                        variant={ordem === 'duração' ? 'contained' : 'outlined'}
                    >
                        Duração
                    </Button>
                    <Button
                        onClick={() => setOrdem('asserts')}
                        variant={ordem === 'asserts' ? 'contained' : 'outlined'}
                    >
                        Asserts
                    </Button>
                </ButtonGroup>
            </Box>


            {/* Lista de cenários */}
            {Object.entries(cenariosPorArquivo).map(([arquivo, lista]) => {
                // Agrupa cenários por describe
                const describes = lista.reduce((acc, test) => {
                    const describe = test.ancestorTitles?.[0] || 'Sem grupo';
                    acc[describe] = [...(acc[describe] || []), test];
                    return acc;
                }, {});

                return (
                    <Box key={arquivo} sx={{ mb: 4 }}>
                        {/* Cabeçalho do Arquivo */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: { xs: 0.5, sm: 2 },
                            mb: 2,
                            p: 1.5,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            boxShadow: 1,
                            borderLeft: '4px solid',
                            borderColor: 'primary.main'
                        }}>
                            {/* Ícone + Nome do arquivo juntos */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <FilePresentIcon color="primary" sx={{ fontSize: { xs: 22, sm: 28 } }} />
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: { xs: '1rem', sm: '1.15rem' }, // Fonte menor no mobile
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {arquivo.split('/').pop()}
                                </Typography>
                            </Box>
                            {/* Chip ao lado no desktop, abaixo no mobile */}
                            <Chip
                                label={`${lista.length} teste(s)`}
                                size="small"
                                color="info"
                                sx={{
                                    alignSelf: { xs: 'flex-start', sm: 'center' },
                                    mt: { xs: 0.5, sm: 0 }
                                }}
                            />
                        </Box>

                        {/* Grid de cenários de cada describe */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr' },
                            gap: 3,
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            {Object.entries(describes).map(([describe, cenarios]) => (
                                <Box key={describe} sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    boxShadow: 1,
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden'
                                }}>
                                    {/* Header do Describe */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2,
                                        pb: 1,
                                        borderBottom: '1px dashed',
                                        borderColor: 'divider'
                                    }}>
                                        <LabelImportantIcon fontSize="small" color="secondary" />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            Descrição: {describe}
                                        </Typography>
                                    </Box>

                                    {/* Grid de Cenários (2x2) */}
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: '1fr' },
                                        gap: 2
                                    }}>
                                        {cenarios.map(test => (
                                            <Box key={test.fullName} sx={{
                                                p: 1.5,
                                                borderLeft: '3px solid',
                                                borderColor: `${STATUS_CONFIG[test.status].color}.main`,
                                                bgcolor: 'background.default',
                                                borderRadius: '0 4px 4px 0'
                                            }}>
                                                {/* Título + Status + Métricas */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' }, // Coluna em mobile, linha em telas maiores
                                                    gap: { xs: 1, sm: 1.5 }, // Espaçamento adaptável
                                                    mb: 1,
                                                    alignItems: { xs: 'flex-start', sm: 'center' }
                                                }}>
                                                    {/* Título - Ocupa espaço prioritário */}
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 500,
                                                            flex: '1 1 auto', // Cresce e encolhe conforme necessário
                                                            minWidth: 0, // Permite que o texto quebre
                                                            wordBreak: 'break-word' // Quebra palavras longas
                                                        }}
                                                    >
                                                        Cenário: {test.title}
                                                    </Typography>

                                                    {/* Container de Chips - Agrupados para melhor responsividade */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: 1.2,
                                                        alignItems: 'center',
                                                        flex: '0 0 auto' // Não cresce, apenas ocupa espaço necessário
                                                    }}>
                                                        <Chip
                                                            label={STATUS_CONFIG[test.status].label}
                                                            icon={<CheckCircleIcon fontSize="inherit" sx={{ fontSize: '0.8rem' }} />}
                                                            size="small"
                                                            color={STATUS_CONFIG[test.status].color}
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.8125rem',
                                                                py: 1,
                                                                px: 1.2,
                                                            }}
                                                        />
                                                        <Chip
                                                            icon={<TimerIcon fontSize="inherit" sx={{ fontSize: '0.8125rem' }} />}
                                                            label={`${(test.duration / 1000).toFixed(3)}s`}
                                                            variant="filled"
                                                            size="small"
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.7rem',
                                                                py: 1,
                                                                px: 1.2,
                                                                '& .MuiChip-label': { paddingLeft: 1.2 },
                                                                bgcolor: theme => theme.palette.mode === 'light'
                                                                    ? theme.palette.primary.main // Azul mais vibrante (bom contraste no light)
                                                                    : '#1c6cc8ff', // Vermelho escuro (bom contraste no dark)
                                                                color: theme => theme.palette.getContrastText( // Cor automática para contraste
                                                                    theme.palette.mode === 'light'
                                                                        ? theme.palette.primary.main
                                                                        : '#d32f2f'
                                                                ),
                                                                '& .MuiChip-icon': {
                                                                    color: 'inherit' // Garante que o ícone tenha a mesma cor do texto
                                                                }
                                                            }}
                                                        />
                                                        <Chip
                                                            icon={<BalanceIcon fontSize="inherit" sx={{ fontSize: '0.8rem' }} />} // TROCAR ÍCONE 
                                                            label={`${test.numPassingAsserts} asserts`}
                                                            color="secondary"
                                                            size="small"
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.8125rem',
                                                                py: 1,
                                                                px: 1.2,
                                                                '& .MuiChip-label': { paddingLeft: 1.2 }
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {test.meta && Object.values(test.meta).some(v => v !== null && v !== undefined) && (
                                                    <BlocoInfoCenario metaData={{ ...test.meta, resumoResultado: test.resumoResultado }} />
                                                )}

                                                {/* Mensagens de Erro - Versão Otimizada para Leitura */}
                                                {test.failureMessages?.length > 0 && (
                                                    <Box sx={{
                                                        mt: 1.5,
                                                        border: '1px solid',
                                                        borderColor: theme => theme.palette.error.main,
                                                        borderRadius: 1,
                                                        bgcolor: theme => theme.palette.mode === 'light'
                                                            ? '#add2ded3'  // Azul claro
                                                            : '#ff000040', // Vermelho semi-transparente
                                                        width: '100%',
                                                        maxHeight: 200,
                                                        overflow: 'auto',
                                                        boxShadow: theme => `0 1px 3px ${theme.palette.error.light}40`,
                                                        '&::-webkit-scrollbar': {
                                                            width: '6px'
                                                        },
                                                        '&::-webkit-scrollbar-thumb': {
                                                            backgroundColor: theme => theme.palette.error.main,
                                                            borderRadius: '3px'
                                                        }
                                                    }}>
                                                        <Typography
                                                            component="pre"
                                                            variant="caption"
                                                            sx={{
                                                                p: 1.5,
                                                                whiteSpace: 'pre-wrap',
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.75rem',
                                                                lineHeight: 1.6, // Melhor espaçamento entre linhas
                                                                color: theme => theme.palette.mode === 'light'
                                                                    ? theme.palette.error[800]  // Vermelho escuro
                                                                    : theme.palette.error[100], // Vermelho claro
                                                                '& strong': {
                                                                    color: 'inherit',
                                                                    fontWeight: 700,
                                                                    backgroundColor: theme => theme.palette.mode === 'light'
                                                                        ? theme.palette.error[100]
                                                                        : theme.palette.error[800] + '40',
                                                                    px: 0.5,
                                                                    borderRadius: 0.5
                                                                }
                                                            }}
                                                        >
                                                            {test.failureMessages.map((msg, i) => (
                                                                <React.Fragment key={i}>
                                                                    {msg.split('\n').map((line, j) => {
                                                                        const isErrorLine = line.match(/error:|fail:/i);
                                                                        return (
                                                                            <Box
                                                                                key={j}
                                                                                component="span"
                                                                                sx={{
                                                                                    display: 'block',
                                                                                    mb: 0.5,
                                                                                    ...(isErrorLine && {
                                                                                        fontWeight: 700,
                                                                                        color: theme => theme.palette.mode === 'light'
                                                                                            ? theme.palette.error.dark
                                                                                            : theme.palette.error.light
                                                                                    })
                                                                                }}
                                                                            >
                                                                                {line}
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                    {i < test.failureMessages.length - 1 && (
                                                                        <Box component="span" sx={{ display: 'block', height: '0.5rem' }} />
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                );
            })}
        </ReportLayout>
    );
}

const STATUS_PRIORITY = ['passed', 'failed', 'pending', 'todo', 'skipped', 'unknown'];
