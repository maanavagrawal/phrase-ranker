import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navigation = () => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Phrase Ranker
                </Typography>
                <Box>
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/"
                        sx={{ mx: 1 }}
                    >
                        Compare
                    </Button>
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/submit"
                        sx={{ mx: 1 }}
                    >
                        Submit
                    </Button>
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/rankings"
                        sx={{ mx: 1 }}
                    >
                        Rankings
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navigation; 