import React, { createContext, useContext } from 'react';

// Simplified campus context laging Dapitan Main Campus
const CAMPUS_NAME = 'Dapitan Main Campus';

interface CampusContextType {
  currentCampus: string;
  campusName: string;
  setCampus: (c: string) => void;
}

const CampusContext = createContext<CampusContextType>({
  currentCampus: CAMPUS_NAME,
  campusName: CAMPUS_NAME,
  setCampus: () => {},
});

export const CampusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <CampusContext.Provider value={{ 
      currentCampus: CAMPUS_NAME, 
      campusName: CAMPUS_NAME,
      setCampus: () => {} 
    }}>
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => useContext(CampusContext);
export const useCampusContext = useCampus;
export default CampusContext;