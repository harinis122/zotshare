// ===============================
// ZotShare Version 1
// Plain Node.js simulation
// ===============================

// In real apps, users/lobbies would be stored in a database.
// For now, we use simple arrays as fake storage.
// payment is through Mock USDC for now

const users = [];
const lobbies = [];

// -------------------------------
// Function 1: Login user
// -------------------------------
// This simulates UCI-only login.
// Later, this can be replaced with real Google OAuth / Supabase Auth.

function login(name, email) {
  // Check if email is a UCI email
  if (!email.endsWith("@uci.edu")) {
    console.log("Rejected: only UCI emails are allowed.");
    return null;
  }

  // Create a fake user object
  const user = {
    id: users.length + 1,
    name: name,
    email: email,

    // Fake wallet for now.
    // Later, this would come from an embedded wallet provider.
    walletAddress: "fake_wallet_" + (users.length + 1),

    // Fake mock USDC balance.
    // Later, this would come from MockUSDC smart contract balance.
    mockUsdcBalance: 50
  };

  // Save user into fake storage
  users.push(user);

  console.log("Login successful:", user.email);
  return user;
}

// -------------------------------
// Function 2: Create ride lobby
// -------------------------------
// Host creates a ride lobby after an event.

function createLobby(hostEmail, pickupLocation, destination, departureTime, maxRiders, depositAmount) {
  const lobby = {
    id: lobbies.length + 1,

    hostEmail: hostEmail,
    pickupLocation: pickupLocation,
    destination: destination,
    departureTime: departureTime,

    maxRiders: maxRiders,
    depositAmount: depositAmount,

    // Lobby starts open.
    // Later statuses can be: OPEN, LOCKED, COMPLETED, CANCELLED
    status: "OPEN",

    // Fake escrow balance.
    // Later, this would be money held in a smart contract.
    escrowBalance: 0,

    // Host is automatically added as a member
    members: [
      {
        email: hostEmail,
        role: "HOST",
        paymentStatus: "HOST",
        confirmationStatus: "PENDING"
      }
    ]
  };

  // Save lobby into fake storage
  lobbies.push(lobby);

  console.log("Lobby created:", lobby.id);
  return lobby;
}

// -------------------------------
// Function 3: Join lobby
// -------------------------------
// Rider joins an existing open lobby.

function joinLobby(lobbyId, riderEmail) {
  const lobby = lobbies.find(function (lobby) {
    return lobby.id === lobbyId;
  });

  if (!lobby) {
    console.log("Lobby not found.");
    return null;
  }

  if (lobby.status !== "OPEN") {
    console.log("Cannot join. Lobby is not open.");
    return null;
  }

  if (lobby.members.length >= lobby.maxRiders) {
    console.log("Cannot join. Lobby is full.");
    return null;
  }

  const alreadyJoined = lobby.members.some(function (member) {
    return member.email === riderEmail;
  });

  if (alreadyJoined) {
    console.log("User already joined this lobby.");
    return null;
  }

  const member = {
    email: riderEmail,
    role: "RIDER",
    paymentStatus: "NOT_PAID",
    confirmationStatus: "PENDING"
  };

  lobby.members.push(member);

  console.log(riderEmail + " joined lobby " + lobbyId);
  return lobby;
}

// -------------------------------
// Function 4: Deposit mock USDC
// -------------------------------
// This simulates a rider depositing money into escrow.

function deposit(lobbyId, riderEmail) {
  const lobby = lobbies.find(function (lobby) {
    return lobby.id === lobbyId;
  });

  const user = users.find(function (user) {
    return user.email === riderEmail;
  });

  if (!lobby || !user) {
    console.log("Lobby or user not found.");
    return null;
  }

  const member = lobby.members.find(function (member) {
    return member.email === riderEmail;
  });

  if (!member) {
    console.log("User is not a member of this lobby.");
    return null;
  }

  if (member.role !== "RIDER") {
    console.log("Host does not need to deposit.");
    return null;
  }

  if (member.paymentStatus === "PAID") {
    console.log("User already paid.");
    return null;
  }

  if (user.mockUsdcBalance < lobby.depositAmount) {
    console.log("Not enough mock USDC.");
    return null;
  }

  // Subtract money from rider
  user.mockUsdcBalance -= lobby.depositAmount;

  // Add money to fake escrow
  lobby.escrowBalance += lobby.depositAmount;

  // Mark rider as paid
  member.paymentStatus = "PAID";

  console.log(riderEmail + " deposited " + lobby.depositAmount + " mock USDC.");
  return lobby;
}

// -------------------------------
// Function 5: Lock lobby
// -------------------------------
// Host locks lobby before the ride starts.

function lockLobby(lobbyId, hostEmail) {
  const lobby = lobbies.find(function (lobby) {
    return lobby.id === lobbyId;
  });

  if (!lobby) {
    console.log("Lobby not found.");
    return null;
  }

  if (lobby.hostEmail !== hostEmail) {
    console.log("Only the host can lock the lobby.");
    return null;
  }

  if (lobby.status !== "OPEN") {
    console.log("Lobby is not open.");
    return null;
  }

  const paidRiders = lobby.members.filter(function (member) {
    return member.role === "RIDER" && member.paymentStatus === "PAID";
  });

  if (paidRiders.length === 0) {
    console.log("Cannot lock lobby. No riders have paid.");
    return null;
  }

  lobby.status = "LOCKED";

  console.log("Lobby locked:", lobby.id);
  return lobby;
}

// -------------------------------
// Function 6: Confirm completion
// -------------------------------
// Rider confirms that the ride happened.

function confirmCompletion(lobbyId, riderEmail) {
  const lobby = lobbies.find(function (lobby) {
    return lobby.id === lobbyId;
  });

  if (!lobby) {
    console.log("Lobby not found.");
    return null;
  }

  if (lobby.status !== "LOCKED") {
    console.log("Ride must be locked before completion can be confirmed.");
    return null;
  }

  const member = lobby.members.find(function (member) {
    return member.email === riderEmail;
  });

  if (!member || member.role !== "RIDER") {
    console.log("Only riders can confirm completion.");
    return null;
  }

  if (member.paymentStatus !== "PAID") {
    console.log("Only paid riders can confirm completion.");
    return null;
  }

  member.confirmationStatus = "CONFIRMED";

  console.log(riderEmail + " confirmed ride completion.");
  return lobby;
}

// -------------------------------
// Function 7: Release funds to host
// -------------------------------
// If enough riders confirmed, money goes to host.

function releaseFunds(lobbyId, hostEmail) {
  const lobby = lobbies.find(function (lobby) {
    return lobby.id === lobbyId;
  });

  const host = users.find(function (user) {
    return user.email === hostEmail;
  });

  if (!lobby || !host) {
    console.log("Lobby or host not found.");
    return null;
  }

  if (lobby.hostEmail !== hostEmail) {
    console.log("Only the host can release funds.");
    return null;
  }

  if (lobby.status !== "LOCKED") {
    console.log("Lobby must be locked before funds can be released.");
    return null;
  }

  const paidRiders = lobby.members.filter(function (member) {
    return member.role === "RIDER" && member.paymentStatus === "PAID";
  });

  const confirmedRiders = lobby.members.filter(function (member) {
    return member.role === "RIDER" && member.confirmationStatus === "CONFIRMED";
  });

  if (confirmedRiders.length < paidRiders.length) {
    console.log("Not all paid riders have confirmed yet.");
    return null;
  }

  // Transfer escrow balance to host
  host.mockUsdcBalance += lobby.escrowBalance;

  // Mark rider payments as released
  lobby.members.forEach(function (member) {
    if (member.role === "RIDER" && member.paymentStatus === "PAID") {
      member.paymentStatus = "RELEASED";
    }
  });

  // Empty escrow
  lobby.escrowBalance = 0;

  // Complete lobby
  lobby.status = "COMPLETED";

  console.log("Funds released to host:", hostEmail);
  return lobby;
}

// ===============================
// Demo flow
// ===============================

// 1. Users log in
const host = login("Harini", "harini@uci.edu");
const rider = login("Kert", "kcorpin@uci.edu");

// 2. Host creates lobby
const lobby = createLobby(
  host.email,
  "UCI Student Center",
  "UTC Apartments",
  "9:30 PM",
  4,
  8
);

// 3. Rider joins lobby
joinLobby(lobby.id, rider.email);

// 4. Rider deposits mock USDC
deposit(lobby.id, rider.email);

// 5. Host locks lobby
lockLobby(lobby.id, host.email);

// 6. Rider confirms ride happened
confirmCompletion(lobby.id, rider.email);

// 7. Host receives escrow funds
releaseFunds(lobby.id, host.email);

// 8. Print final result
console.log("\nFinal Users:");
console.log(users);

console.log("\nFinal Lobbies:");
console.log(lobbies);


// users array       = fake users table
// lobbies array     = fake lobbies table
// walletAddress     = fake embedded wallet
// mockUsdcBalance   = fake Mock USDC
// escrowBalance     = fake smart contract escrow
// deposit()         = fake blockchain deposit
// releaseFunds()    = fake blockchain payout


