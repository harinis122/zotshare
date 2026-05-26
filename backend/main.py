"""
main.py

Purpose:
This file is the API layer of the ZotShare backend.

Think of this file as the "front desk" or "waiter" of the backend.
The React frontend sends requests here, and this file forwards the work
to logic.py.

This file should:
- Create the FastAPI app
- Define backend routes like /auth/login, /lobbies, /deposit
- Accept request data using models from models.py
- Call business logic functions from logic.py
- Return results back to the frontend

This file should NOT:
- Store users/lobbies directly
- Contain complicated ride/payment logic
- Talk to a real database yet
- Talk to blockchain yet
- Handle complex errors yet

MVP goal:
Keep each route short and simple.
Route receives request → calls logic.py → returns response.
"""

# Example route style:
#
# @app.post("/auth/login")
# def login(request: LoginRequest):
#     return login_user(request.name, request.email)