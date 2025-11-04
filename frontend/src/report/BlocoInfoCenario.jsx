import {
    Box,
    Typography,
    List,
    ListItem,
    Chip,
    Paper,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DataObjectIcon from '@mui/icons-material/DataObject';
// import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import FlagIcon from '@mui/icons-material/Flag';
import ListAltIcon from '@mui/icons-material/ListAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    marginBottom: theme.spacing(2),
}));

const FieldContainer = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(1.5),
    '&:last-child': {
        marginBottom: 0,
    },
}));

const FieldLabel = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const ValueContainer = styled(Box)(({ theme }) => ({
    paddingLeft: theme.spacing(.5),
    color: theme.palette.text.primary,
}));

const StyledList = styled(List)({
    paddingTop: 0,
    paddingBottom: 0,
});

const StyledListItem = styled(ListItem)(({ theme }) => ({
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: theme.spacing(1.5),
    '&:before': {
        content: '"•"',
        color: theme.palette.primary.main,
        marginRight: theme.spacing(1),
    },
}));

const AdaptiveValue = ({ value }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    if (value === null || value === undefined) {
        return null;
    }

    // Tratamento para objetos (JSON)
    if (typeof value === 'object') {
        return (
            <JsonContainer component="pre">
                {JSON.stringify(value, null, 2)}
            </JsonContainer>
        );
    }

    // Tratamento para arrays
    if (Array.isArray(value)) {
        return (
            <StyledList dense>
                {value.map((item, index) => (
                    <StyledListItem key={index}>
                        <Typography variant="body2">{item}</Typography>
                    </StyledListItem>
                ))}
            </StyledList>
        );
    }

    // Tratamento para URLs
    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
        return (
            <Link
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                    color: theme.palette.primary.main,
                    wordBreak: 'break-all',
                    display: 'inline-block',
                    maxWidth: '100%'
                }}
            >
                {value}
            </Link>
        );
    }

    // Tratamento para texto longo
    if (typeof value === 'string' && value.length > 50) {
        return (
            <Typography
                variant="body2"
                sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6
                }}
            >
                {value}
            </Typography>
        );
    }

    // Valor padrão
    return (
        <Typography
            variant="body2"
            sx={{
                lineHeight: 1.6,
                ...(isSmallScreen && { fontSize: '0.875rem' })
            }}
        >
            {value.toString()}
        </Typography>
    );
};

function SubtituloChip({ label, icon }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    return (
        <Chip
            label={label}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            icon={icon}
            sx={{ fontWeight: 600, mb: 1 }}
        />
    );
}

export default function BlocoInfoCenario({ metaData }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const renderValue = (value) => {
        if (value == null) return null;
        if (typeof value === 'object') {
            return (
                <Box component="pre" sx={{
                    margin: 0,
                    // backgroundColor: 'gray', // REMOVER EM BREVE
                    overflowX: 'auto',
                    fontSize: '0.875rem',
                }}>
                    {JSON.stringify(value, null, 2)}
                </Box>
            );
        }
        return value.toString();
    };

    const fieldLabels = {
        objetivo: 'Objetivo',
        criterios: 'Critérios',
        esperado: 'Esperado',
        contexto: 'Contexto',
        parametros: 'Parâmetros',
        exemploEntrada: 'Exemplo de Entrada',
        exemploSaida: 'Exemplo de Saída',
        periodo: 'Período',
        filtros: 'Filtros',
        resumoResultado: 'Preview',
        total: 'Total de Itens',
        agrupamento: 'Agrupamento',
        status: 'Status',
    };

    // separa o campo resumoResultado do resto
    const entries = Object.entries(metaData || {})
        .filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0));
    const resumoEntry = entries.find(([k]) => k === 'resumoResultado');
    const parametrosEntry = entries.find(([k]) => k === 'query' || k === 'parametrosRequest');
    const otherEntries = entries.filter(([k]) => k !== 'resumoResultado' && k !== 'query' && k !== 'parametrosRequest');

    return (
        <StyledPaper>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: theme.spacing(2),
                }}
            >

                {/* Coluna ESQUERDA: todos os outros campos */}
                <Box sx={{ flex: isMobile ? 'none' : 1 }}>
                    {otherEntries.map(([key, value], index) => {
                        // Objetivo
                        if (key === 'objetivo') {
                            return (
                                <FieldContainer key={key} sx={{ mb: 2 }}>
                                    <SubtituloChip label={fieldLabels[key] || key} icon={<FlagIcon />} />
                                    <AdaptiveValue value={value} />
                                </FieldContainer>
                            );
                        }
                        // Critérios
                        if (key === 'criterios' || key === 'o_que_verificar') {
                            const criterios = Array.isArray(value) ? value : [value];
                            return (
                                <FieldContainer key={key} sx={{ mb: 2 }}>
                                    <SubtituloChip label={fieldLabels[key] || key} icon={<ListAltIcon />} />
                                    <StyledList dense>
                                        {criterios.map((c, i) => (
                                            <StyledListItem key={i}>
                                                <Typography variant="body2">{c}</Typography>
                                            </StyledListItem>
                                        ))}
                                    </StyledList>
                                </FieldContainer>
                            );
                        }
                        // Esperado
                        if (key === 'esperado') {
                            return (
                                <FieldContainer key={key} sx={{ mb: 2 }}>
                                    <SubtituloChip label={fieldLabels[key] || key} icon={<VisibilityIcon />} />
                                    <AdaptiveValue value={value} />
                                </FieldContainer>
                            );
                        }

                        // Campos padronizados
                        return (
                            <FieldContainer key={key}>
                                <FieldLabel variant="body2">
                                    {fieldLabels[key] || key}
                                </FieldLabel>
                                <ValueContainer>
                                    <Typography variant="body2">
                                        {renderValue(value)}
                                    </Typography>
                                </ValueContainer>
                            </FieldContainer>
                        );
                    })}
                </Box>

                {(parametrosEntry || resumoEntry) && (
                    <Box
                        sx={{
                            flex: isMobile ? 'none' : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            minHeight: 350,
                            maxHeight: 500,
                            height: '100%',
                            maxWidth: isMobile ? '100%' : 450,
                        }}
                    >
                        {/* Container pai para forçar igualdade de altura */}
                        <Box sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,  // Crucial para containers flex aninhados
                            gap: 2
                        }}>
                            {/* Parâmetros da Busca */}
                            {parametrosEntry && (
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: 0
                                }}>
                                    <FieldContainer
                                        sx={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minHeight: 0,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Seu conteúdo existente aqui */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                                            <Chip
                                                label="Parâmetros da Busca"
                                                color="secondary"
                                                icon={
                                                    <DataObjectIcon
                                                        fontSize="medium"
                                                        sx={{
                                                            verticalAlign: 'middle',
                                                            color: theme.palette.secondary.dark
                                                        }}
                                                    />
                                                }
                                                sx={{ fontWeight: 600, mr: 1 }}
                                            />
                                            <Tooltip title="Copiar JSON">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            JSON.stringify(parametrosEntry[1], null, 2)
                                                        );
                                                    }}
                                                >
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        <ValueContainer
                                            sx={{
                                                flex: 1,
                                                minHeight: 0,
                                                overflow: 'auto',
                                                p: 1,
                                                bgcolor: theme => theme.palette.mode === 'light'
                                                    ? theme.palette.grey[100]
                                                    : theme.palette.grey[900],
                                                borderRadius: '8px',
                                            }}
                                        >
                                            {renderValue(parametrosEntry[1])}
                                        </ValueContainer>
                                    </FieldContainer>
                                </Box>
                            )}

                            {/* Preview */}
                            {resumoEntry && (
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: 0,
                                    width: '100%',
                                    maxWidth: 620,
                                }}>
                                    <FieldContainer
                                        sx={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minHeight: 0,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Seu conteúdo existente aqui */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                                            <Chip
                                                label={fieldLabels['resumoResultado']}
                                                color="secondary"
                                                icon={
                                                    <DataObjectIcon
                                                        fontSize="medium"
                                                        sx={{
                                                            verticalAlign: 'middle',
                                                            color: theme.palette.secondary.dark
                                                        }}
                                                    />
                                                }
                                                sx={{ fontWeight: 600, mr: 1 }}
                                            />
                                            <Tooltip title="Copiar JSON">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            JSON.stringify(resumoEntry[1], null, 2)
                                                        );
                                                    }}
                                                >
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        <ValueContainer
                                            sx={{
                                                flex: 1,
                                                maxHeight: '215px',
                                                overflow: 'auto',
                                                p: 1,
                                                bgcolor: theme => theme.palette.mode === 'light'
                                                    ? theme.palette.grey[100]
                                                    : theme.palette.grey[900],
                                                borderRadius: '8px',
                                            }}
                                        >
                                            {renderValue(resumoEntry[1])}
                                        </ValueContainer>
                                    </FieldContainer>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </StyledPaper>
    );
}
