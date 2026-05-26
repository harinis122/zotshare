"""
models.py

Purpose:
This file defines the shape of data that the frontend must send
to the backend.

Think of this file as the "blank form template."

Example:
For login, the frontend must send:
{
    "name": "Harini",
    "email": "harini@uci.edu"
}

So we create a LoginRequest model with:
- name
- email

System design picture:
React frontend sends JSON -> main.py receives it -> models.py validates
the request body shape -> logic.py does the work -> data.py stores data.

This file should:
- Use Pydantic BaseModel
- Define request classes like LoginRequest and CreateLobbyRequest
- Use simple field types like str, int, float, bool
- Use snake_case names like host_email and pickup_location

This file should NOT:
- Store users or lobbies
- Create lobbies
- Deposit money
- Call logic.py
- Contain business rules

MVP goal:
models.py only describes what information each API request needs.
"""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    name: str
    email: str


class VerifyEventRequest(BaseModel):
    event_code: str


class CreateLobbyRequest(BaseModel):
    host_email: str
    pickup_location: str
    destination: str
    departure_time: str
    max_riders: int
    deposit_amount: int


class JoinLobbyRequest(BaseModel):
    rider_email: str


class DepositRequest(BaseModel):
    rider_email: str


class ConfirmCompletionRequest(BaseModel):
    rider_email: str


class HostActionRequest(BaseModel):
    host_email: str
