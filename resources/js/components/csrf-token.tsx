import React, { createContext, useContext, ReactNode } from 'react';

// Create a context for the CSRF token
const CsrfTokenContext = createContext<string>('');

// Provider component that will wrap our app
export const CsrfTokenProvider: React.FC<{ token: string; children: ReactNode }> = ({ token, children }) => {
  return (
    <CsrfTokenContext.Provider value={token}>
      {children}
    </CsrfTokenContext.Provider>
  );
};

// Hook to use the CSRF token
export const useCsrfToken = () => {
  return useContext(CsrfTokenContext);
};
