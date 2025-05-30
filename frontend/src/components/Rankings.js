import React, { useState, useEffect } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Container,
    CircularProgress,
} from '@mui/material';
import axios from 'axios';

const Rankings = () => {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRankings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/phrases/ranked`);
            setRankings(response.data);
            setError(null);
        } catch (err) {
            setError('Error fetching rankings. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRankings();
        // Refresh rankings every 30 seconds
        const interval = setInterval(fetchRankings, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Phrase Rankings
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Rank</TableCell>
                                <TableCell>Phrase</TableCell>
                                <TableCell align="right">ELO Rating</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rankings.map((phrase, index) => (
                                <TableRow key={phrase.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{phrase.text}</TableCell>
                                    <TableCell align="right">
                                        {Math.round(phrase.elo_rating)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Container>
    );
};

export default Rankings; 