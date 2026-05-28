/*
  api.js contains all fetch calls to the Python FastAPI backend.

  Keep backend URLs here so App.jsx can stay focused on UI and state.

  System design picture:
  App.jsx -> api.js fetch helpers -> FastAPI backend at http://127.0.0.1:8000
*/

const API_BASE = "http://127.0.0.1:8000";

async function readJsonResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Backend request failed");
  }

  return data;
}

async function postJson(path, body) {
  const response = await fetchBackend(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse(response);
}

async function fetchBackend(path, options) {
  try {
    return await fetch(`${API_BASE}${path}`, options);
  } catch (error) {
    throw new Error("Backend is not running. Start FastAPI on http://127.0.0.1:8000.");
  }
}

export async function loginUser(name, email) {
  return postJson("/auth/login", { name, email });
}

export async function verifyEvent(eventCode) {
  return postJson("/events/verify", { event_code: eventCode });
}

export async function createLobby(form) {
  return postJson("/lobbies", form);
}

export async function getLobbies() {
  const response = await fetchBackend("/lobbies");
  return readJsonResponse(response);
}

export async function joinLobby(lobbyId, riderEmail) {
  return postJson(`/lobbies/${lobbyId}/join`, { rider_email: riderEmail });
}

export async function depositCredits(lobbyId, riderEmail) {
  return postJson(`/lobbies/${lobbyId}/deposit`, { rider_email: riderEmail });
}

export async function lockLobby(lobbyId, hostEmail) {
  return postJson(`/lobbies/${lobbyId}/lock`, { host_email: hostEmail });
}

export async function confirmRide(lobbyId, riderEmail) {
  return postJson(`/lobbies/${lobbyId}/confirm`, { rider_email: riderEmail });
}

export async function releaseFunds(lobbyId, hostEmail) {
  return postJson(`/lobbies/${lobbyId}/release`, { host_email: hostEmail });
}
