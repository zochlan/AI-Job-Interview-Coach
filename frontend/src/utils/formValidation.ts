/**
 * Form validation utility functions
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Password validation (min 8 chars, at least 1 letter and 1 number)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && 
         /[A-Za-z]/.test(password) && 
         /[0-9]/.test(password);
};

// Password strength checker (returns 0-4)
export const getPasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return Math.min(4, strength);
};

// Username validation (alphanumeric, 3-20 chars)
export const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

// Name validation (letters, spaces, hyphens, apostrophes)
export const isValidName = (name: string): boolean => {
  return /^[a-zA-Z\s'-]{2,50}$/.test(name);
};

// Phone number validation (simple)
export const isValidPhone = (phone: string): boolean => {
  return /^[\d\s()+.-]{10,20}$/.test(phone);
};

// URL validation
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// File size validation (in bytes)
export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// File type validation
export const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return allowedTypes.includes(`.${extension}`);
};

// Form field validation with custom error messages
export interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

export const validateField = (
  fieldName: string,
  value: string,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    validate?: (value: string) => boolean;
    errorMessage?: string;
  }
): ValidationResult => {
  // Required check
  if (rules.required && !value.trim()) {
    return {
      isValid: false,
      errorMessage: rules.errorMessage || `${fieldName} is required`
    };
  }
  
  // Min length check
  if (rules.minLength !== undefined && value.length < rules.minLength) {
    return {
      isValid: false,
      errorMessage: rules.errorMessage || `${fieldName} must be at least ${rules.minLength} characters`
    };
  }
  
  // Max length check
  if (rules.maxLength !== undefined && value.length > rules.maxLength) {
    return {
      isValid: false,
      errorMessage: rules.errorMessage || `${fieldName} must be no more than ${rules.maxLength} characters`
    };
  }
  
  // Pattern check
  if (rules.pattern && !rules.pattern.test(value)) {
    return {
      isValid: false,
      errorMessage: rules.errorMessage || `${fieldName} is not in a valid format`
    };
  }
  
  // Custom validation
  if (rules.validate && !rules.validate(value)) {
    return {
      isValid: false,
      errorMessage: rules.errorMessage || `${fieldName} is invalid`
    };
  }
  
  return {
    isValid: true,
    errorMessage: ''
  };
};

// Validate entire form
export const validateForm = (
  formData: Record<string, string>,
  validationRules: Record<string, any>
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};
  
  Object.keys(validationRules).forEach(fieldName => {
    const value = formData[fieldName] || '';
    results[fieldName] = validateField(fieldName, value, validationRules[fieldName]);
  });
  
  return results;
};

// Check if entire form is valid
export const isFormValid = (validationResults: Record<string, ValidationResult>): boolean => {
  return Object.values(validationResults).every(result => result.isValid);
};
