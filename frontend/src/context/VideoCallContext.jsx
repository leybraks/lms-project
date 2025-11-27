import React, { createContext, useState, useContext } from 'react';

const VideoCallContext = createContext(null);

export const VideoCallProvider = ({ children }) => {
  const [callState, setCallState] = useState({
    isOpen: false,
    isMinimized: false,
    roomName: null,
  });

  const startCall = (roomName) => {
    setCallState({ isOpen: true, isMinimized: false, roomName });
  };

  const endCall = () => {
    setCallState({ isOpen: false, isMinimized: false, roomName: null });
  };

  const toggleMinimize = () => {
    setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  return (
    <VideoCallContext.Provider value={{ callState, startCall, endCall, toggleMinimize }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => useContext(VideoCallContext);