/**
 * Utility functions for local storage operations
 */

/**
 * User profile interface
 */
interface UserProfile {
  name?: string;
  email?: string;
  jobTitle?: string;
  experience?: string;
  skills?: string[];
  education?: string;
  about?: string;
}

/**
 * CV analysis interface
 */
interface CVAnalysis {
  name?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  jobTitles?: string[];
  summary?: string;
}

/**
 * Save profile data to local storage
 * @param profile - User profile data
 */
export const saveProfileToStorage = (profile: UserProfile): void => {
  localStorage.setItem('userProfile', JSON.stringify(profile));
};

/**
 * Get profile data from local storage
 * @returns User profile data or null if not found
 */
export const getProfileFromStorage = (): UserProfile | null => {
  const profileData = localStorage.getItem('userProfile');
  return profileData ? JSON.parse(profileData) : null;
};

/**
 * Save CV analysis data to local storage
 * @param analysis - CV analysis data
 */
export const saveCVAnalysisToStorage = (analysis: CVAnalysis): void => {
  localStorage.setItem('cvAnalysis', JSON.stringify(analysis));
};

/**
 * Get CV analysis data from local storage
 * @returns CV analysis data or null if not found
 */
export const getCVAnalysisFromStorage = (): CVAnalysis | null => {
  const analysisData = localStorage.getItem('cvAnalysis');
  return analysisData ? JSON.parse(analysisData) : null;
};

/**
 * Check if CV data is available in any storage location
 * @returns Boolean indicating if CV data is available
 */
export const hasCVDataAvailable = (): boolean => {
  // Check the standard CV analysis storage
  const cvAnalysis = getCVAnalysisFromStorage();
  if (cvAnalysis) return true;

  // Check the parsed-profile storage
  try {
    const parsedProfile = localStorage.getItem('parsed-profile');
    if (parsedProfile) {
      const profile = JSON.parse(parsedProfile);
      if (profile && profile.uploaded) return true;
    }
  } catch (error) {
    console.error('Error checking parsed-profile:', error);
  }

  // Check the cv-analysis storage
  try {
    const cvAnalysisAlt = localStorage.getItem('cv-analysis');
    if (cvAnalysisAlt) return true;
  } catch (error) {
    console.error('Error checking cv-analysis:', error);
  }

  return false;
};

/**
 * Clear profile data from local storage
 */
export const clearProfileFromStorage = (): void => {
  localStorage.removeItem('userProfile');
};

/**
 * Clear CV analysis data from local storage
 */
export const clearCVAnalysisFromStorage = (): void => {
  localStorage.removeItem('cvAnalysis');
};
