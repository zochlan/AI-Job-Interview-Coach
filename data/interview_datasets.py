import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import os

def create_interview_datasets():
    # Dataset 1: Behavioral Questions
    behavioral_data = {
        'question': [
            "Tell me about a time you showed leadership",
            "How do you handle conflict at work?",
            "Describe a challenging project you completed",
            "How do you prioritize your work?",
            "Tell me about a time you failed",
            "How do you handle tight deadlines?",
            "Describe your ideal work environment",
            "How do you stay updated with industry trends?",
            "Tell me about a time you had to learn something quickly",
            "How do you handle constructive criticism?",
            "What motivates you at work?",
            "How do you handle work-life balance?",
            "Describe a time you had to work with a difficult team member",
            "How do you make important decisions?",
            "What's your greatest strength and weakness?"
        ],
        'good_response': [
            "In my last role, I led a team of five developers to complete a critical project ahead of schedule. I organized daily stand-ups, delegated tasks based on strengths, and maintained clear communication.",
            "I believe in addressing conflicts directly but professionally. Once, I had a disagreement with a colleague about project approach. I scheduled a private meeting to discuss our perspectives and found common ground.",
            "I recently managed a website redesign project under tight deadlines. I broke down the project into sprints, coordinated with stakeholders, and delivered on time while maintaining quality.",
            "I use a combination of urgency and importance to prioritize. I maintain a digital task list, set clear deadlines, and communicate my progress regularly with stakeholders.",
            "During my first project management role, I underestimated the timeline for a software release. I learned to better estimate project scope and now include buffer time for unexpected challenges.",
            "I break down large tasks into smaller, manageable chunks and create a detailed timeline. I also communicate early if I foresee any potential delays and work with stakeholders to adjust expectations.",
            "I thrive in collaborative environments where open communication is encouraged. I appreciate having clear goals while maintaining flexibility in how we achieve them.",
            "I regularly attend industry conferences, follow relevant blogs and podcasts, and participate in online courses. I also maintain a network of professionals who share insights about emerging trends.",
            "When I needed to learn a new programming language for a project, I created a structured learning plan, used online resources, and practiced with small projects. I also sought guidance from experienced colleagues.",
            "I view constructive criticism as an opportunity for growth. I listen carefully, ask clarifying questions, and create an action plan to address the feedback.",
            "I'm motivated by solving complex problems and seeing the impact of my work. I particularly enjoy when my solutions help improve efficiency or user experience.",
            "I maintain clear boundaries by setting specific work hours and using time management techniques. I also make sure to take regular breaks and use my vacation time effectively.",
            "I focus on understanding their perspective and finding common ground. I once worked with someone who had a different communication style, so I adapted my approach to ensure effective collaboration.",
            "I gather all relevant information, consider different perspectives, and evaluate potential outcomes. I also consult with team members when appropriate and document my reasoning.",
            "My greatest strength is my problem-solving ability, which I demonstrate through my systematic approach to challenges. As for weaknesses, I'm working on improving my public speaking skills by taking courses and practicing regularly."
        ],
        'poor_response': [
            "I'm usually the one in charge because I'm better than others at making decisions.",
            "I don't really deal with conflict, I just ignore it and focus on my work.",
            "I haven't really had any challenging projects yet.",
            "I just do whatever seems most important at the time.",
            "I never fail at anything, I always succeed.",
            "I just work harder when deadlines are tight.",
            "I like working alone without much interaction.",
            "I don't really follow industry trends.",
            "I just figure things out as I go.",
            "I usually just ignore criticism.",
            "Money and promotions motivate me.",
            "I work whenever I need to, even on weekends.",
            "I avoid working with difficult people.",
            "I go with my gut feeling.",
            "I don't have any weaknesses."
        ],
        'category': ['leadership', 'conflict_resolution', 'project_management', 'organization', 
                    'failure_recovery', 'time_management', 'work_style', 'professional_development',
                    'learning_ability', 'feedback_handling', 'motivation', 'work_life_balance',
                    'teamwork', 'decision_making', 'self_awareness']
    }
    
    # Dataset 2: Technical Questions
    technical_data = {
        'question': [
            "Explain object-oriented programming",
            "What is REST API?",
            "Describe database normalization",
            "What is version control?",
            "Explain the difference between HTTP and HTTPS",
            "What is the difference between SQL and NoSQL?",
            "Explain the concept of Big O notation",
            "What is Docker and why is it used?",
            "Explain the concept of microservices",
            "What is CI/CD?",
            "What is the difference between GET and POST requests?",
            "Explain the concept of caching",
            "What is the difference between stack and heap memory?",
            "Explain the concept of polymorphism",
            "What is the difference between synchronous and asynchronous programming?"
        ],
        'good_response': [
            "OOP is a programming paradigm based on objects containing data and code. It uses concepts like inheritance, encapsulation, polymorphism, and abstraction to organize code into reusable patterns.",
            "REST API is an architectural style for building web services that use HTTP methods like GET, POST, PUT, DELETE to perform operations on resources, following stateless client-server communication.",
            "Database normalization is the process of structuring a database to reduce data redundancy and improve data integrity through organizing fields and tables of a database.",
            "Version control is a system that records changes to files over time, allowing you to recall specific versions later. Git is a popular example that helps teams collaborate on code.",
            "HTTP is unsecured protocol for web communication, while HTTPS adds a security layer using SSL/TLS encryption to protect data transmission between client and server.",
            "SQL databases are relational, structured, and use predefined schemas, while NoSQL databases are non-relational, flexible, and can handle unstructured data. NoSQL is better for scalability and handling large volumes of data.",
            "Big O notation describes the performance or complexity of an algorithm. It helps us understand how an algorithm's running time grows as the input size increases.",
            "Docker is a containerization platform that packages applications and their dependencies into containers. It ensures consistency across different environments and makes deployment easier.",
            "Microservices is an architectural style where an application is built as a collection of small, independent services that communicate through APIs. It improves scalability and maintainability.",
            "CI/CD stands for Continuous Integration and Continuous Deployment. It's a method to frequently deliver apps to customers by introducing automation into the stages of app development.",
            "GET requests retrieve data and are idempotent, while POST requests create new data and are not idempotent. GET requests can be cached and bookmarked, while POST requests cannot.",
            "Caching is storing frequently accessed data in a faster storage medium to improve performance. It reduces load on the main storage and speeds up data retrieval.",
            "Stack memory is static and automatically managed, while heap memory is dynamic and requires manual management. Stack is faster but has limited size, while heap is slower but more flexible.",
            "Polymorphism allows objects to take multiple forms. In OOP, it enables a single interface to represent different underlying forms, improving code reusability and flexibility.",
            "Synchronous programming executes code sequentially, while asynchronous programming allows multiple operations to run concurrently. Asynchronous programming improves performance by not blocking the main thread."
        ],
        'poor_response': [
            "It's just making things into objects.",
            "It's a way to make APIs.",
            "It's making databases better.",
            "It's using Git.",
            "HTTPS is more secure than HTTP.",
            "SQL is for structured data, NoSQL isn't.",
            "It's about how fast code runs.",
            "It's for running applications.",
            "It's breaking down applications.",
            "It's about automating things.",
            "GET is for reading, POST is for writing.",
            "It's storing data temporarily.",
            "Stack is faster than heap.",
            "It's when things can be different.",
            "Async is faster than sync."
        ],
        'category': ['programming_concepts', 'web_development', 'database', 'development_tools',
                    'security', 'database_types', 'algorithms', 'devops', 'architecture', 'automation',
                    'http_methods', 'performance', 'memory_management', 'oop_concepts', 'programming_paradigms']
    }
    
    # Convert to DataFrames
    df_behavioral = pd.DataFrame(behavioral_data)
    df_technical = pd.DataFrame(technical_data)
    
    return df_behavioral, df_technical

def prepare_training_data(df):
    training_data = []
    
    for _, row in df.iterrows():
        # Add good response with label 1
        training_data.append({
            'question': row['question'],
            'response': row['good_response'],
            'label': 1,
            'category': row['category']
        })
        
        # Add poor response with label 0
        training_data.append({
            'question': row['question'],
            'response': row['poor_response'],
            'label': 0,
            'category': row['category']
        })
    
    return pd.DataFrame(training_data)

if __name__ == "__main__":
    # Create output directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Create the datasets
    df_behavioral, df_technical = create_interview_datasets()
    
    # Prepare training data
    behavioral_training = prepare_training_data(df_behavioral)
    technical_training = prepare_training_data(df_technical)
    
    # Combine datasets
    combined_training = pd.concat([behavioral_training, technical_training], ignore_index=True)
    
    # Split into train and validation sets
    train_df, val_df = train_test_split(combined_training, test_size=0.2, random_state=42)
    
    # Save datasets
    train_df.to_csv('data/interview_train.csv', index=False)
    val_df.to_csv('data/interview_val.csv', index=False)
    
    print("Datasets created and saved successfully!")
    print(f"Training set size: {len(train_df)}")
    print(f"Validation set size: {len(val_df)}") 