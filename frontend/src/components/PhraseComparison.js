import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Container, CircularProgress } from '@mui/material';
import axios from 'axios';

const PhraseComparison = () => {
    console.log('Environment:', {
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        NODE_ENV: process.env.NODE_ENV
    });

    const [phrases, setPhrases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPhrases = async () => {
        try {
            setLoading(true);
            console.log('Fetching phrases from:', `${process.env.REACT_APP_API_URL}/api/phrases/compare`);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/phrases/compare`);
            console.log('API Response:', response.data);
            
            // Ensure response.data is an array
            if (!Array.isArray(response.data)) {
                throw new Error('Invalid response format: expected an array');
            }
            
            setPhrases(response.data);
            setError(null);
        } catch (err) {
            console.error('Error details:', err);
            setError(err.response?.data?.error || err.message || 'Error fetching phrases. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhrases();
    }, []);

    const handleVote = async (winnerId) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/phrases/compare`, {
                phrase1_id: phrases[0].id,
                phrase2_id: phrases[1].id,
                winner_id: winnerId
            });
            fetchPhrases(); // Fetch new phrases after voting
        } catch (err) {
            console.error('Vote error:', err);
            setError(err.response?.data?.error || err.message || 'Error submitting vote. Please try again.');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
                <Typography color="error" gutterBottom>
                    {error}
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={fetchPhrases}
                    sx={{ mt: 2 }}
                >
                    Try Again
                </Button>
            </Box>
        );
    }

    // Ensure phrases is an array and has at least 2 items
    if (!Array.isArray(phrases) || phrases.length < 2) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Typography>
                    {!Array.isArray(phrases) 
                        ? 'Invalid response from server' 
                        : 'Not enough phrases to compare. Add more phrases!'}
                </Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Which one goes harder?
                </Typography>
                <Box display="flex" justifyContent="space-around" flexWrap="wrap" gap={2}>
                    {phrases.map((phrase) => (
                        <Paper
                            key={phrase.id}
                            elevation={3}
                            sx={{
                                p: 3,
                                width: '45%',
                                minWidth: '300px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                },
                            }}
                            onClick={() => handleVote(phrase.id)}
                        >
                            <Typography variant="h6" align="center">
                                {phrase.text}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center">
                                Rating: {Math.round(phrase.elo_rating)}
                            </Typography>
                        </Paper>
                    ))}
                </Box>
            </Box>
        </Container>
    );
};

export default PhraseComparison; 