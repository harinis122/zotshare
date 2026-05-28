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

System design picture:
React frontend -> main.py FastAPI routes -> logic.py ZotShare rules
-> data.py fake storage -> users, events, and lobbies.

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

import os

from data import events, lobbies, users

def find_user(email: str):
    for user in users:
        if user["email"] == email:
            return user
    return None


def find_lobby(lobby_id: int):
    for lobby in lobbies:
        if lobby["id"] == lobby_id:
            return lobby
    return None


def find_member(lobby, email: str):
    for member in lobby["members"]:
        if member["email"] == email:
            return member
    return None


def get_rider_members(lobby):
    riders = []
    for member in lobby["members"]:
        if member["role"] == "RIDER":
            riders.append(member)
    return riders


def all_riders_paid(lobby):
    riders = get_rider_members(lobby)
    if len(riders) == 0:
        return False

    for rider in riders:
        if rider["payment_status"] != "PAID":
            return False

    return True


def all_riders_confirmed(lobby):
    riders = get_rider_members(lobby)
    if len(riders) == 0:
        return False

    for rider in riders:
        if rider["payment_status"] != "PAID":
            return False
        if rider["confirmation_status"] != "CONFIRMED":
            return False

    return True


def login_user(name: str, email: str):
    if not email.endswith("@uci.edu"):
        return None

    existing_user = find_user(email)
    if existing_user:
        return existing_user

    user = {
        "id": len(users) + 1,
        "name": name,
        "email": email,
        "wallet_address": f"fake_wallet_{len(users) + 1}",
        "balance": 50,
    }
    users.append(user)
    return user


def verify_event_code(event_code: str):
    for event in events:
        if event["event_code"] == event_code:
            return event
    return None


def get_events():
    return events


def create_lobby(
    host_email: str,
    event_code: str,
    pickup_location: str,
    destination: str,
    departure_time: str,
    max_riders: int,
    deposit_amount: int,
):
    host = find_user(host_email)
    event = verify_event_code(event_code)
    if host is None or event is None:
        return None

    lobby = {
        "id": len(lobbies) + 1,
        "host_email": host_email,
        "event_code": event["event_code"],
        "event_name": event["name"],
        "event_location": event["location"],
        "pickup_location": pickup_location,
        "destination": destination,
        "departure_time": departure_time,
        "max_riders": max_riders,
        "deposit_amount": deposit_amount,
        "status": "OPEN",
        "escrow_balance": 0,
        "members": [
            {
                "email": host_email,
                "role": "HOST",
                "payment_status": "HOST_DOES_NOT_PAY",
                "confirmation_status": "HOST",
            }
        ],
    }
    lobbies.append(lobby)
    return lobby


def get_lobbies():
    return lobbies


def join_lobby(lobby_id: int, rider_email: str, event_code: str):
    lobby = find_lobby(lobby_id)
    rider = find_user(rider_email)
    if lobby is None or rider is None:
        return None

    event = verify_event_code(event_code)
    if event is None:
        return None

    if event["event_code"] != lobby["event_code"]:
        return None

    if lobby["status"] != "OPEN":
        return None

    if find_member(lobby, rider_email):
        return lobby

    rider_count = 0
    for member in lobby["members"]:
        if member["role"] == "RIDER":
            rider_count += 1

    if rider_count >= lobby["max_riders"]:
        return None

    lobby["members"].append(
        {
            "email": rider_email,
            "role": "RIDER",
            "payment_status": "NOT_PAID",
            "confirmation_status": "PENDING",
        }
    )
    return lobby


def deposit(lobby_id: int, rider_email: str):
    lobby = find_lobby(lobby_id)
    rider = find_user(rider_email)
    if lobby is None or rider is None:
        return None

    if lobby["status"] != "OPEN":
        return None

    member = find_member(lobby, rider_email)
    if member is None or member["role"] != "RIDER":
        return None

    if rider["balance"] < lobby["deposit_amount"]:
        return None

    if member["payment_status"] == "PAID":
        return lobby

    rider["balance"] -= lobby["deposit_amount"]
    lobby["escrow_balance"] += lobby["deposit_amount"]
    member["payment_status"] = "PAID"
    return lobby


def lock_lobby(lobby_id: int, host_email: str):
    lobby = find_lobby(lobby_id)
    if lobby is None or lobby["host_email"] != host_email:
        return None

    if lobby["status"] != "OPEN":
        return None

    if not all_riders_paid(lobby):
        return None

    lobby["status"] = "LOCKED"
    return lobby


def confirm_completion(lobby_id: int, rider_email: str):
    lobby = find_lobby(lobby_id)
    if lobby is None:
        return None

    if lobby["status"] != "LOCKED":
        return None

    member = find_member(lobby, rider_email)
    if member is None or member["role"] != "RIDER":
        return None

    if member["payment_status"] != "PAID":
        return None

    member["confirmation_status"] = "CONFIRMED"
    return lobby


def release_funds(lobby_id: int, host_email: str):
    lobby = find_lobby(lobby_id)
    host = find_user(host_email)
    if lobby is None or host is None or lobby["host_email"] != host_email:
        return None

    if lobby["status"] != "LOCKED":
        return None

    if not all_riders_confirmed(lobby):
        return None

    host["balance"] += lobby["escrow_balance"]
    lobby["escrow_balance"] = 0

    for member in lobby["members"]:
        if member["role"] == "RIDER" and member["payment_status"] == "PAID":
            member["payment_status"] = "RELEASED"

    lobby["status"] = "COMPLETED"
    return lobby


def insert_tokens_to_wallet(student_address: str, amount: int) -> str:
    """
    Mint MockUSDC to a real wallet address.

    This is loaded lazily so normal MVP routes like login still work even
    if blockchain dependencies or environment variables are not configured.
    """
    try:
        from dotenv import load_dotenv
        from web3 import Web3
    except ModuleNotFoundError as error:
        missing_package = error.name
        raise Exception(
            f"Missing token dependency: {missing_package}. "
            "Run `pip install -r requirements.txt` from the backend folder."
        )

    load_dotenv(dotenv_path=".env.local")

    rpc_url = "https://sepolia.base.org"
    mock_usdc_address = "0xYourDeployedMockUSDCAddressHere"
    mock_usdc_abi = [
        {
            "inputs": [
                {"internalType": "address", "name": "to", "type": "address"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"},
            ],
            "name": "mint",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function",
        },
        {
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function",
        },
    ]

    if mock_usdc_address == "0xYourDeployedMockUSDCAddressHere":
        raise Exception("MOCK_USDC_ADDRESS still needs your deployed contract address.")

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        raise Exception("Web3 failed to connect to Base Sepolia RPC endpoint.")

    private_key = os.getenv("DEPLOYER_PRIVATE_KEY")
    if not private_key:
        raise Exception("DEPLOYER_PRIVATE_KEY is missing from backend/.env.local.")

    token_contract = w3.eth.contract(
        address=w3.to_checksum_address(mock_usdc_address),
        abi=mock_usdc_abi,
    )

    checksum_to = w3.to_checksum_address(student_address)
    amount_in_wei = w3.to_wei(amount, "ether")
    backend_account = w3.eth.account.from_key(private_key)
    nonce = w3.eth.get_transaction_count(backend_account.address)

    tx_payload = token_contract.functions.mint(checksum_to, amount_in_wei).build_transaction(
        {
            "chainId": 84532,
            "gas": 100000,
            "gasPrice": w3.eth.gas_price,
            "nonce": nonce,
        }
    )

    signed_tx = w3.eth.account.sign_transaction(tx_payload, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return tx_receipt.transactionHash.hex()
