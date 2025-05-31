import { saveProfile, getProfile, getCVAnalysis, addToSyncQueue } from './indexedDB';
import { UserProfile, CVAnalysis, Education, Experience } from '../types/profileTypes';

/**
 * Get profile data from storage with fallback mechanisms
 * @returns The user profile or null if not found
 */
export async function getProfileFromStorage(): Promise<UserProfile | null> {
  try {
    // Try to get from IndexedDB (which has its own fallbacks)
    const profile = await getProfile();
    if (profile) return profile;

    // If IndexedDB fails, try localStorage directly
    const stored = localStorage.getItem('parsed-profile');
    if (stored) {
      const parsedProfile = JSON.parse(stored);
      // Save to IndexedDB for future use
      saveProfile(parsedProfile).catch(console.error);
      return parsedProfile;
    }

    // Try to get CV analysis as a last resort
    const cvAnalysis = await getCVAnalysis();
    if (cvAnalysis) {
      // Create a minimal profile from CV data
      const minimalProfile = {
        name: cvAnalysis.name || 'User',
        email: cvAnalysis.email || '',
        skills: cvAnalysis.skills || [],
        uploaded: true,
        lastUpdated: new Date().toISOString()
      };
      // Save this minimal profile for future use
      saveProfile(minimalProfile).catch(console.error);
      return minimalProfile;
    }

    return null;
  } catch (e) {
    console.error('Error getting profile from storage:', e);

    // Last resort: try localStorage directly
    try {
      const stored = localStorage.getItem('parsed-profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Synchronous version of getProfileFromStorage for components that can't use async
 * @returns The user profile or null if not found
 */
export function getProfileFromStorageSync(): UserProfile | null {
  try {
    // Try localStorage first
    const stored = localStorage.getItem('parsed-profile');
    if (stored) {
      return JSON.parse(stored);
    }

    // Try sessionStorage as fallback
    const sessionStored = sessionStorage.getItem('parsed-profile');
    if (sessionStored) {
      return JSON.parse(sessionStored);
    }

    // Try to get CV analysis as a last resort
    const cvAnalysis = localStorage.getItem('cv-analysis');
    if (cvAnalysis) {
      const parsedCV = JSON.parse(cvAnalysis);
      // Create a minimal profile from CV data
      return {
        name: parsedCV.name || 'User',
        email: parsedCV.email || '',
        skills: parsedCV.skills || [],
        uploaded: true
      };
    }

    return null;
  } catch (e) {
    console.error('Error parsing profile from storage:', e);
    return null;
  }
}

/**
 * Save profile data to all available storage mechanisms
 * @param profile The profile data to save
 */
export function setProfileToStorage(profile: UserProfile): void {
  if (!profile) return;

  try {
    // Add timestamp for sync purposes
    const profileWithTimestamp = {
      ...profile,
      lastUpdated: new Date().toISOString()
    };

    // Save to IndexedDB (which handles localStorage too)
    saveProfile(profileWithTimestamp).catch(console.error);

    // Also save to sessionStorage for redundancy
    const profileString = JSON.stringify(profileWithTimestamp);
    sessionStorage.setItem('parsed-profile', profileString);

    // Try to save to server if online
    if (navigator.onLine) {
      fetch('/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profile: profileWithTimestamp })
      }).catch(() => {
        // If server save fails, add to sync queue for later
        addToSyncQueue('saveProfile', { profile: profileWithTimestamp }).catch(console.error);
      });
    } else {
      // If offline, add to sync queue for later
      addToSyncQueue('saveProfile', { profile: profileWithTimestamp }).catch(console.error);
    }
  } catch (e) {
    console.error('Error saving profile to storage:', e);

    // Last resort: try localStorage directly
    try {
      localStorage.setItem('parsed-profile', JSON.stringify(profile));
    } catch {
      // If all else fails, log the error but don't crash
      console.error('Failed to save profile to any storage mechanism');
    }
  }
}

export function getCVAnalysisFromStorage(): CVAnalysis | null {
  try {
    const stored = localStorage.getItem('cv-analysis');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setCVAnalysisToStorage(cv: CVAnalysis): void {
  try {
    localStorage.setItem('cv-analysis', JSON.stringify(cv));
  } catch {}
}

/**
 * Format education data for display
 * @param education Education data in various formats
 * @returns Formatted string representation
 */
export function formatEducation(education: string | Education | Education[] | undefined): string {
  if (!education) return '';

  if (typeof education === 'string') return education;

  if (Array.isArray(education)) {
    return education.map(edu =>
      `${edu.institution || ''} - ${edu.degree || ''} ${edu.dates || ''}`
    ).join('\n');
  }

  // Single education object
  return `${education.institution || ''} - ${education.degree || ''} ${education.dates || ''}`;
}

/**
 * Format experience data for display
 * @param experience Experience data in various formats
 * @returns Formatted string representation
 */
export function formatExperience(experience: string | Experience | Experience[] | undefined): string {
  if (!experience) return '';

  if (typeof experience === 'string') return experience;

  if (Array.isArray(experience)) {
    return experience.map(exp =>
      `${exp.company || ''} - ${exp.title || ''} ${exp.dates || ''}`
    ).join('\n');
  }

  // Single experience object
  return `${experience.company || ''} - ${experience.title || ''} ${experience.dates || ''}`;
}
