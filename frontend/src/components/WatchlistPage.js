import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';

export default function WatchlistPage() {
  const [symbol, setSymbol] = useState('');
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => { fetchWatchlist(); }, []);

  const fetchWatchlist = async () => {
    const res = await axios.get('http://localhost:8000/watchlist/');
    const uniqueWatchlist = (res.data.watchlist || []).filter(
      (v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i
    );
    setWatchlist(uniqueWatchlist);
  };

  const addWatchlist = async () => {
    await axios.post('http://localhost:8000/watchlist/', { symbol });
    fetchWatchlist();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Watchlist</Typography>
      <TextField label="Symbol" value={symbol} onChange={e => setSymbol(e.target.value)} sx={{mr:1}}/>
      <Button variant="contained" onClick={addWatchlist}>Add</Button>

      <Table sx={{mt:3}}>
        <TableHead>
          <TableRow>
            <TableCell>Symbol</TableCell>
            <TableCell>Current Price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {watchlist.map((w, i) => (
            <TableRow key={i}>
              <TableCell>{w.symbol}</TableCell>
              <TableCell>{w.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}
