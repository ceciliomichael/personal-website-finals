from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import uuid
import datetime
import time
import os

app = Flask(__name__)
# Enable CORS with more permissive settings for development
CORS(app, 
     resources={r"/api/*": {
         "origins": "*", 
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True
     }})

# Add a route to handle preflight requests for all API endpoints
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_preflight(path):
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# Add CORS headers to all responses
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# In-memory database fallback (will be used if MongoDB connection fails)
in_memory_db = {
    "users": [],
    "active_users": [],
    "chat_messages": []
}

# MongoDB connection settings
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://100.64.1.2:27017/')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'portfolio_db')
MONGO_CONNECT_TIMEOUT = 5000  # 5 seconds timeout

# Flag to track if we're using in-memory DB
using_in_memory_db = False

# Connect to MongoDB with better error handling
try:
    print(f"Attempting to connect to MongoDB at {MONGO_URI}...")
    client = MongoClient(
        MONGO_URI, 
        serverSelectionTimeoutMS=MONGO_CONNECT_TIMEOUT,
        connectTimeoutMS=MONGO_CONNECT_TIMEOUT
    )
    
    # Test the connection
    client.server_info()  # This will raise an exception if connection fails
    db = client[MONGO_DB_NAME]
    
    users_collection = db["users"]
    active_users_collection = db["active_users"]
    chat_messages_collection = db["chat_messages"]
    
    # Create TTL index for active users (automatically remove after 5 minutes of inactivity)
    active_users_collection.create_index("last_active", expireAfterSeconds=300)
    
    # Create index for chat messages by timestamp for efficient sorting
    chat_messages_collection.create_index("timestamp")
    
    print(f"Successfully connected to MongoDB at {MONGO_URI}!")
except Exception as e:
    using_in_memory_db = True
    print(f"Failed to connect to MongoDB: {e}")
    print("USING IN-MEMORY DATABASE FALLBACK")
    
    # Define helper functions for in-memory DB operations
    def in_memory_find_one(collection, query=None):
        if query is None:
            query = {}
        for item in in_memory_db[collection]:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                return item
        return None
        
    def in_memory_find(collection, query=None, projection=None, sort_key=None, sort_dir=1, limit=None):
        if query is None:
            query = {}
        results = []
        for item in in_memory_db[collection]:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                # Apply projection if provided
                if projection:
                    projected_item = {}
                    for proj_key, include in projection.items():
                        if include and proj_key in item:
                            projected_item[proj_key] = item[proj_key]
                        elif proj_key == '_id' and not include:
                            # Skip _id field
                            continue
                    results.append(projected_item)
                else:
                    results.append(item.copy())
        
        # Sort if required
        if sort_key:
            results.sort(key=lambda x: x.get(sort_key, ''), reverse=(sort_dir == -1))
            
        # Apply limit if specified
        if limit and len(results) > limit:
            results = results[:limit]
            
        return results
    
    def in_memory_insert_one(collection, document):
        # Add _id if not present
        if '_id' not in document:
            document['_id'] = str(uuid.uuid4())
            
        # Add to collection
        in_memory_db[collection].append(document)
        
        # Return a mock result
        class MockInsertResult:
            def __init__(self, id):
                self.inserted_id = id
                
        return MockInsertResult(document['_id'])
    
    def in_memory_update_one(collection, query, update, upsert=False):
        item = in_memory_find_one(collection, query)
        
        if item:
            # Apply updates
            if '$set' in update:
                for key, value in update['$set'].items():
                    item[key] = value
        elif upsert:
            # Create new document
            new_doc = {}
            for key, value in query.items():
                new_doc[key] = value
                
            if '$set' in update:
                for key, value in update['$set'].items():
                    new_doc[key] = value
                    
            in_memory_insert_one(collection, new_doc)
        
        # Return a mock result
        class MockUpdateResult:
            def __init__(self):
                self.modified_count = 1 if item else 0
                self.upserted_id = None if item else "mock_id"
                
        return MockUpdateResult()
    
    def in_memory_count_documents(collection, query=None):
        if query is None:
            query = {}
        return len(in_memory_find(collection, query))
    
    def in_memory_delete_one(collection, query):
        for i, item in enumerate(in_memory_db[collection]):
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                in_memory_db[collection].pop(i)
                break
                
        # Return a mock result
        class MockDeleteResult:
            def __init__(self):
                self.deleted_count = 1
                
        return MockDeleteResult()
    
    def in_memory_create_index(collection, field, **kwargs):
        # Just a no-op for the in-memory DB
        pass

# Maximum number of chat messages to keep
MAX_CHAT_MESSAGES = 20

@app.route('/api/user', methods=['POST'])
def create_or_find_user():
    data = request.json
    user_name = data.get('name')
    
    if not user_name:
        return jsonify({"error": "Name is required"}), 400
    
    try:
        if using_in_memory_db:
            # Check if user already exists
            existing_user = in_memory_find_one("users", {"name": user_name})
            
            if existing_user:
                # Return error if name already exists
                return jsonify({"error": "Username already taken. Please choose a different name."}), 409
            
            # Create new user with UDID
            new_user = {
                "name": user_name,
                "udid": str(uuid.uuid4()),
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            
            result = in_memory_insert_one("users", new_user)
            new_user['_id'] = str(result.inserted_id)
        else:
            # Check if user already exists
            existing_user = users_collection.find_one({"name": user_name})
            
            if existing_user:
                # Return error if name already exists
                return jsonify({"error": "Username already taken. Please choose a different name."}), 409
            
            # Create new user with UDID
            new_user = {
                "name": user_name,
                "udid": str(uuid.uuid4()),
                "created_at": datetime.datetime.utcnow()
            }
            
            result = users_collection.insert_one(new_user)
            new_user['_id'] = str(result.inserted_id)
        
        return jsonify(new_user), 201
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/user/<udid>', methods=['GET'])
def get_user_by_udid(udid):
    try:
        if using_in_memory_db:
            user = in_memory_find_one("users", {"udid": udid})
        else:
            user = users_collection.find_one({"udid": udid})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Convert ObjectId to string for JSON serialization if needed
        if not isinstance(user['_id'], str):
            user['_id'] = str(user['_id'])
            
        return jsonify(user)
    except Exception as e:
        print(f"Error getting user: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/users/active', methods=['POST'])
def update_active_user():
    try:
        data = request.json
        udid = data.get('udid')
        user_name = data.get('name')
        
        if not udid or not user_name:
            return jsonify({"error": "UDID and name are required"}), 400
        
        current_time = datetime.datetime.utcnow()
        
        if using_in_memory_db:
            # Update or insert active user
            in_memory_update_one(
                "active_users",
                {"udid": udid},
                {
                    "$set": {
                        "name": user_name,
                        "last_active": current_time.isoformat()
                    }
                },
                upsert=True
            )
        else:
            # Update or insert active user
            active_users_collection.update_one(
                {"udid": udid},
                {
                    "$set": {
                        "name": user_name,
                        "last_active": current_time
                    }
                },
                upsert=True
            )
        
        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"Error updating active user: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/users/active', methods=['GET'])
def get_active_users():
    try:
        if using_in_memory_db:
            # In memory, manually filter expired users (older than 5 minutes)
            five_min_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
            active_users = []
            
            for user in in_memory_db["active_users"]:
                if "last_active" in user:
                    last_active = datetime.datetime.fromisoformat(user["last_active"])
                    if last_active > five_min_ago:
                        active_users.append({"udid": user["udid"], "name": user["name"]})
        else:
            # Get all active users
            active_users = list(active_users_collection.find({}, {"_id": 0, "udid": 1, "name": 1}))
        
        return jsonify(active_users)
    except Exception as e:
        print(f"Error getting active users: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/chat/messages', methods=['GET'])
def get_chat_messages():
    try:
        if using_in_memory_db:
            # Get most recent messages, sorted by timestamp
            messages = in_memory_find(
                "chat_messages",
                projection={"_id": 0},
                sort_key="timestamp",
                sort_dir=-1,
                limit=MAX_CHAT_MESSAGES
            )
            
            # Reverse to get chronological order (oldest first)
            messages.reverse()
        else:
            # Get most recent messages, sorted by timestamp
            messages = list(chat_messages_collection.find({}, {"_id": 0})
                        .sort("timestamp", -1)
                        .limit(MAX_CHAT_MESSAGES))
            
            # Reverse to get chronological order (oldest first)
            messages.reverse()
        
        return jsonify(messages)
    except Exception as e:
        print(f"Error getting chat messages: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/chat/messages', methods=['POST'])
def add_chat_message():
    try:
        print("Received message POST request")
        data = request.json
        print(f"Request data: {data}")
        
        if not data:
            print("No JSON data provided")
            return jsonify({"error": "No JSON data provided"}), 400
            
        if not data.get('user') or not data.get('message'):
            print(f"Missing required fields. User: {data.get('user')}, Message: {data.get('message')}")
            return jsonify({"error": "User and message are required"}), 400
        
        current_time = datetime.datetime.utcnow()
        
        # Create new message
        new_message = {
            "user": data.get('user'),
            "message": data.get('message'),
            "udid": data.get('udid', ''),
            "timestamp": current_time
        }
        print(f"Created new message object: {new_message}")
        
        if using_in_memory_db:
            # Insert new message
            print("Inserting message into in-memory storage")
            new_message["timestamp"] = current_time.isoformat()  # Convert to string for in-memory storage
            result = in_memory_insert_one("chat_messages", new_message)
            print(f"Insert result: {result.inserted_id}")
            
            # Get total count of messages
            print("Counting messages")
            count = in_memory_count_documents("chat_messages")
            print(f"Total message count: {count}")
            
            # If we exceed our limit, delete the oldest messages
            if count > MAX_CHAT_MESSAGES:
                print(f"Message count {count} exceeds limit {MAX_CHAT_MESSAGES}, deleting oldest messages")
                # Find the oldest messages to delete
                oldest_messages = in_memory_find(
                    "chat_messages",
                    sort_key="timestamp",
                    sort_dir=1,
                    limit=count - MAX_CHAT_MESSAGES
                )
                
                # Delete them
                for msg in oldest_messages:
                    print(f"Deleting old message: {msg.get('_id')}")
                    in_memory_delete_one("chat_messages", {"_id": msg["_id"]})
                    
            # Prepare response object - already handled in memory version
            response_message = new_message
        else:
            # Insert new message
            print("Inserting message into MongoDB")
            result = chat_messages_collection.insert_one(new_message)
            print(f"Insert result: {result.inserted_id}")
            
            # Get total count of messages
            print("Counting messages")
            count = chat_messages_collection.count_documents({})
            print(f"Total message count: {count}")
            
            # If we exceed our limit, delete the oldest messages
            if count > MAX_CHAT_MESSAGES:
                print(f"Message count {count} exceeds limit {MAX_CHAT_MESSAGES}, deleting oldest messages")
                # Find the oldest messages to delete
                oldest_messages = list(chat_messages_collection.find()
                                 .sort("timestamp", 1)
                                 .limit(count - MAX_CHAT_MESSAGES))
                
                # Delete them
                for msg in oldest_messages:
                    print(f"Deleting old message: {msg.get('_id')}")
                    chat_messages_collection.delete_one({"_id": msg["_id"]})
            
            # Create a copy of the message for the response
            response_message = new_message.copy()
            
            # Convert the ObjectId to string if it exists (MongoDB adds this)
            if '_id' in response_message:
                response_message['_id'] = str(response_message['_id'])
            
            # Convert the timestamp to ISO format for JSON serialization
            response_message["timestamp"] = response_message["timestamp"].isoformat()
        
        print("Returning success response")
        return jsonify(response_message), 201
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error adding chat message: {e}")
        print(f"Traceback: {error_traceback}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.json
        
        if not data.get('name') or not data.get('email') or not data.get('message'):
            return jsonify({"error": "Name, email, and message are required"}), 400
        
        current_time = datetime.datetime.utcnow()
        
        feedback = {
            "name": data.get('name'),
            "email": data.get('email'),
            "message": data.get('message'),
            "rating": data.get('rating', 0),
            "udid": data.get('udid'),
            "created_at": current_time
        }
        
        if using_in_memory_db:
            # Convert datetime to string for in-memory storage
            feedback["created_at"] = current_time.isoformat()
            in_memory_insert_one("feedback", feedback)
        else:
            db["feedback"].insert_one(feedback)
        
        return jsonify({"status": "success"}), 201
    except Exception as e:
        print(f"Error submitting feedback: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Add a test endpoint to verify MongoDB connection
@app.route('/api/test-db', methods=['GET'])
def test_database():
    try:
        if using_in_memory_db:
            # Test in-memory DB
            collections = {
                "users": len(in_memory_db["users"]),
                "active_users": len(in_memory_db["active_users"]),
                "chat_messages": len(in_memory_db["chat_messages"])
            }
            return jsonify({
                "status": "success",
                "message": "Using in-memory database fallback",
                "collections": collections
            }), 200
        else:
            # Test MongoDB connection
            result = db.command("ping")
            # Get collections stats
            collections = {
                "users": users_collection.count_documents({}),
                "active_users": active_users_collection.count_documents({}),
                "chat_messages": chat_messages_collection.count_documents({})
            }
            return jsonify({
                "status": "success",
                "message": "MongoDB connection is working",
                "ping_result": result,
                "collections": collections
            }), 200
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        return jsonify({
            "status": "error",
            "message": f"Database error: {str(e)}",
            "traceback": error_traceback
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 