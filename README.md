# ZotShare
ZotShare is a Web3-powered student rideshare coordination app for UCI students. It helps verified students leaving the same event find each other, share an Uber/Lyft, and use blockchain escrow to make sure everyone commits funds before the ride starts.

## Problem
Students often leave parties or events alone and pay full price for Uber/Lyft, even when other students nearby are going to the same place. If one student calls the ride, they also risk others not paying them back.

## Solution
ZotShare creates event-based ride lobbies where UCI students can join a shared ride. Each rider deposits mock USDC into a smart contract escrow. The host only receives the funds after the ride is completed and confirmed.

## Key Features
- UCI-only login using `@uci.edu` email
- Event-based ride lobbies
- Create or join a shared ride
- Embedded wallet for easy Web3 onboarding
- Mock USDC test token
- Smart contract escrow
- Refunds if the host cancels
- Receipt upload and ride confirmation
- Uber/Lyft handoff through deep links

## Why Blockchain?

Blockchain is used as a trustless lockbox.

Instead of riders paying the host directly, funds are held in escrow:
Rider deposits funds -> Smart contract holds funds -> Ride completes -> Host receives payout

Rider deposits funds -> Smart contract holds funds -> Ride happens -> Riders confirm completion -> Smart contract pays the host

## Running the MVP Locally

This repo currently contains a simple demo MVP.

The MVP uses:
- a FastAPI backend
- a React/Vite frontend
- fake in-memory data
- mock USDC/demo credits

It does not use a real database, real OAuth, real wallets, real USDC, or a real smart contract yet.

### 1. Start the Backend

From the project root:

Mac/Linux:

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --reload
```

Windows:

```bash
cd backend
py -m pip install -r requirements.txt
py -m uvicorn main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

You can test backend routes in the FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

### 2. Start the Frontend

Open a second terminal.

From the project root:

Mac/Linux and Windows:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://127.0.0.1:5173/
```

Keep both servers running at the same time:

```text
Frontend: http://127.0.0.1:5173/
Backend:  http://127.0.0.1:8000/
```

The frontend calls the backend URL in:

```text
frontend/src/api.js
```

### Demo Flow

Use the app in this order:

1. Log in with a `@uci.edu` email.
2. Verify the demo event code: `VENUS2026`.
3. Create a ride lobby.
4. Log in as another UCI user in a different browser/session to join as a rider.
5. Join the lobby.
6. Deposit mock credits.
7. Host locks the lobby.
8. Rider confirms the ride happened.
9. Host releases funds.

### Resetting Demo Data

Users and lobbies are stored in memory.

That means all demo data resets when the backend server restarts.
