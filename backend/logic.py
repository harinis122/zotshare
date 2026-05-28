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
from web3 import Web3
from dotenv import load_dotenv

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


def create_lobby(
    host_email: str,
    pickup_location: str,
    destination: str,
    departure_time: str,
    max_riders: int,
    deposit_amount: int,
):
    host = find_user(host_email)
    if host is None:
        return None

    lobby = {
        "id": len(lobbies) + 1,
        "host_email": host_email,
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


def join_lobby(lobby_id: int, rider_email: str):
    lobby = find_lobby(lobby_id)
    rider = find_user(rider_email)
    if lobby is None or rider is None:
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

    lobby["status"] = "LOCKED"
    return lobby


def confirm_completion(lobby_id: int, rider_email: str):
    lobby = find_lobby(lobby_id)
    if lobby is None:
        return None

    member = find_member(lobby, rider_email)
    if member is None or member["role"] != "RIDER":
        return None

    member["confirmation_status"] = "CONFIRMED"
    return lobby


def release_funds(lobby_id: int, host_email: str):
    lobby = find_lobby(lobby_id)
    host = find_user(host_email)
    if lobby is None or host is None or lobby["host_email"] != host_email:
        return None

    host["balance"] += lobby["escrow_balance"]
    lobby["escrow_balance"] = 0

    for member in lobby["members"]:
        if member["role"] == "RIDER" and member["payment_status"] == "PAID":
            member["payment_status"] = "RELEASED"

    lobby["status"] = "COMPLETED"
    return lobby

# Automatically load environmental keys from your backend/.env.local file
load_dotenv(dotenv_path=".env.local")

# 1. Establish connection to the Base Sepolia Testnet
RPC_URL = "https://sepolia.base.org"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# 2. Your Smart Contract Coordinates
# Replace this placeholder with the 0x address printed when you ran your deploy.js script
MOCK_USDC_ADDRESS = "0xYourDeployedMockUSDCAddressHere"

# 3. Paste the ABI array from your artifacts folder:
# Located at: zotshare-blockchain/artifacts/contracts/MockUSDC.sol/MockUSDC.json
MOCK_USDC_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Initialize the contract object if the connection is successful
if w3.is_connected():
    token_contract = w3.eth.contract(address=w3.to_checksum_address(MOCK_USDC_ADDRESS), abi=MOCK_USDC_ABI)
else:
    token_contract = None
    print("Warning: Web3 failed to connect to Base Sepolia RPC endpoint.")

def insert_tokens_to_wallet(student_address: str, amount: int) -> str:
    """
    Connects to the MockUSDC contract on-chain and mints tokens 
    directly into a student's wallet address.
    """
    if not token_contract:
        raise Exception("Smart contract instance not initialized. Check blockchain connection.")

    # Properly format values for the Ethereum Virtual Machine (EVM)
    checksum_to = w3.to_checksum_address(student_address)
    amount_in_wei = w3.to_wei(amount, 'ether') # Converts regular token units to 18-decimal wei
    
    # Grab the deployer private key securely from the environment configuration
    private_key = os.getenv("DEPLOYER_PRIVATE_KEY")
    if not private_key:
        raise Exception("DEPLOYER_PRIVATE_KEY is missing from your .env.local file.")
        
    backend_account = w3.eth.account.from_key(private_key)
    
    # Build the transaction payload structure
    nonce = w3.eth.get_transaction_count(backend_account.address)
    tx_payload = token_contract.functions.mint(checksum_to, amount_in_wei).build_transaction({
        'chainId': 84532, # Base Sepolia Chain ID
        'gas': 100000,
        'gasPrice': w3.eth.gas_price,
        'nonce': nonce,
    })
    
    # Sign the transaction locally using the private key and broadcast it to the network
    signed_tx = w3.eth.account.sign_transaction(tx_payload, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    # Wait for the transaction to clear a block on the network
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_receipt.transactionHash.hex()