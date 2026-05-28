/*
  App.jsx is the main ZotShare screen.

  This MVP uses simple screen state instead of React Router:
  login screen -> lobbies screen, with separate verify event and create lobby screens.

  Important product rule for this UI:
  the logged-in user is the only person who can join, deposit, confirm, create,
  lock, or release from this browser session.

  System design picture:
  React UI in this file -> api.js fetch calls -> FastAPI main.py routes
  -> logic.py rules -> data.py fake storage.
*/

import { useEffect, useState } from "react";
import {
  confirmRide,
  createLobby,
  depositCredits,
  getEvents,
  getLobbies,
  joinLobby,
  lockLobby,
  loginUser,
  releaseFunds,
  verifyEvent,
} from "./api.js";

const emptyLobbyForm = {
  event_code: "",
  pickup_location: "",
  destination: "",
  departure_time: "",
  max_riders: "",
  deposit_amount: "",
};

function App() {
  const [screen, setScreen] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [verifiedEvent, setVerifiedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [lobbyForm, setLobbyForm] = useState(emptyLobbyForm);
  const [lobbies, setLobbies] = useState([]);
  const [message, setMessage] = useState("Log in with your UCI email to begin.");

  useEffect(() => {
    if (currentUser) {
      loadEvents();
      refreshLobbies();
    }
  }, [currentUser]);

  async function loadEvents() {
    try {
      const data = await getEvents();
      setEvents(data);
      if (!lobbyForm.event_code && data.length > 0) {
        updateLobbyForm("event_code", data[0].event_code);
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function refreshLobbies() {
    try {
      const data = await getLobbies();
      setLobbies(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateLobbyForm(field, value) {
    setLobbyForm({
      ...lobbyForm,
      [field]: value,
    });
  }

  function isHost(lobby) {
    return currentUser && lobby.host_email === currentUser.email;
  }

  function currentMember(lobby) {
    if (!currentUser) {
      return null;
    }

    return lobby.members.find((member) => member.email === currentUser.email);
  }

  function riderMembers(lobby) {
    return lobby.members.filter((member) => member.role === "RIDER");
  }

  function allRidersPaid(lobby) {
    const riders = riderMembers(lobby);
    return riders.length > 0 && riders.every((rider) => rider.payment_status === "PAID");
  }

  function allRidersConfirmed(lobby) {
    const riders = riderMembers(lobby);
    return (
      riders.length > 0 &&
      riders.every(
        (rider) =>
          rider.payment_status === "PAID" && rider.confirmation_status === "CONFIRMED"
      )
    );
  }

  function canJoin(lobby) {
    return (
      currentUser &&
      verifiedEvent &&
      verifiedEvent.event_code === lobby.event_code &&
      !isHost(lobby) &&
      !currentMember(lobby) &&
      lobby.status === "OPEN"
    );
  }

  function needsEventCodeBeforeJoining(lobby) {
    return currentUser && !verifiedEvent && !isHost(lobby) && !currentMember(lobby) && lobby.status === "OPEN";
  }

  function hasWrongEventCodeForJoining(lobby) {
    return (
      currentUser &&
      verifiedEvent &&
      verifiedEvent.event_code !== lobby.event_code &&
      !isHost(lobby) &&
      !currentMember(lobby) &&
      lobby.status === "OPEN"
    );
  }

  function canDeposit(lobby) {
    const member = currentMember(lobby);
    return (
      member &&
      member.role === "RIDER" &&
      member.payment_status === "NOT_PAID" &&
      lobby.status === "OPEN"
    );
  }

  function canConfirm(lobby) {
    const member = currentMember(lobby);
    return (
      member &&
      member.role === "RIDER" &&
      member.payment_status === "PAID" &&
      member.confirmation_status === "PENDING" &&
      lobby.status === "LOCKED"
    );
  }

  function canLock(lobby) {
    return isHost(lobby) && lobby.status === "OPEN" && allRidersPaid(lobby);
  }

  function canRelease(lobby) {
    return (
      isHost(lobby) &&
      lobby.status === "LOCKED" &&
      lobby.escrow_balance > 0 &&
      allRidersConfirmed(lobby)
    );
  }

  async function handleLogin(event) {
    event.preventDefault();

    try {
      const user = await loginUser(name, email);
      setCurrentUser(user);
      setScreen("lobbies");
      setMessage(`Logged in as ${user.email}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleVerifyEvent(event) {
    event.preventDefault();

    try {
      const verified = await verifyEvent(eventCode);
      setVerifiedEvent(verified);
      setScreen("lobbies");
      setMessage(`Verified event: ${verified.name}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCreateLobby(event) {
    event.preventDefault();

    try {
      await createLobby({
        host_email: currentUser.email,
        event_code: lobbyForm.event_code,
        pickup_location: lobbyForm.pickup_location,
        destination: lobbyForm.destination,
        departure_time: lobbyForm.departure_time,
        max_riders: Number(lobbyForm.max_riders),
        deposit_amount: Number(lobbyForm.deposit_amount),
      });
      await refreshLobbies();
      setScreen("lobbies");
      setMessage("Lobby created.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function runLobbyAction(action, successMessage) {
    try {
      await action();
      await refreshLobbies();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setVerifiedEvent(null);
    setEvents([]);
    setLobbies([]);
    setScreen("login");
    setMessage("Logged out. Log in with a UCI email to begin.");
  }

  function renderHeader() {
    return (
      <header className="header">
        <div>
          <p className="eyebrow">ZotShare MVP</p>
          <h1>Shared rides after UCI events</h1>
        </div>

        {currentUser && (
          <div className="account">
            <span>{currentUser.email}</span>
            <button type="button" className="secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </header>
    );
  }

  function renderNav() {
    if (!currentUser) {
      return null;
    }

    return (
      <nav className="nav">
        <button
          type="button"
          className={screen === "lobbies" ? "active" : "secondary"}
          onClick={() => {
            refreshLobbies();
            setScreen("lobbies");
          }}
        >
          Lobbies
        </button>
        <button
          type="button"
          className={screen === "create" ? "active" : "secondary"}
          onClick={() => setScreen("create")}
        >
          Create Lobby
        </button>
        <button
          type="button"
          className={screen === "verify" ? "active" : "secondary"}
          onClick={() => setScreen("verify")}
        >
          Verify Event
        </button>
      </nav>
    );
  }

  function renderLoginScreen() {
    return (
      <section className="screen-card">
        <form className="form-stack" onSubmit={handleLogin}>
          <div>
            <p className="step-label">Step 1</p>
            <h2>Log in with your UCI email</h2>
            <p className="small">This demo only accepts emails ending in @uci.edu.</p>
          </div>

          <label>
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label>
            UCI email
            <input
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <button type="submit">Continue to lobbies</button>
        </form>
      </section>
    );
  }

  function renderVerifyScreen() {
    return (
      <section className="screen-card">
        <form className="form-stack" onSubmit={handleVerifyEvent}>
          <div>
            <p className="step-label">Event access</p>
            <h2>Verify an event code</h2>
            <p className="small">Enter the private event code shared by the event organizer.</p>
          </div>

          <label>
            Event code
            <input
              required
              value={eventCode}
              onChange={(event) => setEventCode(event.target.value)}
            />
          </label>

          <div className="button-row">
            <button type="submit">Verify Event</button>
            <button type="button" className="secondary" onClick={() => setScreen("lobbies")}>
              Back to lobbies
            </button>
          </div>

          {verifiedEvent && (
            <p className="success-text">
              Verified: {verifiedEvent.name} at {verifiedEvent.location}
            </p>
          )}
        </form>
      </section>
    );
  }

  function renderCreateScreen() {
    return (
      <section className="screen-card">
        <form className="form-stack" onSubmit={handleCreateLobby}>
          <div>
            <p className="step-label">Host a ride</p>
            <h2>Create a lobby</h2>
            <p className="small">You will be the host as {currentUser.email}.</p>
          </div>

          <div className="form-grid">
            <label>
              Event
              <select
                required
                value={lobbyForm.event_code}
                onChange={(event) => updateLobbyForm("event_code", event.target.value)}
              >
                {events.map((event) => (
                  <option key={event.event_code} value={event.event_code}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Pickup
              <input
                required
                value={lobbyForm.pickup_location}
                onChange={(event) => updateLobbyForm("pickup_location", event.target.value)}
              />
            </label>

            <label>
              Destination
              <input
                required
                value={lobbyForm.destination}
                onChange={(event) => updateLobbyForm("destination", event.target.value)}
              />
            </label>

            <label>
              Departure time
              <input
                required
                value={lobbyForm.departure_time}
                onChange={(event) => updateLobbyForm("departure_time", event.target.value)}
              />
            </label>

            <label>
              Max riders
              <input
                required
                type="number"
                min="1"
                value={lobbyForm.max_riders}
                onChange={(event) => updateLobbyForm("max_riders", event.target.value)}
              />
            </label>

            <label>
              Deposit amount
              <input
                required
                type="number"
                min="1"
                value={lobbyForm.deposit_amount}
                onChange={(event) => updateLobbyForm("deposit_amount", event.target.value)}
              />
            </label>
          </div>

          <div className="button-row">
            <button type="submit">Create Lobby</button>
            <button type="button" className="secondary" onClick={() => setScreen("lobbies")}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  function renderLobbyActions(lobby) {
    return (
      <div className="button-row">
        {canJoin(lobby) && (
          <button
            type="button"
            onClick={() =>
              runLobbyAction(
                () => joinLobby(lobby.id, currentUser.email, verifiedEvent.event_code),
                `You joined lobby #${lobby.id}.`
              )
            }
          >
            Join
          </button>
        )}

        {needsEventCodeBeforeJoining(lobby) && (
          <button type="button" className="secondary" onClick={() => setScreen("verify")}>
            Verify Event to Join
          </button>
        )}

        {hasWrongEventCodeForJoining(lobby) && (
          <button type="button" className="secondary" onClick={() => setScreen("verify")}>
            Verify Matching Event
          </button>
        )}

        {canDeposit(lobby) && (
          <button
            type="button"
            onClick={() =>
              runLobbyAction(
                () => depositCredits(lobby.id, currentUser.email),
                `You deposited demo credits for lobby #${lobby.id}.`
              )
            }
          >
            Deposit
          </button>
        )}

        {canLock(lobby) && (
          <button
            type="button"
            onClick={() =>
              runLobbyAction(
                () => lockLobby(lobby.id, currentUser.email),
                `Lobby #${lobby.id} locked.`
              )
            }
          >
            Lock
          </button>
        )}

        {canConfirm(lobby) && (
          <button
            type="button"
            onClick={() =>
              runLobbyAction(
                () => confirmRide(lobby.id, currentUser.email),
                `You confirmed lobby #${lobby.id}.`
              )
            }
          >
            Confirm Ride
          </button>
        )}

        {canRelease(lobby) && (
          <button
            type="button"
            onClick={() =>
              runLobbyAction(
                () => releaseFunds(lobby.id, currentUser.email),
                `Funds released for lobby #${lobby.id}.`
              )
            }
          >
            Release Funds
          </button>
        )}

        {!canJoin(lobby) &&
          !needsEventCodeBeforeJoining(lobby) &&
          !hasWrongEventCodeForJoining(lobby) &&
          !canDeposit(lobby) &&
          !canLock(lobby) &&
          !canConfirm(lobby) &&
          !canRelease(lobby) && <p className="small">No action needed from you right now.</p>}
      </div>
    );
  }

  function renderLobbiesScreen() {
    return (
      <section className="screen-card wide">
        <div className="section-title">
          <div>
            <p className="step-label">Ride lobbies</p>
            <h2>Choose your next action</h2>
          </div>

          <div className="button-row">
            <button type="button" onClick={() => setScreen("create")}>
              Create Lobby
            </button>
            <button type="button" className="secondary" onClick={refreshLobbies}>
              Refresh
            </button>
          </div>
        </div>

        <div className="event-strip">
          {verifiedEvent ? (
            <span>
              Event verified: {verifiedEvent.name} at {verifiedEvent.location}
            </span>
          ) : (
            <span>No event verified yet.</span>
          )}
          <button type="button" className="secondary" onClick={() => setScreen("verify")}>
            Verify Event
          </button>
        </div>

        <div className="lobby-list">
          {lobbies.length === 0 && <p className="small">No lobbies yet. Create one to begin.</p>}

          {lobbies.map((lobby) => {
            const member = currentMember(lobby);
            const riderCount = lobby.members.filter((lobbyMember) => lobbyMember.role === "RIDER").length;
            const spotsLeft = lobby.max_riders - riderCount;

            return (
              <article className="lobby-card" key={lobby.id}>
                <div className="lobby-topline">
                  <div>
                    <h3>
                      {lobby.pickup_location} to {lobby.destination}
                    </h3>
                    <p className="small">
                      Lobby #{lobby.id} | Leaves {lobby.departure_time}
                    </p>
                  </div>
                  <span className="badge">{lobby.status}</span>
                </div>

                <div className="lobby-details">
                  <span>Host: {lobby.host_email}</span>
                  <span>Event: {lobby.event_name}</span>
                  <span>Rider spots: {lobby.max_riders} total</span>
                  <span>Spots left: {spotsLeft}</span>
                  <span>Deposit: {lobby.deposit_amount}</span>
                  <span>Escrow: {lobby.escrow_balance}</span>
                  <span>Your role: {member ? member.role : "Not joined"}</span>
                </div>

                {renderLobbyActions(lobby)}

                <ul className="members">
                  {lobby.members.map((lobbyMember) => (
                    <li key={lobbyMember.email}>
                      {lobbyMember.email} | {lobbyMember.role} |{" "}
                      {lobbyMember.payment_status} | {lobbyMember.confirmation_status}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  function renderCurrentScreen() {
    if (screen === "login") {
      return renderLoginScreen();
    }

    if (screen === "verify") {
      return renderVerifyScreen();
    }

    if (screen === "create") {
      return renderCreateScreen();
    }

    return renderLobbiesScreen();
  }

  return (
    <main className="app">
      {renderHeader()}
      {renderNav()}

      <section className="status">
        <strong>Status:</strong> {message}
      </section>

      {renderCurrentScreen()}
    </main>
  );
}

export default App;
