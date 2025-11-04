// src/report/Navbar.jsx
import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    IconButton,
    Switch,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link as RouterLink } from 'react-router-dom';

void React, AppBar, Toolbar, Typography, Box, Button, IconButton, Switch, useTheme, useMediaQuery, Menu, MenuItem, MenuIcon, Brightness4Icon, Brightness7Icon;

export default function Navbar({ darkMode, onToggleDarkMode }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [anchorEl, setAnchorEl] = useState(null);

    const links = [
        { label: 'Home', href: '/relatorio-testes/' },
        { label: 'Resumo', href: '/relatorio-testes/resumo' },
        { label: 'Cenários', href: '/relatorio-testes/detalhes' },
        { label: 'Estatísticas', href: '/relatorio-testes/estatisticas' },
    ];

    return (
        <AppBar
            position="sticky"
            elevation={2}
            sx={{ bgcolor: 'background.paper', color: 'text.primary', top: 0, zIndex: 1100 }}
        >
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Relatório
                </Typography>

                {isMobile ? (
                    <>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={e => setAnchorEl(e.currentTarget)}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                        >
                            {links.map((link, idx) => (
                                <MenuItem
                                    key={`${link.href}-${idx}`}
                                    component="a"
                                    href={link.href}
                                    onClick={() => setAnchorEl(null)}
                                >
                                    {link.label}
                                </MenuItem>
                            ))}
                            <MenuItem>
                                <IconButton
                                    onClick={() => {
                                        onToggleDarkMode();
                                        setAnchorEl(null);
                                    }}
                                    aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
                                    color="inherit"
                                >
                                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                                <Switch
                                    checked={darkMode}
                                    onChange={() => {
                                        onToggleDarkMode();
                                    }}
                                    slotProps={{ input: { 'aria-label': 'Alternar modo escuro' } }}
                                />
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {links.map((link, idx) => (
                            <Button
                                key={`${link.href}-${idx}`}
                                color="inherit"
                                component={RouterLink}
                                to={link.href}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                    '&:after': {
                                        content: '""',
                                        display: 'block',
                                        width: 0,
                                        height: 2,
                                        background: theme => theme.palette.primary.main,
                                        transition: 'width 0.3s',
                                        position: 'absolute',
                                        left: 0,
                                        bottom: 0,
                                    },
                                    '&:hover': {
                                        backgroundColor: 'transparent', // cor de fundo no hover
                                    },
                                    '&:hover:after': {
                                        width: '100%',
                                    }
                                }}
                            >
                                {link.label}
                            </Button>
                        ))}
                        <IconButton
                            onClick={() => {
                                onToggleDarkMode();
                            }}
                            color="inherit"
                            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
                        >
                            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}
