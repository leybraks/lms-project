// frontend/src/pages/HomePage.jsx
import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function HomePage() {
  return (
    <Box sx={{ padding: 4 }}>
      <h1>Hola Mundo - LMS</h1>
      <p>Esto está renderizado desde HomePage.jsx</p>
      
      {/* ¡Tu primer componente de MUI! */}
      <Button variant="contained" color="primary">
        Soy un botón de Material
      </Button>
    </Box>
  );
}

export default HomePage;