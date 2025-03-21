 INSERT INTO users (username, email, password_hash)
VALUES
  ('test_user', 'test@example.com', 'pbkdf2:sha256:123456$abcdef'),
  ('interviewer', 'interviewer@example.com', 'pbkdf2:sha256:123456$ghijkl');

INSERT INTO interview_sessions (user_id, session_type)
VALUES
  (1, 'behavioral'),
  (1, 'technical');

INSERT INTO responses (session_id, question, response_text, star_score, sentiment_score, completeness_score)
VALUES
  (1, 'Tell me about a challenging project', 'When I worked at my previous company...', 0.75, 0.8, 0.85),
  (1, 'How do you handle conflicts?', 'I believe in open communication...', 0.7, 0.75, 0.8);

INSERT INTO feedback (response_id, feedback_type, feedback_text, improvement_suggestions)
VALUES
  (1, 'STAR_analysis', 'Good use of STAR format', 'Consider adding more details about results'),
  (2, 'clarity', 'Clear communication style', 'Try to provide specific examples'); 