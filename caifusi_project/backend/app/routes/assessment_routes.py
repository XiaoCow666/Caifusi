from flask import Blueprint, request, jsonify, current_app
from app.services.auth_service import verify_firebase_token
from app.services.firestore_service import save_assessment_results, get_assessment_results
# 如果需要AI分析评估结果，也可以导入coach_service

assessment_bp = Blueprint('assessment_bp', __name__)

# 中间件：验证用户身份 (与coach_routes.py中相同，可以考虑移至公共模块)
def authenticate(f):
    """Decorator to verify Firebase ID token."""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 检查是否处于开发模式
        if current_app.config.get('DEV_MODE'):
            # 开发模式下，使用固定的测试用户ID
            kwargs['user_info'] = {'uid': 'test_user_id', 'email': 'test@example.com'}
            return f(*args, **kwargs)
        
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token is required"}), 401
        
        id_token = auth_header.split('Bearer ')[1]
        user_info, error = verify_firebase_token(id_token)
        
        if error:
            return jsonify({"error": f"Authentication failed: {error}"}), 401
        
        # Add user_info to kwargs for the wrapped function
        kwargs['user_info'] = user_info
        return f(*args, **kwargs)
    
    return decorated_function

@assessment_bp.route('/submit', methods=['POST'])
@authenticate
def submit_assessment(user_info):
    """
    Endpoint for users to submit their financial mindset assessment.
    Requires authentication.
    """
    data = request.get_json()
    assessment_data = data.get('assessment')
    
    if not assessment_data:
        return jsonify({"error": "Assessment data is required"}), 400
    
    # Basic validation - ensure we have the expected fields
    # This would be more extensive in a production app
    required_fields = ['risk_profile', 'biases']
    missing_fields = [field for field in required_fields if field not in assessment_data]
    
    if missing_fields:
        return jsonify({
            "error": f"Missing required assessment fields: {', '.join(missing_fields)}"
        }), 400
    
    # Get user ID from the authenticated user info
    user_id = user_info['uid']
    
    # Save assessment results to Firestore
    _, error = save_assessment_results(user_id, assessment_data)
    
    if error:
        return jsonify({"error": f"Failed to save assessment: {error}"}), 500
    
    return jsonify({
        "message": "Assessment submitted successfully",
        "assessment": assessment_data
    }), 200

@assessment_bp.route('/results', methods=['GET'])
@authenticate
def get_results(user_info):
    """
    Endpoint to retrieve user's assessment results.
    Requires authentication.
    """
    user_id = user_info['uid']
    
    results, error = get_assessment_results(user_id)
    
    if error:
        return jsonify({"error": f"Failed to retrieve assessment results: {error}"}), 500
    
    if not results:
        return jsonify({"error": "No assessment results found"}), 404
    
    return jsonify({"results": results}), 200 