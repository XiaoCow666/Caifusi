import google.generativeai as genai
from flask import current_app
from .firestore_service import save_coach_message, get_coach_history

def configure_gemini():
    """Configures the Gemini API key."""
    api_key = current_app.config.get('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured.")
    genai.configure(api_key=api_key)

def generate_coach_response(user_id, user_message_text, context_type="general_chat"):
    """
    Generates a response from the AI coach using Gemini.
    Saves user message and AI response to Firestore.
    """
    try:
        configure_gemini() # Ensure Gemini is configured
    except ValueError as e:
        return f"AI教练配置错误: {e}", True # True indicates an error

    # 1. Save user's message to history
    _, error = save_coach_message(user_id, {"sender": "user", "text": user_message_text})
    if error:
        print(f"Error saving user message for {user_id}: {error}")
        # Decide if you want to proceed without saving or return an error

    # 2. Retrieve recent conversation history (optional, but good for context)
    history_messages, history_error = get_coach_history(user_id, limit=10) # Get last 10 messages (user and AI)
    if history_error:
        print(f"Warning: Could not retrieve chat history for {user_id}: {history_error}")
        # Proceed without history or handle error

    # 3. Construct prompt for Gemini
    # Prompt Engineering is CRITICAL here.
    # Base prompt defining the AI's persona and role.
    base_prompt = "你是一位名叫\"财赋思\"的AI金融心智教练。你的目标是帮助用户提升金融素养，识别并克服常见的金融认知偏差，培养健康的理财习惯，并以友好、耐心、专业的态度提供个性化指导。请避免直接给出投资建议（例如\"购买某某股票\"），而是侧重于教育用户如何思考和决策。\n\n"

    # Add context from conversation history
    formatted_history = []
    if history_messages:
        for msg in history_messages:
            role = "user" if msg.get("sender") == "user" else "model" # Gemini uses 'user' and 'model'
            # Ensure 'parts' is a list of dictionaries with 'text'
            formatted_history.append({"role": role, "parts": [{"text": msg.get("text", "")}]})
    
    # Add current user message to the history for the prompt
    # The API expects the current user message as the last 'user' part.
    # If history is empty, formatted_history will be empty.
    # The final prompt to generateContent will be `formatted_history` (which includes past turns)
    # followed by the new user message part.

    # Construct the payload for generateContent
    # Gemini API expects `contents` to be a list of turns, where each turn has a role and parts.
    # The last part should be the current user's message.
    
    # Start with the base persona if no history or as a system instruction (depends on model)
    # For gemini-pro, you can prepend system instructions or include them in the first user turn.
    # A more robust way is to use system_instruction if the model supports it.
    # For now, let's prepend to the history or first user message.

    # Create the full list of contents for the API call
    api_contents = []
    # Add persona/system instruction (if not using dedicated system_instruction field)
    # One way: Treat the base_prompt as a system message or part of the first user message context.
    # For conversational models, it's often better to let the history build naturally.
    # Let's try adding it as context to the first message or as a "system" role if supported.
    # Gemini's `generateContent` with `contents` typically alternates user/model.

    # If there's history, prepend our base_prompt to the history or ensure it's implicitly understood.
    # For simplicity, we'll add it to the user's current message context for this call.
    # A better approach for long-term context is to use a specific system prompt mechanism if available
    # or fine-tune a model.

    # Let's build the `contents` for the API call
    # `formatted_history` already contains past user/model messages
    # The new user message should be the last item.
    
    current_user_turn = {
        "role": "user", 
        "parts": [
            {
                "text": base_prompt + "\n---对话历史---\n" + user_message_text if not formatted_history else user_message_text
            }
        ]
    }

    if not formatted_history:
        # If no history, the current user message is the start, include base prompt
        api_contents = [current_user_turn]
    else:
        api_contents = formatted_history + [current_user_turn]


    # For specific context_types, you can add more instructions:
    if context_type == "assessment_feedback":
        # (Assume assessment_results are fetched and passed here)
        # prompt += f"\n用户刚完成了金融心智评估，结果显示[相关结果]。请基于此提供初步反馈和鼓励。"
        pass # Add specific instructions to the current_user_turn.parts[0].text
    elif context_type == "decision_support_spending":
        # prompt += f"\n用户正在考虑一笔消费，请帮助TA分析，并注意提醒可能的冲动消费或认知偏差。"
        pass

    try:
        # 更新为使用 Gemini 2.5 Flash 模型
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # print(f"DEBUG: Sending to Gemini API. Contents: {api_contents}")

        response = model.generate_content(
            api_contents,
            # generation_config=genai.types.GenerationConfig(...) # Optional: temperature, top_k, etc.
        )
        
        # print(f"DEBUG: Gemini API Response: {response}")

        ai_response_text = ""
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            ai_response_text = "".join(part.text for part in response.candidates[0].content.parts)
        else:
            # Handle cases where the response structure is unexpected or content is missing
            # Check response.prompt_feedback for blocked prompts
            if response.prompt_feedback:
                print(f"DEBUG: Prompt Feedback: {response.prompt_feedback}")
                ai_response_text = "抱歉，我无法回答这个问题。可能触发了安全设置。"
            else:
                ai_response_text = "抱歉，AI教练暂时无法回应，请稍后再试。"


    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        ai_response_text = "抱歉，AI教练遇到技术问题，请稍后再试。"
        # 4. Save AI's error response to history
        save_coach_message(user_id, {"sender": "ai", "text": ai_response_text, "error": True})
        return ai_response_text, True

    # 4. Save AI's response to history
    _, error = save_coach_message(user_id, {"sender": "ai", "text": ai_response_text})
    if error:
        print(f"Error saving AI response for {user_id}: {error}")
        # Decide how to handle this, the user already got the response

    return ai_response_text, False # False indicates no error in generation 