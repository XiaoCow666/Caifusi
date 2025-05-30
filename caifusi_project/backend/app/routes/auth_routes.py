from flask import Blueprint, request, jsonify, current_app
from app.services.auth_service import verify_firebase_token
# from app.services.firestore_service import get_user_profile # Already handled in verify_firebase_token

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/verify_token', methods=['POST'])
def verify_token_route():
    """
    Endpoint for frontend to send Firebase ID token for verification.
    This can also serve as a login/session creation endpoint.
    """
    # 开发模式下的模拟认证
    if current_app.config.get('DEV_MODE'):
        return jsonify({
            "message": "Token verified successfully (DEV MODE)",
            "user": {
                "uid": "test_user_id",
                "email": "test@example.com",
                "profile": {
                    "displayName": "测试用户",
                    "email": "test@example.com",
                    "createdAt": "2023-01-01T00:00:00Z",
                    "lastLogin": "2023-01-01T00:00:00Z",
                    "assessmentCompleted": False,
                    "goals": []
                }
            }
        }), 200
        
    data = request.get_json()
    id_token = data.get('idToken')

    if not id_token:
        return jsonify({"error": "ID token is required"}), 400

    user_info, error = verify_firebase_token(id_token)

    if error:
        return jsonify({"error": error}), 401 # Unauthorized or Bad Request depending on error

    # Token verified, user_info contains uid, email, and profile
    # You might want to set a session cookie here if using traditional sessions,
    # or just rely on the frontend to keep sending the ID token for authenticated requests.
    # For simplicity, we'll assume frontend sends token with each request.
    return jsonify({"message": "Token verified successfully", "user": user_info}), 200

# Example: Get current user profile (requires token)
@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    # 开发模式下的模拟用户
    if current_app.config.get('DEV_MODE'):
        return jsonify({
            "user": {
                "displayName": "测试用户",
                "email": "test@example.com",
                "createdAt": "2023-01-01T00:00:00Z",
                "lastLogin": "2023-01-01T00:00:00Z",
                "assessmentCompleted": False,
                "goals": []
            }
        }), 200
        
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization token is required"}), 401
    
    id_token = auth_header.split('Bearer ')[1]
    user_info, error = verify_firebase_token(id_token) # Verifies and fetches profile

    if error:
        return jsonify({"error": f"Authentication failed: {error}"}), 401
    
    # user_info already contains the profile from Firestore
    return jsonify({"user": user_info.get("profile", {})}), 200 