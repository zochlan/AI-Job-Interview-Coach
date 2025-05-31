import { ChatMessage, Session } from '../types/ChatMessage';

/**
 * Generate a unique ID for a session
 * @returns A unique string ID
 */
const generateSessionId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Save a chat session to local storage
 * @param messages - Array of chat messages
 * @param sessionType - Type of session ('interview' or 'coach')
 * @returns The ID of the saved session
 */
export const saveSession = (
  messages: ChatMessage[],
  sessionType: 'interview' | 'coach',
  forceNewSession: boolean = false
): string => {
  // Get existing sessions
  const existingSessions = getSessions();

  // Check if we have a current session ID in session storage and we're not forcing a new session
  const currentSessionId = forceNewSession ? null : window.sessionStorage.getItem('currentSessionId');

  // If we have a current session ID and we're not forcing a new session, update that session
  if (currentSessionId) {
    const existingSession = existingSessions.find(s => s.id === currentSessionId);

    if (existingSession) {
      // Update the existing session
      existingSession.messages = messages;
      existingSession.updatedAt = new Date().toISOString();
      existingSession.sessionType = sessionType;

      // Save back to local storage
      localStorage.setItem('chatSessions', JSON.stringify(existingSessions));

      return currentSessionId;
    }
  }

  // Create a new session
  const newSessionId = generateSessionId();
  const newSession: Session = {
    id: newSessionId,
    sessionType,
    messages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: `Session ${existingSessions.length + 1}`
  };

  // Add to existing sessions and save
  existingSessions.push(newSession);
  localStorage.setItem('chatSessions', JSON.stringify(existingSessions));

  // Store the current session ID in session storage
  window.sessionStorage.setItem('currentSessionId', newSessionId);

  return newSessionId;
};

/**
 * Get all saved sessions from local storage
 * @returns Array of Session objects
 */
export const getSessions = (): Session[] => {
  const sessionsData = localStorage.getItem('chatSessions');
  return sessionsData ? JSON.parse(sessionsData) : [];
};

/**
 * Get a specific session by ID
 * @param id - Session ID
 * @returns Session object or null if not found
 */
export const getSessionById = (id: string): Session | null => {
  const sessions = getSessions();
  return sessions.find(session => session.id === id) || null;
};

/**
 * Update an existing session
 * @param id - Session ID
 * @param messages - Updated messages array
 * @param sessionType - Session type
 * @returns boolean indicating success
 */
export const updateSession = (
  id: string,
  messages: ChatMessage[],
  sessionType: 'interview' | 'coach'
): boolean => {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(session => session.id === id);

  if (sessionIndex === -1) return false;

  sessions[sessionIndex].messages = messages;
  sessions[sessionIndex].updatedAt = new Date().toISOString();
  sessions[sessionIndex].sessionType = sessionType;

  localStorage.setItem('chatSessions', JSON.stringify(sessions));
  return true;
};

/**
 * Delete a session by ID
 * @param id - Session ID
 * @returns boolean indicating success
 */
export const deleteSession = (id: string): boolean => {
  const sessions = getSessions();
  const filteredSessions = sessions.filter(session => session.id !== id);

  if (filteredSessions.length === sessions.length) return false;

  localStorage.setItem('chatSessions', JSON.stringify(filteredSessions));

  // If this was the current session, clear the current session ID
  if (window.sessionStorage.getItem('currentSessionId') === id) {
    window.sessionStorage.removeItem('currentSessionId');
  }

  return true;
};
