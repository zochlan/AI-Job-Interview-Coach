import { ChatMessage } from '../types/chatTypes';

// Define the session structure
export interface InterviewSession {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
  lastUpdated: string;
  sessionType: 'interview' | 'coach'; // Add session type
  metadata?: {
    usesCV?: boolean;
    [key: string]: any;
  }; // Optional metadata for additional session information
}

// Get all saved sessions
export const getSavedSessions = (): InterviewSession[] => {
  try {
    const sessionsJson = localStorage.getItem('interview-sessions');
    if (sessionsJson) {
      return JSON.parse(sessionsJson);
    }
  } catch (error) {
    console.error('Error retrieving saved sessions:', error);
  }
  return [];
};

// Save a new session
export const saveSession = (
  messages: ChatMessage[],
  sessionType: 'interview' | 'coach' = 'coach',
  forceNewSession: boolean = false,
  metadata?: { [key: string]: any }
): string => {
  try {
    // Check if there are any user responses in the messages
    // Only save sessions that have at least one user response
    const hasUserResponses = messages.some(msg => msg.id === 0);
    if (!hasUserResponses) {
      console.log('No user responses found in session. Not saving.');
      return '';
    }

    // Clear current session ID if forcing a new session
    if (forceNewSession) {
      window.sessionStorage.removeItem('currentSessionId');
    }

    const sessions = getSavedSessions();

    // Generate a unique ID
    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create a title from the first question or default
    let title = sessionType === 'interview' ? 'Interview Session' : 'Coaching Session';

    // Add CV usage to title if specified
    if (metadata?.usesCV !== undefined) {
      title = `${title} ${metadata.usesCV ? '(with CV)' : '(without CV)'}`;
    }

    const firstQuestion = messages.find(msg =>
      msg.id === 1 &&
      (msg.message.includes('?') || msg.message.toLowerCase().includes('question'))
    );

    if (firstQuestion) {
      // Extract the question from the message
      const questionMatch = firstQuestion.message.match(/([^.!?]+\?)/);
      if (questionMatch && questionMatch[0]) {
        title = questionMatch[0].trim();
        // Limit title length
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
        }

        // Add CV usage to title if specified
        if (metadata?.usesCV !== undefined) {
          title = `${title} ${metadata.usesCV ? '(with CV)' : '(without CV)'}`;
        }
      }
    }

    // Create the new session
    const newSession: InterviewSession = {
      id: sessionId,
      title,
      date: new Date().toLocaleDateString(),
      messages,
      lastUpdated: new Date().toISOString(),
      sessionType, // Include the session type
      metadata    // Include the metadata if provided
    };

    // Add to sessions and save
    sessions.push(newSession);
    localStorage.setItem('interview-sessions', JSON.stringify(sessions));

    // Store the current session ID in sessionStorage
    window.sessionStorage.setItem('currentSessionId', sessionId);

    return sessionId;
  } catch (error) {
    console.error('Error saving session:', error);
    return '';
  }
};

// Get a specific session by ID
export const getSessionById = (sessionId: string): InterviewSession | null => {
  try {
    const sessions = getSavedSessions();
    return sessions.find(session => session.id === sessionId) || null;
  } catch (error) {
    console.error('Error retrieving session:', error);
    return null;
  }
};

// Update an existing session
export const updateSession = (
  sessionId: string,
  messages: ChatMessage[],
  sessionType?: 'interview' | 'coach',
  metadata?: { [key: string]: any }
): boolean => {
  try {
    // Check if there are any user responses in the messages
    // Only update sessions that have at least one user response
    const hasUserResponses = messages.some(msg => msg.id === 0);
    if (!hasUserResponses) {
      console.log('No user responses found in session. Not updating.');
      return false;
    }

    const sessions = getSavedSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);

    if (sessionIndex >= 0) {
      sessions[sessionIndex].messages = messages;
      sessions[sessionIndex].lastUpdated = new Date().toISOString();

      // Update session type if provided
      if (sessionType) {
        sessions[sessionIndex].sessionType = sessionType;
      } else if (!sessions[sessionIndex].sessionType) {
        // If session doesn't have a type yet (for backward compatibility), set a default
        sessions[sessionIndex].sessionType = 'coach';
      }

      // Update metadata if provided
      if (metadata) {
        sessions[sessionIndex].metadata = {
          ...(sessions[sessionIndex].metadata || {}),
          ...metadata
        };

        // Update title to reflect CV usage if that's in the metadata
        if (metadata.usesCV !== undefined) {
          const cvStatus = metadata.usesCV ? '(with CV)' : '(without CV)';
          if (!sessions[sessionIndex].title.includes('(with CV)') &&
              !sessions[sessionIndex].title.includes('(without CV)')) {
            sessions[sessionIndex].title = `${sessions[sessionIndex].title} ${cvStatus}`;
          } else {
            // Replace existing CV status
            sessions[sessionIndex].title = sessions[sessionIndex].title
              .replace(/\(with CV\)|\(without CV\)/g, cvStatus);
          }
        }
      }

      localStorage.setItem('interview-sessions', JSON.stringify(sessions));

      // Ensure the current session ID is stored in sessionStorage
      const currentSessionId = window.sessionStorage.getItem('currentSessionId');
      if (!currentSessionId || currentSessionId !== sessionId) {
        window.sessionStorage.setItem('currentSessionId', sessionId);
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating session:', error);
    return false;
  }
};

// Delete a session
export const deleteSession = (sessionId: string): boolean => {
  try {
    const sessions = getSavedSessions();
    const filteredSessions = sessions.filter(session => session.id !== sessionId);

    if (filteredSessions.length !== sessions.length) {
      localStorage.setItem('interview-sessions', JSON.stringify(filteredSessions));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
};

// Export session to text
export const exportSessionToText = (sessionId: string): string => {
  try {
    const session = getSessionById(sessionId);
    if (!session) return '';

    let exportText = `Interview Session: ${session.title}\n`;
    exportText += `Date: ${session.date}\n`;
    exportText += `Type: ${session.sessionType === 'interview' ? 'Interview' : 'Coach'} Mode\n`;

    // Add CV usage information if available
    if (session.metadata?.usesCV !== undefined) {
      exportText += `CV Used: ${session.metadata.usesCV ? 'Yes' : 'No'}\n`;
    }

    exportText += '\n';

    session.messages.forEach(msg => {
      const role = msg.id === 0 ? 'You' : (session.sessionType === 'interview' ? 'Interviewer' : 'Coach');
      exportText += `${role}: ${msg.message}\n\n`;
    });

    return exportText;
  } catch (error) {
    console.error('Error exporting session:', error);
    return '';
  }
};
