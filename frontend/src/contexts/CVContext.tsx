import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { saveCVAnalysis, getCVAnalysis } from '../utils/indexedDB';

// Define the CV data type
export interface CVData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  education?: any[];
  experience?: any[];
  summary?: string;
  target_job?: string;
  section_scores?: Record<string, number>;
  ats_report?: any;
  uploaded?: boolean;
  complex_format_detected?: boolean;
  lastUpdated?: string;
  [key: string]: any; // Allow for additional properties
}

// Define the context type
interface CVContextType {
  cvData: CVData | null;
  setCVData: (data: CVData | null) => void;
  clearCVData: () => void;
  isCVLoaded: boolean;
  isCVLoading: boolean;
}

// Create the context with default values
const CVContext = createContext<CVContextType>({
  cvData: null,
  setCVData: () => {},
  clearCVData: () => {},
  isCVLoaded: false,
  isCVLoading: true
});

// Hook to use the CV context
export const useCVContext = () => useContext(CVContext);

// Provider component
export const CVProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cvData, setCVData] = useState<CVData | null>(null);
  const [isCVLoaded, setIsCVLoaded] = useState(false);
  const [isCVLoading, setIsCVLoading] = useState(true);

  // Load CV data from storage when the component mounts
  useEffect(() => {
    const loadCVData = async () => {
      try {
        setIsCVLoading(true);
        
        // Try to get CV data from IndexedDB
        const data = await getCVAnalysis();
        
        if (data) {
          console.log('CV data loaded from IndexedDB:', data);
          setCVData(data);
          setIsCVLoaded(true);
        } else {
          // If not in IndexedDB, try localStorage directly
          try {
            const storedCV = localStorage.getItem('cv-analysis');
            if (storedCV) {
              const parsedCV = JSON.parse(storedCV);
              console.log('CV data loaded from localStorage:', parsedCV);
              setCVData(parsedCV);
              setIsCVLoaded(true);
              
              // Save to IndexedDB for next time
              await saveCVAnalysis(parsedCV);
            } else {
              // Try parsed-profile as a last resort
              const parsedProfile = localStorage.getItem('parsed-profile');
              if (parsedProfile) {
                const profile = JSON.parse(parsedProfile);
                if (profile && profile.uploaded) {
                  console.log('CV data loaded from parsed-profile:', profile);
                  setCVData(profile);
                  setIsCVLoaded(true);
                  
                  // Save to IndexedDB for next time
                  await saveCVAnalysis(profile);
                } else {
                  setIsCVLoaded(false);
                }
              } else {
                setIsCVLoaded(false);
              }
            }
          } catch (error) {
            console.error('Error loading CV data from localStorage:', error);
            setIsCVLoaded(false);
          }
        }
      } catch (error) {
        console.error('Error loading CV data:', error);
        setIsCVLoaded(false);
      } finally {
        setIsCVLoading(false);
      }
    };

    loadCVData();
  }, []);

  // Save CV data to storage whenever it changes
  useEffect(() => {
    if (cvData) {
      const saveCVDataToStorage = async () => {
        try {
          await saveCVAnalysis(cvData);
          console.log('CV data saved to IndexedDB');
        } catch (error) {
          console.error('Error saving CV data to IndexedDB:', error);
          
          // Fallback to localStorage
          try {
            localStorage.setItem('cv-analysis', JSON.stringify(cvData));
            console.log('CV data saved to localStorage');
          } catch (localStorageError) {
            console.error('Error saving CV data to localStorage:', localStorageError);
          }
        }
      };

      saveCVDataToStorage();
    }
  }, [cvData]);

  // Function to update CV data
  const updateCVData = (data: CVData | null) => {
    setCVData(data);
    setIsCVLoaded(!!data);
  };

  // Function to clear CV data
  const clearCVData = async () => {
    setCVData(null);
    setIsCVLoaded(false);
    
    try {
      // Clear from IndexedDB
      await saveCVAnalysis(null);
      
      // Clear from localStorage
      localStorage.removeItem('cv-analysis');
      
      // Update parsed-profile to remove uploaded flag
      try {
        const parsedProfile = localStorage.getItem('parsed-profile');
        if (parsedProfile) {
          const profile = JSON.parse(parsedProfile);
          profile.uploaded = false;
          localStorage.setItem('parsed-profile', JSON.stringify(profile));
        }
      } catch (error) {
        console.error('Error updating parsed-profile:', error);
      }
      
      console.log('CV data cleared from all storage');
    } catch (error) {
      console.error('Error clearing CV data:', error);
    }
  };

  return (
    <CVContext.Provider
      value={{
        cvData,
        setCVData: updateCVData,
        clearCVData,
        isCVLoaded,
        isCVLoading
      }}
    >
      {children}
    </CVContext.Provider>
  );
};

export default CVContext;
