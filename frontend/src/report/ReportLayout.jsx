import React, { useEffect, useState, useMemo } from 'react';
import Navbar from './Navbar';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
void React, Navbar, ThemeProvider, CssBaseline, Box
import { getLightTheme, getDarkTheme } from './theme';
import './styles.css';

export default function ReportLayout({ children }) {
    // Estado para o modo escuro
    // Inicia com o valor do localStorage ou padrão (false)
    const [darkMode, setDarkMode] = useState(() => {
        // Lê do localStorage na primeira montagem
        return localStorage.getItem('darkMode') === 'true';
    });

    useEffect(() => {
        // Salva no localStorage sempre que mudar
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const theme = useMemo(() => (darkMode ? getDarkTheme() : getLightTheme()), [darkMode]);
    // console.log('ReportLayout.jsx - theme.palette.mode:', theme.palette.mode);

    const handleToggleDarkMode = () => setDarkMode(m => !m);
    // console.log('ReportLayout darkMode:', darkMode);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={`container-ReportLayout${darkMode ? ' dark-mode' : ''}`}>
                <Navbar darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />
                <Box sx={{
                    width: '100%',
                    maxWidth: { xs: '95%', sm: 700, md: 900, lg: '70%' },
                    mx: 'auto',
                    my: { xs: 3, sm: 5, md: 6 },
                    p: { xs: 1.5, sm: 2.5, md: 3, lg: 4 },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: { xs: 0, sm: 2, md: 3 },
                    border: { xs: '1px solid', sm: 'none' },
                    borderColor: 'divider'
                }}>
                    {React.Children.map(children, child =>
                        React.isValidElement(child)
                            ? React.cloneElement(child, { theme })
                            : child
                    )}
                </Box>
            </div>
        </ThemeProvider>
    );
}