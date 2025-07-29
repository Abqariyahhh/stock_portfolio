import React, { useState, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Switch,
  Box,
  createTheme,
  ThemeProvider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import Dashboard from './components/Dashboard';
import AlertsPage from './components/AlertsPage';
import WatchlistPage from './components/WatchlistPage';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: { main: '#1976d2' }
        }
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
        <AppBar position="static">
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Stock Alert System
            </Typography>
            <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
          </Toolbar>
        </AppBar>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 250 }} role="presentation">
            <List>
              <ListItem button component={Link} to="/" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Dashboard" />
              </ListItem>
              <ListItem button component={Link} to="/alerts" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Alerts" />
              </ListItem>
              <ListItem button component={Link} to="/watchlist" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Watchlist" />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
        </Routes>
      
    </ThemeProvider>
  );
}
