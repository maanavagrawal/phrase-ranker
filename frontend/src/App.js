import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Navigation from './components/Navigation';
import PhraseComparison from './components/PhraseComparison';
import PhraseSubmission from './components/PhraseSubmission';
import Rankings from './components/Rankings';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<PhraseComparison />} />
            <Route path="/submit" element={<PhraseSubmission />} />
            <Route path="/rankings" element={<Rankings />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
