import pytest
import json
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert data['service'] == 'ai-service'
    assert 'timestamp' in data

def test_query_endpoint_success(client):
    response = client.post('/api/ai/query',
                          data=json.dumps({
                              'question': 'What is calculus?',
                              'subject': 'math',
                              'userId': 1
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'answer' in data
    assert 'confidence' in data
    assert 'subject' in data
    assert data['subject'] == 'math'

def test_query_endpoint_missing_question(client):
    response = client.post('/api/ai/query',
                          data=json.dumps({
                              'subject': 'math'
                          }),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_query_endpoint_programming_subject(client):
    response = client.post('/api/ai/query',
                          data=json.dumps({
                              'question': 'What is a function?',
                              'subject': 'programming'
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['subject'] == 'programming'
    assert 'answer' in data

def test_query_endpoint_science_subject(client):
    response = client.post('/api/ai/query',
                          data=json.dumps({
                              'question': 'What is gravity?',
                              'subject': 'science'
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['subject'] == 'science'

def test_session_creation(client):
    response = client.post('/api/ai/session',
                          data=json.dumps({
                              'userId': 1
                          }),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'sessionId' in data
    assert data['userId'] == 1
    assert 'createdAt' in data

def test_get_all_sessions(client):
    client.post('/api/ai/session',
               data=json.dumps({'userId': 1}),
               content_type='application/json')
    
    response = client.get('/api/ai/sessions')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'sessions' in data
    assert isinstance(data['sessions'], list)

def test_get_user_sessions(client):
    client.post('/api/ai/session',
               data=json.dumps({'userId': 2}),
               content_type='application/json')
    
    response = client.get('/api/ai/sessions?userId=2')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert all(session['userId'] == 2 for session in data['sessions'])

def test_recommend_endpoint_success(client):
    response = client.post('/api/ai/recommend',
                          data=json.dumps({
                              'level': 'beginner',
                              'interests': ['math', 'science'],
                              'userId': 1
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'recommendations' in data
    assert isinstance(data['recommendations'], list)
    assert len(data['recommendations']) > 0

def test_recommend_endpoint_missing_level(client):
    response = client.post('/api/ai/recommend',
                          data=json.dumps({
                              'interests': ['math']
                          }),
                          content_type='application/json')
    assert response.status_code == 400

def test_recommend_endpoint_missing_interests(client):
    response = client.post('/api/ai/recommend',
                          data=json.dumps({
                              'level': 'intermediate'
                          }),
                          content_type='application/json')
    assert response.status_code == 400

def test_recommend_endpoint_advanced_level(client):
    response = client.post('/api/ai/recommend',
                          data=json.dumps({
                              'level': 'advanced',
                              'interests': ['programming'],
                              'userId': 3
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['level'] == 'advanced'
    assert any('advanced' in rec.lower() or 'complex' in rec.lower() 
              for rec in data['recommendations'])

def test_query_with_session_id(client):
    session_response = client.post('/api/ai/session',
                                   data=json.dumps({'userId': 5}),
                                   content_type='application/json')
    session_id = json.loads(session_response.data)['sessionId']
    
    response = client.post('/api/ai/query',
                          data=json.dumps({
                              'question': 'What is Python?',
                              'subject': 'programming',
                              'sessionId': session_id
                          }),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'answer' in data

def test_invalid_json(client):
    response = client.post('/api/ai/query',
                          data='invalid json',
                          content_type='application/json')
    assert response.status_code == 400

def test_cors_headers(client):
    response = client.get('/health')
    assert 'Access-Control-Allow-Origin' in response.headers
