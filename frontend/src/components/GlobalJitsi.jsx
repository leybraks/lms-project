import React from 'react';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useVideoCall } from '../context/VideoCallContext';
import { useAuth } from '../context/AuthContext'; // Para el nombre del usuario
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

const GlobalJitsi = () => {
  const { callState, endCall, toggleMinimize } = useVideoCall();
  const { user } = useAuth();

  if (!callState.isOpen) return null;

  // Estilos dinámicos: ¿Pantalla completa (dentro del layout) o cajita flotante?
  const containerStyles = callState.isMinimized
    ? {
        // ESTILO MINIMIZADO (Esquina inferior derecha)
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 320,
        height: 180,
        zIndex: 9999,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '2px solid #primary.main'
      }
    : {
        // ESTILO MAXIMIZADO (Modal o Overlay completo)
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        bgcolor: 'black'
      };

  return (
    <Paper sx={containerStyles} elevation={10}>
      {/* BARRA DE CONTROL SUPERIOR */}
      <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 10, 
          p: 1, 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1
      }}>
         <IconButton size="small" onClick={toggleMinimize} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}>
            {callState.isMinimized ? <OpenInFullIcon fontSize="small" /> : <KeyboardArrowDownIcon />}
         </IconButton>
         <IconButton size="small" onClick={endCall} sx={{ color: 'white', bgcolor: 'red' }}>
            <CloseIcon fontSize="small" />
         </IconButton>
      </Box>

      <JitsiMeeting
        roomName={callState.roomName}
        userInfo={{ displayName: user?.username || 'Usuario' }}
        getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            // Aquí pegamos tu inyección CSS para ocultar logos
            const injectCSS = () => {
                try {
                  const iframeDoc = iframeRef.contentWindow?.document;
                  if (!iframeDoc || !iframeDoc.head) return false;
                  const style = iframeDoc.createElement("style");
                  style.innerHTML = `.watermark, .jitsi-logo { display: none !important; }`; // (Tu CSS completo aquí)
                  iframeDoc.head.appendChild(style);
                  return true;
                } catch (e) { return false; }
            };
            setTimeout(injectCSS, 2000); // Intento simple
        }}
        configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            disableThirdPartyRequests: true,
            toolbarButtons: callState.isMinimized 
                ? ['microphone', 'camera', 'hangup'] // Menos botones si es pequeño
                : ['microphone', 'camera', 'desktop', 'raisehand', 'chat', 'tileview', 'hangup']
        }}
        interfaceConfigOverwrite={{
            TOOLBAR_ALWAYS_VISIBLE: true,
            SHOW_JITSI_WATERMARK: false,
        }}
      />
    </Paper>
  );
};

export default GlobalJitsi;