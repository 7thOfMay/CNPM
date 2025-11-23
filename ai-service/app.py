from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory storage for demo purposes
tutoring_sessions = []
ai_responses = {
    "math": "I can help you with algebra, geometry, calculus, and statistics.",
    "science": "I can assist with physics, chemistry, biology, and earth science.",
    "programming": "I can guide you through Python, JavaScript, Java, and more.",
    "default": "I'm here to help! What subject would you like to learn about?"
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ai-service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ai/query', methods=['POST'])
def ai_query():
    """Process AI tutoring queries"""
    try:
        data = request.get_json()
        question = data.get('question', '')
        subject = data.get('subject', 'default').lower()
        
        # Simple keyword matching for demo
        response_text = ai_responses.get(subject, ai_responses['default'])
        
        if any(word in question.lower() for word in ['help', 'explain', 'what', 'how']):
            response_text = f"{response_text} You asked: '{question}'. Let me help you understand this better."
        
        response = {
            'answer': response_text,
            'subject': subject,
            'timestamp': datetime.now().isoformat(),
            'confidence': 0.85
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/ai/sessions', methods=['GET', 'POST'])
def handle_sessions():
    """Handle tutoring sessions"""
    if request.method == 'GET':
        return jsonify({'sessions': tutoring_sessions}), 200
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            session = {
                'id': len(tutoring_sessions) + 1,
                'student_id': data.get('student_id'),
                'subject': data.get('subject'),
                'created_at': datetime.now().isoformat(),
                'status': 'active'
            }
            tutoring_sessions.append(session)
            return jsonify(session), 201
        
        except Exception as e:
            return jsonify({'error': str(e)}), 400

@app.route('/api/ai/recommend', methods=['POST'])
def get_recommendations():
    """Get AI-powered learning recommendations"""
    try:
        data = request.get_json()
        student_level = data.get('level', 'beginner')
        interests = data.get('interests', [])
        
        recommendations = [
            {
                'topic': 'Introduction to ' + interest.capitalize(),
                'difficulty': student_level,
                'duration': '30 minutes',
                'type': 'interactive'
            }
            for interest in interests[:3]
        ]
        
        return jsonify({'recommendations': recommendations}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
