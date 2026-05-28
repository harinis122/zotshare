"""
data.py

Purpose:
This file is the fake database for the ZotShare MVP.

Think of this file as a temporary notebook.

For now, we store data in Python lists:
- users
- events
- lobbies

This lets us build and test the backend without setting up Supabase,
PostgreSQL, or any real database.

System design picture:
React frontend -> main.py routes -> logic.py rules -> data.py fake storage

Important:
This data disappears when the backend server restarts.
That is okay for the MVP.

This file should:
- Store fake in-memory lists
- Include hardcoded demo events
- Stay very simple

This file should NOT:
- Contain business logic
- Define API routes
- Use FastAPI
- Use Supabase yet
- Use file saving yet
- Use blockchain yet
"""


users = []

events = [
    {
        "id": 1,
        "name": "Beach Party",
        "event_code": "BEACH2026",
        "location": "Corona del Mar State Beach",
    },
    {
        "id": 2,
        "name": "End of Year Party",
        "event_code": "EOY2026",
        "location": "UCI Student Center",
    },
]

lobbies = []
