import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import uuid
import time

app = Flask(__name__)
CORS(app)

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')
db = client['portfolio_app']
users_collection = db['users']
messages_collection = db['messages']

# Route to create or find a user
@app.route('/user', methods=['POST'])
def create_or_find_user():
    try:
        data = request.json
        user_name = data.get('name', '').strip()
        
        if not user_name:
            return jsonify({'error': 'Username is required'}), 400
        
        # Check if username already exists
        existing_user = users_collection.find_one({'name': user_name})
        if existing_user:
            return jsonify({'error': 'Username already taken'}), 409
            
        # Create new user
        current_time = datetime.now()
        user_data = {
            'name': user_name,
            'udid': str(uuid.uuid4()),
            'created_at': current_time,
            'last_active': current_time
        }
        
        users_collection.insert_one(user_data)
        
        # Remove _id from the response
        user_data.pop('_id', None)
        
        return jsonify(user_data)
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({'error': str(e)}), 500

# Route to get a user by UDID
@app.route('/user/<udid>', methods=['GET'])
def get_user(udid):
    try:
        user = users_collection.find_one({'udid': udid})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Remove _id from the response
        user.pop('_id', None)
        
        return jsonify(user)
    except Exception as e:
        print(f"Error retrieving user: {e}")
        return jsonify({'error': str(e)}), 500

# Route to update user's last active timestamp
@app.route('/user/<udid>/activity', methods=['PUT'])
def update_activity(udid):
    try:
        users_collection.update_one(
            {'udid': udid},
            {'$set': {'last_active': datetime.now()}}
        )
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Error updating activity: {e}")
        return jsonify({'error': str(e)}), 500

# Route to get active users (active in the last 5 minutes)
@app.route('/users/active', methods=['GET'])
def get_active_users():
    try:
        active_time = datetime.now().timestamp() - (5 * 60)  # 5 minutes ago
        active_users = list(users_collection.find(
            {'last_active': {'$gte': datetime.fromtimestamp(active_time)}}
        ))
        
        # Remove _id from the response
        for user in active_users:
            user.pop('_id', None)
            
        return jsonify(active_users)
    except Exception as e:
        print(f"Error retrieving active users: {e}")
        return jsonify({'error': str(e)}), 500

# Route to submit feedback
@app.route('/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'email', 'message', 'rating']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
                
        # Add timestamp and ID
        data['timestamp'] = datetime.now()
        data['id'] = str(uuid.uuid4())
        
        # Store in MongoDB (if we had a feedback collection)
        # feedback_collection.insert_one(data)
        
        return jsonify({'status': 'success', 'id': data['id']})
    except Exception as e:
        print(f"Error submitting feedback: {e}")
        return jsonify({'error': str(e)}), 500

# Route to send a message
@app.route('/messages', methods=['POST'])
def send_message():
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('udid') or not data.get('message') or not data.get('userName'):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Check if user exists
        user = users_collection.find_one({'udid': data['udid']})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Create message document
        message = {
            'id': str(uuid.uuid4()),
            'udid': data['udid'],
            'userName': data['userName'],
            'message': data['message'],
            'timestamp': datetime.now()
        }
        
        # Insert message
        messages_collection.insert_one(message)
        
        # Limit to 20 messages by removing oldest if needed
        total_messages = messages_collection.count_documents({})
        if total_messages > 20:
            # Find and delete oldest messages
            oldest_messages = list(messages_collection.find().sort('timestamp', 1).limit(total_messages - 20))
            for old_msg in oldest_messages:
                messages_collection.delete_one({'_id': old_msg['_id']})
                
        # Remove _id from response
        message.pop('_id', None)
        # Convert datetime to string for JSON serialization
        message['timestamp'] = message['timestamp'].isoformat()
        
        return jsonify(message)
    except Exception as e:
        print(f"Error sending message: {e}")
        return jsonify({'error': str(e)}), 500

# Route to get recent messages
@app.route('/messages', methods=['GET'])
def get_messages():
    try:
        # Get the 20 most recent messages
        recent_messages = list(messages_collection.find().sort('timestamp', -1).limit(20))
        
        # Clean up for response and reverse to show in chronological order
        for message in recent_messages:
            message.pop('_id', None)
            message['timestamp'] = message['timestamp'].isoformat()
            
        # Return messages in chronological order (oldest first)
        return jsonify(recent_messages[::-1])
    except Exception as e:
        print(f"Error retrieving messages: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 