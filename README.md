# ZotShare

ZotShare is a simple MVP for coordinating shared rides after UCI events.

The current demo shows the happy-path flow:

```text
UCI login
-> host selects an event and creates a ride lobby
-> rider verifies the matching private event code
-> rider joins the lobby
-> rider deposits mock credits
-> host locks the ride after all riders deposit
-> riders confirm the ride happened
-> host releases escrow
-> lobby is completed
```

This is a demo MVP, not a production system.

## Current MVP Scope

The app currently uses:

- FastAPI backend
- React/Vite frontend
- Pydantic request models
- fake in-memory users, events, and lobbies
- mock USDC/demo credits
- fake escrow logic

The main ride flow does not use:

- a real database
- real UCI OAuth
- real wallets
- real USDC
- real blockchain escrow
- real Uber/Lyft APIs
- real payment processing

There is an experimental token insert endpoint in the backend, but the main MVP flow works with fake credits.

## Project Structure

```text
zotshare/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── logic.py
│   ├── data.py
│   └── requirements.txt
│
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx
        ├── api.js
        ├── main.jsx
        └── styles.css
```

## Backend Setup

Open a terminal from the project root:

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --reload
```

On Windows, use:

```bash
cd backend
py -m pip install -r requirements.txt
py -m uvicorn main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

FastAPI docs are available at:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

The frontend usually runs at:

```text
http://127.0.0.1:5173/
```

Keep both servers running at the same time:

```text
Backend:  http://127.0.0.1:8000/
Frontend: http://127.0.0.1:5173/
```

The frontend backend URL is configured in:

```text
frontend/src/api.js
```

## Demo Flow

Use the app in this order:

1. Log in with a `@uci.edu` email.
2. As the host, create a lobby and select the event from the dropdown.
3. As a rider, verify the private event code shared by the organizer.
4. Join the lobby only after verifying the matching event code.
5. Each rider deposits mock credits.
6. The host locks the lobby after all joined riders have deposited.
7. Riders confirm the ride happened after the lobby is locked.
8. The host releases funds after all riders confirm.
9. Escrow becomes `0` and the lobby status becomes `COMPLETED`.

## Demo Data

Demo events are stored in:

```text
backend/data.py
```

Users and lobbies are stored in memory.

This means demo data resets whenever the backend server restarts.

## Useful Commands

Run backend:

```bash
cd backend
python3 -m uvicorn main:app --reload
```

Run frontend:

```bash
cd frontend
npm run dev
```

Build frontend:

```bash
cd frontend
npm run build
```

Check backend syntax:

```bash
python3 -m py_compile backend/main.py backend/logic.py backend/models.py backend/data.py
```

## Backend Requirements

Backend dependencies are listed in:

```text
backend/requirements.txt
```

Install them with:

```bash
cd backend
python3 -m pip install -r requirements.txt
```

`web3` and `python-dotenv` are included because the backend has an experimental token insert endpoint. The normal MVP ride flow does not require real token minting to work.

## Troubleshooting

If the frontend says the backend is not running, make sure this command is running in a separate terminal:

```bash
cd backend
python3 -m uvicorn main:app --reload
```

If the frontend opens on a different Vite port, that is okay. The backend allows local development origins.
