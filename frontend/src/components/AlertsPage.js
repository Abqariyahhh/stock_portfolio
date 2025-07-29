import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';

export default function AlertsPage() {
  const [symbol, setSymbol] = useState('');
  const [threshold, setThreshold] = useState('');
  const [email, setEmail] = useState('');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    const res = await axios.get('http://localhost:8000/check_alerts');
    const uniqueAlerts = (res.data.triggered_alerts || []).filter(
      (v, i, a) => a.findIndex(t => t.symbol === v.symbol && t.email === v.email) === i
    );
    setAlerts(uniqueAlerts);
  };

  const addAlert = async () => {
    await axios.post('http://localhost:8000/alerts/', { 
      symbol, 
      threshold: parseFloat(threshold), 
      email 
    });
    fetchAlerts();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Manage Alerts</Typography>
      <TextField label="Symbol" value={symbol} onChange={e => setSymbol(e.target.value)} sx={{mr:1}}/>
      <TextField label="Threshold" type="number" value={threshold} onChange={e => setThreshold(e.target.value)} sx={{mr:1}}/>
      <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} sx={{mr:1}}/>
      <Button variant="contained" onClick={addAlert}>Add Alert</Button>

      <Table sx={{mt:3}}>
        <TableHead>
          <TableRow>
            <TableCell>Symbol</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Email</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alerts.map((a, i) => (
            <TableRow key={i}>
              <TableCell>{a.symbol}</TableCell>
              <TableCell>{a.price}</TableCell>
              <TableCell>{a.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}
