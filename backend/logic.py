"""
logic.py

Purpose:
This file is the brain of ZotShare.

It contains the actual app rules:
- login user
- verify event code
- create lobby
- join lobby
- deposit mock USDC/demo credits
- lock lobby
- confirm ride completion
- release escrow funds to host

Think of this file as the "kitchen."
main.py receives the request, but logic.py does the real work.

This file should:
- Import fake storage from data.py
- Update users, events, and lobbies
- Keep business rules in one place
- Use simple dictionaries and lists for MVP
- Stay happy-path focused

This file should NOT:
- Define FastAPI routes
- Define Pydantic request models
- Render frontend UI
- Use a real database yet
- Use real OAuth yet
- Use real blockchain yet

MVP rules:
- Only @uci.edu emails can log in
- New users get 50 mock USDC/demo credits
- Host creates a lobby
- Riders join the lobby
- Riders deposit mock credits into fake escrow
- Host locks the lobby
- Riders confirm completion
- Host receives escrow funds
"""


# Functions this file should contain:
#
# login_user(name, email)
# verify_event_code(event_code)
# create_lobby(host_email, pickup_location, destination, departure_time, max_riders, deposit_amount)
# get_lobbies()
# join_lobby(lobby_id, rider_email)
# deposit(lobby_id, rider_email)
# lock_lobby(lobby_id, host_email)
# confirm_completion(lobby_id, rider_email)
# release_funds(lobby_id, host_email)