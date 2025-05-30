from firebase_admin import auth
from .firestore_service import create_user_profile, get_user_profile, update_user_profile

def verify_firebase_token(id_token):
    """Verifies Firebase ID token and returns user info."""
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        
        # Check if user profile exists in Firestore, create if not
        profile, error = get_user_profile(uid)
        if error and "User not found" in error: # Be careful with string matching for errors
            profile_id, create_error = create_user_profile(uid, email)
            if create_error:
                return None, f"Failed to create user profile: {create_error}"
            profile, _ = get_user_profile(uid) # Fetch again
        elif error:
            return None, f"Error fetching user profile: {error}"
        else:
            # Update last login time
            _, update_error = update_user_profile(uid, {"lastLogin": auth.firestore.SERVER_TIMESTAMP})
            if update_error:
                print(f"Warning: Failed to update last login for user {uid}: {update_error}")


        return {"uid": uid, "email": email, "profile": profile}, None
    except auth.InvalidIdTokenError:
        return None, "Invalid ID token"
    except Exception as e:
        return None, str(e)

# If you were to implement custom registration (not recommended with Firebase Auth for client):
# def register_user_custom(email, password):
#     try:
#         # This is for creating users directly via Admin SDK, typically client SDK handles this
#         user = auth.create_user(email=email, password=password)
#         # Create profile in Firestore
#         profile_id, error = create_user_profile(user.uid, email)
#         if error:
#             # Potentially delete the Firebase Auth user if profile creation fails, or handle inconsistency
#             auth.delete_user(user.uid)
#             return None, f"Failed to create user profile: {error}"
#         return {"uid": user.uid, "email": user.email}, None
#     except Exception as e:
#         return None, str(e) 