/**
 * IndexedDB utility for offline data storage
 */

// Database configuration
const DB_NAME = 'InterviewCoachDB';
const DB_VERSION = 1;
const STORES = {
  PROFILES: 'profiles',
  CV_ANALYSIS: 'cvAnalysis',
  CHAT_MESSAGES: 'chatMessages',
  INTERVIEW_SESSIONS: 'interviewSessions',
  SYNC_QUEUE: 'syncQueue'
};

// Open database connection
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject(new Error('Could not open IndexedDB'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PROFILES)) {
        db.createObjectStore(STORES.PROFILES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.CV_ANALYSIS)) {
        db.createObjectStore(STORES.CV_ANALYSIS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.CHAT_MESSAGES)) {
        const chatStore = db.createObjectStore(STORES.CHAT_MESSAGES, {
          keyPath: 'id',
          autoIncrement: true
        });
        chatStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.INTERVIEW_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.INTERVIEW_SESSIONS, {
          keyPath: 'id'
        });
        sessionStore.createIndex('startTime', 'startTime', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true
        });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Generic function to add an item to a store
export const addItem = async <T>(storeName: string, item: T): Promise<IDBValidKey> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error(`Error adding item to ${storeName}:`, event);
      reject(new Error(`Failed to add item to ${storeName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to get an item from a store
export const getItem = async <T>(storeName: string, key: IDBValidKey): Promise<T | null> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (event) => {
      console.error(`Error getting item from ${storeName}:`, event);
      reject(new Error(`Failed to get item from ${storeName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to update an item in a store
export const updateItem = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error(`Error updating item in ${storeName}:`, event);
      reject(new Error(`Failed to update item in ${storeName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to delete an item from a store
export const deleteItem = async (storeName: string, key: IDBValidKey): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error(`Error deleting item from ${storeName}:`, event);
      reject(new Error(`Failed to delete item from ${storeName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to get all items from a store
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error(`Error getting all items from ${storeName}:`, event);
      reject(new Error(`Failed to get all items from ${storeName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Function to clear a store
export const clearStore = async (storeName: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error(`Error clearing store ${storeName}:`, event);
      reject(new Error(`Failed to clear store ${storeName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Specific functions for profile data
export const saveProfile = async (profile: any): Promise<void> => {
  // Always use 'current' as the ID for the current profile
  const profileWithId = { ...profile, id: 'current' };
  await updateItem(STORES.PROFILES, profileWithId);

  // Also save to localStorage for backward compatibility
  try {
    localStorage.setItem('parsed-profile', JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save profile to localStorage:', e);
  }
};

export const getProfile = async (): Promise<any | null> => {
  try {
    // Try IndexedDB first
    const profile = await getItem(STORES.PROFILES, 'current');
    if (profile) return profile;

    // Fall back to localStorage
    const storedProfile = localStorage.getItem('parsed-profile');
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      // Save to IndexedDB for next time
      await saveProfile(parsedProfile);
      return parsedProfile;
    }

    return null;
  } catch (e) {
    console.error('Error getting profile:', e);

    // Last resort: try localStorage directly
    try {
      const storedProfile = localStorage.getItem('parsed-profile');
      return storedProfile ? JSON.parse(storedProfile) : null;
    } catch {
      return null;
    }
  }
};

// Specific functions for CV analysis data
export const saveCVAnalysis = async (cvAnalysis: any): Promise<void> => {
  const cvWithId = { ...cvAnalysis, id: 'current' };
  await updateItem(STORES.CV_ANALYSIS, cvWithId);

  // Also save to localStorage for backward compatibility
  try {
    localStorage.setItem('cv-analysis', JSON.stringify(cvAnalysis));
  } catch (e) {
    console.warn('Failed to save CV analysis to localStorage:', e);
  }
};

export const getCVAnalysis = async (): Promise<any | null> => {
  try {
    // Try IndexedDB first
    const cvAnalysis = await getItem(STORES.CV_ANALYSIS, 'current');
    if (cvAnalysis) return cvAnalysis;

    // Fall back to localStorage
    const storedCV = localStorage.getItem('cv-analysis');
    if (storedCV) {
      const parsedCV = JSON.parse(storedCV);
      // Save to IndexedDB for next time
      await saveCVAnalysis(parsedCV);
      return parsedCV;
    }

    return null;
  } catch (e) {
    console.error('Error getting CV analysis:', e);

    // Last resort: try localStorage directly
    try {
      const storedCV = localStorage.getItem('cv-analysis');
      return storedCV ? JSON.parse(storedCV) : null;
    } catch {
      return null;
    }
  }
};

// Sync queue item interface
interface SyncQueueItem {
  id?: number;
  action: string;
  data: any;
  timestamp: string;
  attempts: number;
}

// Add an item to the sync queue for later processing when online
export const addToSyncQueue = async (action: string, data: any): Promise<void> => {
  const syncItem: SyncQueueItem = {
    action,
    data,
    timestamp: new Date().toISOString(),
    attempts: 0
  };

  await addItem(STORES.SYNC_QUEUE, syncItem);
};

// Process the sync queue when online
export const processSyncQueue = async (): Promise<void> => {
  if (!navigator.onLine) return;

  const syncItems = await getAllItems<SyncQueueItem>(STORES.SYNC_QUEUE);

  for (const item of syncItems) {
    try {
      // Process based on action type
      switch (item.action) {
        case 'saveProfile':
          await fetch('/save-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(item.data)
          });
          break;

        case 'saveMessage':
          await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(item.data)
          });
          break;

        // Add more cases as needed
      }

      // If successful, remove from queue
      if (item.id !== undefined) {
        await deleteItem(STORES.SYNC_QUEUE, item.id);
      }

    } catch (e) {
      console.error('Error processing sync item:', e);

      // Create a mutable copy of the item
      const updatedItem: SyncQueueItem = { ...item, attempts: item.attempts + 1 };

      // If too many attempts, remove from queue
      if (updatedItem.attempts >= 5) {
        if (updatedItem.id !== undefined) {
          await deleteItem(STORES.SYNC_QUEUE, updatedItem.id);
        }
      } else {
        await updateItem(STORES.SYNC_QUEUE, updatedItem);
      }
    }
  }
};

// Set up sync queue processing when online
export const initSyncQueue = (): void => {
  window.addEventListener('online', () => {
    processSyncQueue().catch(console.error);
  });

  // Also process on startup if online
  if (navigator.onLine) {
    processSyncQueue().catch(console.error);
  }
};

// Export store names for easy access
export const stores = STORES;
