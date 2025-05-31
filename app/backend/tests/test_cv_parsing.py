"""
Tests for the improved CV parsing functionality.
"""
import os
import pytest
import tempfile
import sys
import os
# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from backend.nlp.advanced_analysis import parse_cv, extract_name, extract_skills, extract_target_job
from backend.nlp.skill_keywords import ALL_SKILLS

# Sample CV text for testing
SAMPLE_CV = """
John Smith
john.smith@example.com
(123) 456-7890

SUMMARY
Experienced software engineer with 5+ years of experience in Python, JavaScript, and cloud technologies.
Seeking a Senior Software Engineer position to leverage my skills in building scalable web applications.

SKILLS
- Programming: Python, JavaScript, TypeScript, Java
- Web: React, Angular, Node.js, Django, Flask
- Cloud: AWS, Docker, Kubernetes
- Database: PostgreSQL, MongoDB
- Tools: Git, CI/CD, Jira

EXPERIENCE
Senior Software Engineer, Tech Company Inc., 2020-Present
- Led development of a microservices architecture that improved system reliability by 30%
- Implemented CI/CD pipelines that reduced deployment time by 50%
- Mentored junior developers and conducted code reviews

Software Engineer, Startup XYZ, 2018-2020
- Developed RESTful APIs using Django and Flask
- Built responsive front-end interfaces with React
- Worked with MongoDB and PostgreSQL databases

EDUCATION
Master of Computer Science, University of Technology, 2018
Bachelor of Science in Computer Engineering, State University, 2016

PROJECTS
Cloud Migration Tool
- Developed a tool to automate AWS cloud migrations
- Reduced migration time by 40% for client projects

E-commerce Platform
- Built a full-stack e-commerce platform using MERN stack
- Implemented payment processing and inventory management
"""

def test_extract_name():
    """Test the name extraction functionality."""
    # Create a temporary file with sample CV content
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp:
        temp.write(SAMPLE_CV.encode('utf-8'))
        temp_path = temp.name

    try:
        # Parse the CV
        profile = parse_cv(temp_path)

        # Check if name was correctly extracted
        assert profile['name'] == 'John Smith', f"Expected 'John Smith', got '{profile['name']}'"

    finally:
        # Clean up
        os.unlink(temp_path)

def test_extract_skills():
    """Test the skills extraction functionality."""
    # Create a temporary file with sample CV content
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp:
        temp.write(SAMPLE_CV.encode('utf-8'))
        temp_path = temp.name

    try:
        # Parse the CV
        profile = parse_cv(temp_path)

        # Check if skills were correctly extracted
        expected_skills = ['python', 'javascript', 'typescript', 'java', 'react', 'angular',
                          'node.js', 'django', 'flask', 'aws', 'docker', 'kubernetes',
                          'postgresql', 'mongodb', 'git', 'ci/cd']

        # Convert both lists to lowercase for case-insensitive comparison
        extracted_skills = [skill.lower() for skill in profile['skills']]

        # Check if all expected skills are in the extracted skills
        for skill in expected_skills:
            assert skill in extracted_skills, f"Expected skill '{skill}' not found in extracted skills"

    finally:
        # Clean up
        os.unlink(temp_path)

def test_extract_target_job():
    """Test the target job extraction functionality."""
    # Create a temporary file with sample CV content
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp:
        temp.write(SAMPLE_CV.encode('utf-8'))
        temp_path = temp.name

    try:
        # Parse the CV
        profile = parse_cv(temp_path)

        # Check if target job was correctly extracted
        assert "Senior Software Engineer" in profile['target_job'], \
            f"Expected 'Senior Software Engineer' in target job, got '{profile['target_job']}'"

    finally:
        # Clean up
        os.unlink(temp_path)

def test_extract_contact_info():
    """Test the contact information extraction functionality."""
    # Create a temporary file with sample CV content
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp:
        temp.write(SAMPLE_CV.encode('utf-8'))
        temp_path = temp.name

    try:
        # Parse the CV
        profile = parse_cv(temp_path)

        # Check if email was correctly extracted
        assert profile['email'] == 'john.smith@example.com', \
            f"Expected 'john.smith@example.com', got '{profile['email']}'"

        # Check if phone was correctly extracted (if implemented)
        if 'phone' in profile:
            assert '(123) 456-7890' in profile['phone'], \
                f"Expected '(123) 456-7890' in phone, got '{profile['phone']}'"

    finally:
        # Clean up
        os.unlink(temp_path)

def test_section_extraction():
    """Test the section extraction functionality."""
    # Create a temporary file with sample CV content
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp:
        temp.write(SAMPLE_CV.encode('utf-8'))
        temp_path = temp.name

    try:
        # Parse the CV
        profile = parse_cv(temp_path)

        # Check if sections were correctly extracted
        assert 'summary' in profile['sections'], "Summary section not found"
        assert 'experience' in profile['sections'], "Experience section not found"
        assert 'education' in profile['sections'], "Education section not found"
        assert 'skills' in profile['sections'], "Skills section not found"
        assert 'projects' in profile['sections'], "Projects section not found"

    finally:
        # Clean up
        os.unlink(temp_path)
