"""
main.py

Purpose:
This file is the API layer of the ZotShare backend.

Think of this file as the "front desk" or "waiter" of the backend.
The React frontend sends requests here, and this file forwards the work
to logic.py.

System design picture:
React sends JSON API requests -> main.py receives them -> models.py
defines request shapes -> logic.py does the work -> data.py stores
fake users, events, and lobbies.

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
Route receives request -> calls logic.py -> returns response.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from logic import (
    confirm_completion,
    create_lobby,
    deposit,
    get_lobbies,
    join_lobby,
    lock_lobby,
    login_user,
    release_funds,
    verify_event_code,
)
from models import (
    ConfirmCompletionRequest,
    CreateLobbyRequest,
    DepositRequest,
    HostActionRequest,
    JoinLobbyRequest,
    LoginRequest,
    VerifyEventRequest,
)


app = FastAPI(title="ZotShare MVP Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "ZotShare backend is running"}


@app.post("/auth/login")
def login(request: LoginRequest):
    user = login_user(request.name, request.email)
    if user is None:
        raise HTTPException(status_code=403, detail="Only UCI emails are allowed")
    return user


@app.post("/events/verify")
def verify_event(request: VerifyEventRequest):
    event = verify_event_code(request.event_code)
    if event is None:
        raise HTTPException(status_code=404, detail="Event code not found")
    return event


@app.post("/lobbies")
def create_lobby_route(request: CreateLobbyRequest):
    lobby = create_lobby(
        request.host_email,
        request.pickup_location,
        request.destination,
        request.departure_time,
        request.max_riders,
        request.deposit_amount,
    )
    if lobby is None:
        raise HTTPException(status_code=404, detail="Host not found")
    return lobby


@app.get("/lobbies")
def list_lobbies():
    return get_lobbies()


@app.post("/lobbies/{lobby_id}/join")
def join_lobby_route(lobby_id: int, request: JoinLobbyRequest):
    lobby = join_lobby(lobby_id, request.rider_email)
    if lobby is None:
        raise HTTPException(status_code=400, detail="Could not join lobby")
    return lobby


@app.post("/lobbies/{lobby_id}/deposit")
def deposit_route(lobby_id: int, request: DepositRequest):
    lobby = deposit(lobby_id, request.rider_email)
    if lobby is None:
        raise HTTPException(status_code=400, detail="Could not deposit credits")
    return lobby


@app.post("/lobbies/{lobby_id}/lock")
def lock_lobby_route(lobby_id: int, request: HostActionRequest):
    lobby = lock_lobby(lobby_id, request.host_email)
    if lobby is None:
        raise HTTPException(status_code=400, detail="Could not lock lobby")
    return lobby


@app.post("/lobbies/{lobby_id}/confirm")
def confirm_completion_route(lobby_id: int, request: ConfirmCompletionRequest):
    lobby = confirm_completion(lobby_id, request.rider_email)
    if lobby is None:
        raise HTTPException(status_code=400, detail="Could not confirm ride")
    return lobby


@app.post("/lobbies/{lobby_id}/release")
def release_funds_route(lobby_id: int, request: HostActionRequest):
    lobby = release_funds(lobby_id, request.host_email)
    if lobby is None:
        raise HTTPException(status_code=400, detail="Could not release funds")
    return lobby
