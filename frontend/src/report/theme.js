// report/theme.js
import { createTheme } from '@mui/material/styles';

export function getLightTheme() {
    const theme = createTheme({
        palette: {
            mode: 'light',
            primary: { main: '#1976d2' },
            background: { default: '#f3e6e6e2', paper: '#fff' },
            text: { primary: '#181a1b' }, // preto para textos
        },
    });
    return theme;
}

export function getDarkTheme() {
    const theme = createTheme({
        palette: {
            mode: 'dark',
            primary: { main: '#90caf9' },
            background: { default: '#181a1b', paper: '#23272b' },
            text: { primary: '#f9e7e7ff' }, // branco para textos
        },
    });
    return theme;
}