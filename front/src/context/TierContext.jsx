import React, { createContext, useContext, useState } from 'react';

const TierContext = createContext();

export const TierProvider = ({ children }) => {
  const [tierName, setTierName] = useState('');

  return (
    <TierContext.Provider value={{ tierName, setTierName }}>
      {children}
    </TierContext.Provider>
  );
};

export const useTier = () => {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
};