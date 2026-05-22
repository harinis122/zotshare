// ===============================
// ZotShare Version 1
// Plain Node.js simulation
// ===============================

// In real apps, users/lobbies would be stored in a database.
// For now, we use simple arrays as fake storage.
// Payment is through Mock USDC/demo credits for now.

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(function (resolve) {
    rl.question(question, function (answer) {
      resolve(answer);
    });
  });
}

const users = [];
const lobbies = [];

// -------------------------------
// Function 1: Login user
// -------------------------------

function login(name, email) {
  if (!email.endsWith("@uci.edu")) {
    console.log("Rejected: only UCI emails are allowed.");
    return null;
  }

  const user = {
    id: users.length + 1,
    name: name,
    email: email,
    walletAddress: "fake_wallet_" + (users.length + 1),
    mockUsdcBalance: 50
  };

  users.push(user);

  console.log("Login successful:", user.email);
  return user;
}

// -------------------------------
// Function 2: Create ride lobby
// -------------------------------

function createLobby(hostEmail, pickupLocation, destination, departureTime, maxRiders, depositAmount) {
  const lobby = {
    id: lobbies.length + 1,

    hostEmail: hostEmail,
    pickupLocation: pickupLocation,
    destination: destination,
    departureTime: departureTime,

    // maxRiders means number of riders.
    // But members includes the host too, so total capacity is maxRiders + 1.
    maxRiders: maxRiders + 1,

    depositAmount: depositAmount,
    status: "OPEN",
    escrowBalance: 0,

    members: [
      {
        email: hostEmail,
        role: "HOST",
        paymentStatus: "HOST",
        confirmationStatus: "PENDING"
      }
    ]
  };

  lobbies.push(lobby);

  console.log("Lobby created:", lobby.id);
  return lobby;
}

// -------------------------------
// Function 3: Join lobby
// -------------------------------

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

  user.mockUsdcBalance -= lobby.depositAmount;
  lobby.escrowBalance += lobby.depositAmount;
  member.paymentStatus = "PAID";

  console.log(riderEmail + " deposited " + lobby.depositAmount + " mock USDC.");
  return lobby;
}

// -------------------------------
// Function 5: Lock lobby
// -------------------------------

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

  host.mockUsdcBalance += lobby.escrowBalance;

  lobby.members.forEach(function (member) {
    if (member.role === "RIDER" && member.paymentStatus === "PAID") {
      member.paymentStatus = "RELEASED";
    }
  });

  lobby.escrowBalance = 0;
  lobby.status = "COMPLETED";

  console.log("Funds released to host:", hostEmail);
  return lobby;
}

// -------------------------------
// Main interactive program
// -------------------------------

async function main() {
  console.log("Welcome to ZotShare!");

  const hostName = await ask("Enter host name: ");
  const hostEmail = await ask("Enter host UCI email: ");

  const host = login(hostName, hostEmail);

  if (!host) {
    rl.close();
    return;
  }

  const pickupLocation = await ask("Enter pickup location: ");
  const destination = await ask("Enter destination: ");
  const departureTime = await ask("Enter departure time: ");
  const maxRidersInput = await ask("Enter number of riders: ");
  const depositAmountInput = await ask("Enter deposit amount per rider: ");

  const maxRiders = Number(maxRidersInput);
  const depositAmount = Number(depositAmountInput);

  if (Number.isNaN(maxRiders) || Number.isNaN(depositAmount)) {
    console.log("Invalid number input.");
    rl.close();
    return;
  }

  if (maxRiders < 1) {
    console.log("You need at least 1 rider.");
    rl.close();
    return;
  }

  if (depositAmount <= 0) {
    console.log("Deposit amount must be greater than 0.");
    rl.close();
    return;
  }

  const lobby = createLobby(
    host.email,
    pickupLocation,
    destination,
    departureTime,
    maxRiders,
    depositAmount
  );

  const riders = [];

  for (let i = 1; i <= maxRiders; i++) {
    console.log("\nRider " + i);

    const riderName = await ask("Enter rider name: ");
    const riderEmail = await ask("Enter rider UCI email: ");

    const rider = login(riderName, riderEmail);

    if (!rider) {
      console.log("Invalid rider. Skipping.");
      continue;
    }

    const joinedLobby = joinLobby(lobby.id, rider.email);

    if (!joinedLobby) {
      console.log("Could not join rider to lobby. Skipping deposit.");
      continue;
    }

    const depositedLobby = deposit(lobby.id, rider.email);

    if (!depositedLobby) {
      console.log("Deposit failed for " + rider.email);
      continue;
    }

    riders.push(rider);
  }

  const lockedLobby = lockLobby(lobby.id, host.email);

  if (!lockedLobby) {
    console.log("Could not lock lobby.");
    rl.close();
    return;
  }

  for (const rider of riders) {
    confirmCompletion(lobby.id, rider.email);
  }

  releaseFunds(lobby.id, host.email);

  console.log("\nFinal Users:");
  console.log(users);

  console.log("\nFinal Lobbies:");
  console.log(lobbies);

  rl.close();
}

main();