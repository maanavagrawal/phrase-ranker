import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Alert } from '@mui/material';
import axios from 'axios';

const PhraseSubmission = () => {
    const [phrase, setPhrase] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!phrase.trim()) {
            setStatus({ type: 'error', message: 'Please enter a phrase' });
            return;
        }

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/phrases`, { text: phrase });
            setPhrase('');
            setStatus({ type: 'success', message: 'Phrase submitted successfully!' });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (err) {
            setStatus({ type: 'error', message: 'Error submitting phrase. Please try again.' });
            console.error('Error:', err);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Submit a New Phrase
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Enter your phrase"
                            variant="outlined"
                            value={phrase}
                            onChange={(e) => setPhrase(e.target.value)}
                            placeholder="Type your phrase here..."
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                        >
                            Submit Phrase
                        </Button>
                    </Box>
                </form>
                {status.message && (
                    <Alert severity={status.type} sx={{ mt: 2 }}>
                        {status.message}
                    </Alert>
                )}
            </Box>
        </Container>
    );
};

export default PhraseSubmission; 