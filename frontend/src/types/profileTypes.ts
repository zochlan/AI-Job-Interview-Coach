// Shared interfaces for profile and CV data

export interface Education {
  institution?: string;
  degree?: string;
  dates?: string;
  location?: string;
  description?: string;
  gpa?: string;
}

export interface Experience {
  company?: string;
  title?: string;
  dates?: string;
  location?: string;
  description?: string;
  responsibilities?: string[];
  achievements?: string[];
}

export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  education?: string | Education | Education[];
  experience?: string | Experience | Experience[];
  summary?: string;
  jobTitle?: string;
  uploaded?: boolean;
  complex_format_detected?: boolean;
  lastUpdated?: string;
  [key: string]: any;
}

export interface CVAnalysis {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  education?: string | Education | Education[];
  experience?: string | Experience | Experience[];
  summary?: string;
  recommendations?: string[];
  section_scores?: Record<string, Record<string, number>>;
  ats_report?: Record<string, any>;
  bias_report?: Record<string, any>;
  language_report?: Record<string, any>;
  target_job?: string;
  uploaded?: boolean;
  complex_format_detected?: boolean;
  lastUpdated?: string;
  raw_text?: string;
  [key: string]: any;
}
