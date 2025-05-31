"""
Summary extraction module for CV analysis.
This module provides functions to extract and generate high-quality summaries from CV text.
"""

import re
import logging
from typing import List, Dict, Any, Optional
import spacy
from .skill_keywords import (
    PROGRAMMING_LANGUAGES, WEB_TECHNOLOGIES, DATA_SCIENCE,
    CLOUD_DEVOPS, DATABASE_TECHNOLOGIES, SOFT_SKILLS, BUSINESS_SKILLS
)

def clean_sensitive_information(text: str) -> str:
    """
    Thoroughly clean text to remove sensitive information like phone numbers and email addresses.

    Args:
        text: The text to clean

    Returns:
        Cleaned text with sensitive information removed
    """
    if not text:
        return ""

    # Phone number patterns (comprehensive)
    phone_patterns = [
        # North American formats
        r'\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',

        # International formats with country codes
        r'\b\+\d{1,3}[-.\s]?\d{1,14}\b',

        # Common formats without separators
        r'\b\d{10,12}\b',

        # Short formats
        r'\b\d{3}[-.\s]?\d{4}\b',

        # UAE specific formats
        r'\b(?:\+?971|0)[-.\s]?(?:50|55|56|58|2|3|4|6|7|9)\d{7}\b',

        # Format with "Tel:" or "Phone:" prefix
        r'(?:Tel|Phone|Mobile|Cell|Contact)(?::|number|#|is|at)?[-.\s]*(?:\+?\d[-.\s\d]{8,})',

        # Any sequence of digits that looks like a phone number
        r'\b\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,5}\b'
    ]

    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'

    # Remove phone numbers
    for pattern in phone_patterns:
        text = re.sub(pattern, '', text)

    # Remove email addresses
    text = re.sub(email_pattern, '', text)

    # Clean up any artifacts from the removal
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'^[,.\s:;-]+|[,.\s:;-]+$', '', text).strip()

    return text

def extract_summary(text: str, sections: Dict[str, str], doc) -> str:
    """
    Extract or generate a professional summary from CV text.

    This function uses multiple strategies to extract or generate a high-quality summary:
    1. Look for an explicit summary/profile/objective section
    2. Extract key information from the first few paragraphs
    3. Generate a summary based on skills, experience, and education
    4. Clean and format the summary for consistency

    Args:
        text: The full CV text
        sections: Dictionary of extracted CV sections
        doc: spaCy document for NLP analysis

    Returns:
        A professional summary paragraph
    """
    # Strategy 1: Extract from explicit summary section
    summary = get_explicit_summary(sections)
    if summary:
        logging.info(f"Found explicit summary section: {summary[:50]}...")
        return clean_and_format_summary(summary)

    # Strategy 2: Extract from first few paragraphs
    summary = extract_from_introduction(text)
    if summary:
        logging.info(f"Extracted summary from introduction: {summary[:50]}...")
        return clean_and_format_summary(summary)

    # Strategy 3: Generate summary from key information
    summary = generate_summary_from_cv(text, sections, doc)
    logging.info(f"Generated summary from CV content: {summary[:50]}...")
    return clean_and_format_summary(summary)

def get_explicit_summary(sections: Dict[str, str]) -> str:
    """
    Extract summary from explicit summary/profile/objective section.

    Args:
        sections: Dictionary of extracted CV sections

    Returns:
        Extracted summary text or empty string if not found
    """
    # Check for various summary section names
    summary_section_names = [
        "summary", "profile", "professional summary", "executive summary",
        "career summary", "personal profile", "professional profile",
        "objective", "career objective", "professional objective"
    ]

    for name in summary_section_names:
        if name in sections and sections[name]:
            # Clean up the summary
            summary = sections[name].strip()

            # If it's too long, take just the first paragraph
            if len(summary) > 500:
                paragraphs = summary.split('\n\n')
                if paragraphs:
                    summary = paragraphs[0].strip()

            return summary

    return ""

def extract_from_introduction(text: str) -> str:
    """
    Extract summary from the introduction/first few paragraphs of the CV.

    Args:
        text: The full CV text

    Returns:
        Extracted introduction text or empty string if not suitable
    """
    # Split text into paragraphs
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]

    # Skip very short paragraphs and headers
    valid_paragraphs = []
    for p in paragraphs[:5]:  # Look only at first 5 paragraphs
        # Skip if it's too short or looks like a header
        if len(p) < 20 or p.isupper() or p.endswith(':'):
            continue

        # Skip if it contains contact information
        if re.search(r'(?:email|phone|address|tel|mobile|contact)', p.lower()):
            continue

        valid_paragraphs.append(p)

    # Take the first valid paragraph that's a reasonable length
    for p in valid_paragraphs:
        if 50 <= len(p) <= 500 and '.' in p:  # Must contain at least one sentence
            return p

    # If we found paragraphs but none met our criteria, take the first one anyway
    if valid_paragraphs:
        return valid_paragraphs[0]

    return ""

def generate_summary_from_cv(text: str, sections: Dict[str, str], doc) -> str:
    """
    Generate a professional summary based on key information in the CV.

    Args:
        text: The full CV text
        sections: Dictionary of extracted CV sections
        doc: spaCy document for NLP analysis

    Returns:
        Generated summary text
    """
    # Extract key information
    experience_section = sections.get("experience", "")
    education_section = sections.get("education", "")
    skills_section = sections.get("skills", "")

    # Extract years of experience
    years_of_experience = extract_years_of_experience(experience_section)

    # Extract highest education level
    education_level = extract_education_level(education_section)

    # Extract key skills (top 5)
    key_skills = extract_key_skills(skills_section, text)

    # Extract job titles
    job_titles = extract_job_titles(experience_section, doc)
    current_title = job_titles[0] if job_titles else ""

    # Extract industries
    industries = extract_industries(experience_section, doc)
    industry = industries[0] if industries else ""

    # Generate summary
    summary_parts = []

    # Professional identity
    if current_title and years_of_experience:
        summary_parts.append(f"Experienced {current_title} with {years_of_experience} years of professional experience")
        if industry:
            summary_parts[-1] += f" in the {industry} industry"
        summary_parts[-1] += "."
    elif current_title:
        summary_parts.append(f"Experienced {current_title}")
        if industry:
            summary_parts[-1] += f" in the {industry} industry"
        summary_parts[-1] += "."
    elif years_of_experience:
        summary_parts.append(f"Professional with {years_of_experience} years of experience")
        if industry:
            summary_parts[-1] += f" in the {industry} industry"
        summary_parts[-1] += "."
    else:
        summary_parts.append("Dedicated professional with a strong track record of success.")

    # Skills
    if key_skills:
        skills_str = ", ".join(key_skills[:-1]) + f" and {key_skills[-1]}" if len(key_skills) > 1 else key_skills[0]
        summary_parts.append(f"Skilled in {skills_str}.")

    # Education
    if education_level:
        summary_parts.append(f"Holds {education_level}.")

    # Career focus
    if job_titles and len(job_titles) > 1:
        summary_parts.append(f"Career focused on roles including {', '.join(job_titles[:2])}.")

    # Join parts
    summary = " ".join(summary_parts)

    return summary

def extract_years_of_experience(experience_text: str) -> Optional[int]:
    """Extract total years of experience from experience section."""
    if not experience_text:
        return None

    # Look for explicit mentions of years of experience
    patterns = [
        r'(?:over|more than|approximately|about|nearly|around)?\s*(\d+)(?:\+)?\s*(?:years|yrs)(?:\s+of)?\s+(?:experience|work)',
        r'(\d+)(?:\+)?\s*(?:years|yrs)(?:\s+of)?\s+(?:experience|work)',
        r'(?:experience|work)(?:\s+of)?\s+(\d+)(?:\+)?\s*(?:years|yrs)'
    ]

    for pattern in patterns:
        matches = re.findall(pattern, experience_text, re.I)
        if matches:
            try:
                return int(matches[0])
            except (ValueError, TypeError):
                continue

    # Try to calculate from date ranges
    date_ranges = re.findall(r'(\d{4})\s*(?:-|–|to)\s*(?:(\d{4})|present|current|now)', experience_text)
    if date_ranges:
        import datetime
        current_year = datetime.datetime.now().year
        total_years = 0

        for start, end in date_ranges:
            try:
                start_year = int(start)
                end_year = int(end) if end else current_year
                total_years += (end_year - start_year)
            except (ValueError, TypeError):
                continue

        if total_years > 0:
            return min(total_years, 40)  # Cap at 40 years to avoid unrealistic values

    return None

def extract_education_level(education_text: str) -> Optional[str]:
    """Extract highest education level from education section."""
    if not education_text:
        return None

    # Define education levels in descending order of precedence
    education_levels = [
        ("PhD", ["phd", "ph.d", "doctorate", "doctor of philosophy"]),
        ("Master's degree", ["master", "msc", "ms", "ma", "mba", "m.s", "m.a", "m.b.a"]),
        ("Bachelor's degree", ["bachelor", "bsc", "bs", "ba", "b.s", "b.a", "undergraduate"]),
        ("Associate's degree", ["associate", "a.a", "a.s"]),
        ("Diploma", ["diploma", "certificate", "certification"])
    ]

    # Check for each education level
    for level_name, keywords in education_levels:
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', education_text.lower()):
                return f"a {level_name}"

    return None

def extract_key_skills(skills_section: str, full_text: str) -> List[str]:
    """Extract key skills from skills section or full text."""
    # Common technical skills to look for
    technical_skills = [
        "Python", "Java", "JavaScript", "C++", "C#", "SQL", "HTML", "CSS",
        "React", "Angular", "Vue.js", "Node.js", "Django", "Flask", "Spring",
        "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "CI/CD",
        "Machine Learning", "Data Analysis", "Data Science", "AI", "Deep Learning",
        "Project Management", "Agile", "Scrum", "DevOps", "Git", "GitHub"
    ]

    # Common soft skills to look for
    soft_skills = [
        "Leadership", "Communication", "Teamwork", "Problem Solving",
        "Critical Thinking", "Time Management", "Adaptability", "Creativity"
    ]

    # Combine all skills
    all_skills = technical_skills + soft_skills

    # First check skills section
    found_skills = []
    if skills_section:
        for skill in all_skills:
            if re.search(r'\b' + re.escape(skill) + r'\b', skills_section, re.I):
                found_skills.append(skill)

    # If not enough skills found, check full text
    if len(found_skills) < 5:
        for skill in all_skills:
            if skill not in found_skills and re.search(r'\b' + re.escape(skill) + r'\b', full_text, re.I):
                found_skills.append(skill)

    # Return top 5 skills (prioritize technical skills)
    tech_skills = [s for s in found_skills if s in technical_skills]
    soft_skills = [s for s in found_skills if s in soft_skills]

    result = tech_skills[:3] + soft_skills[:2]
    return result[:5]

def extract_job_titles(experience_text: str, doc) -> List[str]:
    """Extract job titles from experience section."""
    if not experience_text:
        return []

    # Common job titles to look for
    common_titles = [
        "Software Engineer", "Software Developer", "Web Developer", "Full Stack Developer",
        "Frontend Developer", "Backend Developer", "Data Scientist", "Data Analyst",
        "Machine Learning Engineer", "DevOps Engineer", "Project Manager", "Product Manager",
        "UX Designer", "UI Designer", "System Administrator", "Network Engineer",
        "Database Administrator", "Business Analyst", "QA Engineer", "Test Engineer"
    ]

    # First look for common titles
    found_titles = []
    for title in common_titles:
        if re.search(r'\b' + re.escape(title) + r'\b', experience_text, re.I):
            found_titles.append(title)

    # If not enough titles found, try to extract using NER
    if len(found_titles) < 2 and doc:
        try:
            # Look for job title patterns
            title_patterns = [
                r'(?:^|\n)(?:\s*[-•*]\s*)?([A-Z][A-Za-z\s&,\-]+)(?:\n|,|\s+at\s+|\s+for\s+|\s+with\s+)',
                r'(?:as|position|title|role)(?:\s+of)?(?:\s+a)?(?:\s+the)?\s+([A-Za-z\s&,\-]+)',
                r'(?:hired|employed|worked|joined)(?:\s+as)?\s+(?:a|an)?\s+([A-Za-z\s&,\-]+)'
            ]

            for pattern in title_patterns:
                matches = re.findall(pattern, experience_text)
                for match in matches:
                    title = match.strip()
                    if 3 <= len(title) <= 50 and title not in found_titles:
                        found_titles.append(title)
        except Exception as e:
            logging.warning(f"Error extracting job titles with NER: {e}")

    # Return unique titles
    return found_titles[:3]

def extract_industries(experience_text: str, doc) -> List[str]:
    """Extract industries from experience section."""
    if not experience_text:
        return []

    # Common industries to look for
    common_industries = [
        "Technology", "Software", "Finance", "Healthcare", "Education",
        "Retail", "Manufacturing", "Consulting", "Media", "Entertainment",
        "Telecommunications", "Automotive", "Energy", "Aerospace", "Defense",
        "Pharmaceutical", "Biotechnology", "E-commerce", "Hospitality", "Real Estate"
    ]

    # Look for common industries
    found_industries = []
    for industry in common_industries:
        if re.search(r'\b' + re.escape(industry) + r'\b', experience_text, re.I):
            found_industries.append(industry)

    # Return unique industries
    return found_industries[:2]

def clean_and_format_summary(summary: str) -> str:
    """Clean and format the summary for consistency."""
    if not summary:
        return ""

    # Remove any sensitive information
    summary = clean_sensitive_information(summary)

    # Remove extra whitespace
    summary = re.sub(r'\s+', ' ', summary).strip()

    # Ensure proper capitalization of first letter
    if summary and summary[0].islower():
        summary = summary[0].upper() + summary[1:]

    # Ensure summary ends with a period
    if summary and not summary.endswith(('.', '!', '?')):
        summary += '.'

    # Limit length
    if len(summary) > 500:
        # Try to truncate at a sentence boundary
        sentences = re.split(r'(?<=[.!?])\s+', summary)
        truncated_summary = ""
        for sentence in sentences:
            if len(truncated_summary) + len(sentence) <= 500:
                truncated_summary += sentence + " "
            else:
                break
        summary = truncated_summary.strip()

    return summary
