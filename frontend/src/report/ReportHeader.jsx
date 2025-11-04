// src/report/ReportHeader.jsx
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { AssessmentOutlined } from '@mui/icons-material';

export default function ReportHeader({
  title,
  generatedAt,
  Icon = AssessmentOutlined, // Ícone padrão
}) {
  const theme = useTheme();

  return (
    <Box sx={{
      mb: 1,
      '& > *': { mb: 2 },
    }}>
      {/* Título com divisor sutil */}
      <Box sx={{
        pb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        mb: 4,
      }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: {
              xs: '1.65rem',
              sm: '2.5rem',
              md: '3rem',
            },
          }}
        >
          {/* Renderiza o ícone passado por prop */}
          <Icon fontSize="20px" sx={{ opacity: 0.65 }} />
          {title}
        </Typography>
      </Box>

      {/* Descrição */}
      <Typography variant="body1" sx={{
        lineHeight: 1.7,
        maxWidth: '100%',
        mb: 1,
      }}>
        Este relatório foi gerado automaticamente pelo sistema de testes automatizados <b>Jest</b>, garantindo rastreabilidade, reprodutibilidade e transparência dos resultados.
      </Typography>

      {/* Data de geração */}
      {generatedAt && (
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
        }}>
          <Typography variant="overline" sx={{
            fontWeight: 500,
            letterSpacing: '0.5px',
            lineHeight: 1.5,
            opacity: 0.8,
          }}>
            Gerado em:
          </Typography>
          <Typography variant="body2" sx={{
            fontFamily: 'monospace',
            letterSpacing: '0.3px',
          }}>
            {new Date(generatedAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }).replace('.', '')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
