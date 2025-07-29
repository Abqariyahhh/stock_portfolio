import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF69B4'];

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState({
    total_value: 0,
    total_profit_loss: 0,
    total_return_percent: 0,
    details: []
  });
  const [analytics, setAnalytics] = useState(null);
  const [diversification, setDiversification] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  useEffect(() => {
    fetchPortfolio();
    fetchAnalytics();
  }, []);

  const fetchPortfolio = async () => {
  const res = await axios.get('http://localhost:8000/portfolio/');

  // No need to merge again; backend already gives final positions
  const details = res.data.details;

  const totalValue = details.reduce((acc, d) => acc + d.current_price * d.quantity, 0);
  const totalProfitLoss = details.reduce((acc, d) => acc + d.profit_loss, 0);

  setPortfolio({
    ...res.data,
    total_value: totalValue,
    total_profit_loss: totalProfitLoss,
    details: details
  });

  // diversification
  const diversificationData = details.map((d) => ({
    name: d.symbol,
    value: d.current_price * d.quantity
  }));
  setDiversification(diversificationData);

  // growth chart
  const growth = Array.from({ length: 5 }, (_, i) => ({
    date: `Day ${i + 1}`,
    value: totalValue * (1 + (Math.random() - 0.5) / 20)
  }));
  setGrowthData(growth);
};


  const fetchAnalytics = async () => {
    const res = await axios.get('http://localhost:8000/portfolio/analytics');
    setAnalytics(res.data);
  };

  const addStock = async () => {
    await axios.post('http://localhost:8000/portfolio/', {
      symbol,
      quantity: parseFloat(quantity),
      buy_price: parseFloat(buyPrice)
    });
    setSymbol('');
    setQuantity('');
    setBuyPrice('');
    fetchPortfolio();
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        Portfolio Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Value</Typography>
              <Typography variant="h5">${portfolio.total_value.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Profit / Loss</Typography>
              <Typography
                variant="h5"
                sx={{ color: portfolio.total_profit_loss >= 0 ? 'green' : 'red' }}
              >
                ${portfolio.total_profit_loss.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {analytics && (
  <>
    <Grid item xs={12} sm={4}>
      <Card>
        <CardContent>
          <Typography variant="h6">Top Gainer</Typography>
          <Typography>{analytics.top_gainer?.[0] || '-'}</Typography>
          <Typography sx={{ color: 'green' }}>
            ${analytics.top_gainer?.[1]?.toFixed(2) || 0}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Card>
        <CardContent>
          <Typography variant="h6">Top Loser</Typography>
          <Typography>{analytics.top_loser?.[0] || '-'}</Typography>
          <Typography sx={{ color: 'red' }}>
            ${analytics.top_loser?.[1]?.toFixed(2) || 0}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  </>
)}
    
      </Grid>

      {/* Add Stock Form */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6">Add Stock</Typography>
        <Divider sx={{ my: 1 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Buy Price"
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button variant="contained" onClick={addStock}>
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Portfolio Holdings
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Buy Price</TableCell>
              <TableCell>Current Price</TableCell>
              <TableCell>Profit / Loss</TableCell>
              <TableCell>Returns (%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {portfolio.details.map((stock, idx) => (
              <TableRow key={stock.symbol}>
                <TableCell>{stock.symbol}</TableCell>
                <TableCell>{stock.quantity}</TableCell>
                <TableCell>${stock.buy_price.toFixed(2)}</TableCell>
                <TableCell>${stock.current_price.toFixed(2)}</TableCell>
                <TableCell
                  style={{ color: stock.profit_loss >= 0 ? 'green' : 'red' }}
                >
                  ${stock.profit_loss.toFixed(2)}
                </TableCell>
                <TableCell>{stock.returns.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Charts */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Portfolio Diversification</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={diversification} dataKey="value" nameKey="name" outerRadius={100} label>
                  {diversification.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Portfolio Value Growth (5 Days)</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
