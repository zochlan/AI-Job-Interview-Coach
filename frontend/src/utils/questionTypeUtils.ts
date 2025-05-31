/**
 * Utility functions for handling question types and categories
 */

/**
 * Maps a category string to a valid questionType
 * This ensures we're using the correct type for the ChatMessage interface
 * 
 * @param category The category string to map
 * @returns A valid questionType for the ChatMessage interface
 */
export const mapCategoryToQuestionType = (
  category: string
): 'behavioral' | 'technical' | 'situational' | 'general' | 'introductory' | 'closing' => {
  // If the category is already a valid questionType, return it
  if (
    category === 'behavioral' || 
    category === 'technical' || 
    category === 'situational' || 
    category === 'general' || 
    category === 'introductory' || 
    category === 'closing'
  ) {
    return category as any;
  }
  
  // Map other categories to valid question types
  if (category === 'initial') return 'introductory';
  if (category === 'early') return 'general';
  if (category === 'middle') return 'behavioral';
  if (category === 'late') return 'situational';
  if (category === 'final' || category === 'closing') return 'closing';
  
  // Default fallback
  return 'general';
};
