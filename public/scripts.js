const firebaseConfig = {
  apiKey: "AIzaSyDps50165CE5E1hpbjH7J1wwZL2nx94vyk",
  authDomain: "donnerpingpong.firebaseapp.com",
  projectId: "donnerpingpong",
  storageBucket: "donnerpingpong.appspot.com",
  messagingSenderId: "480110439809",
  appId: "1:480110439809:web:1cf03dfa371a68515c8c80",
  measurementId: "G-J5TJY3D1C0",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

class Player {
  constructor(id, name, elo, wins, losses) {
    this.id = id;
    this.name = name;
    this.elo = elo;
    this.record = {
      wins: wins,
      losses: losses,
    };
  }
}

// Initialize the addPlayer Cloud Function
const addPlayer = firebase.functions().httpsCallable("addPlayer");

// Initialize Firebase functions
const getPlayers = firebase.functions().httpsCallable("getPlayers");
const updatePlayer = firebase.functions().httpsCallable("updatePlayer");

// Fetch players and populate the leaderboard
let players = []; // This will hold the players fetched from Firestore
async function fetchPlayers() {
  try {
    const result = await getPlayers({});
    players = result.data.map(
      (playerData) =>
        new Player(
          playerData.id,
          playerData.name,
          playerData.elo,
          playerData.record.wins,
          playerData.record.losses
        )
    );
    updateLeaderboard(); // Update the leaderboard after fetching players
  } catch (error) {
    console.log("Error fetching players: ", error);
  }
}

// Call fetchPlayers when the page loads
fetchPlayers();

function updateLeaderboard() {
  // Get the tbody element from the HTML table
  const tbody = document.getElementById("leaderboard-body");

  tbody.innerHTML = "";

  // Sort players by ELO in descending order
  players.sort((a, b) => b.elo - a.elo);

  // Loop through the sorted array of players to populate the table
  players.forEach((player, index) => {
    const row = tbody.insertRow();
    const rankCell = row.insertCell(0);
    const nameCell = row.insertCell(1);
    const eloCell = row.insertCell(2);
    const recordCell = row.insertCell(3);

    rankCell.textContent = index + 1;
    nameCell.textContent = player.name;
    eloCell.textContent = Math.trunc(player.elo);
    recordCell.textContent = `${player.record.wins}W-${player.record.losses}L`;
  });
}

function updateELO(player1, player2, result) {
  const K = 32;
  const expected1 = 1 / (1 + Math.pow(10, (player2.elo - player1.elo) / 400));
  const expected2 = 1 - expected1;

  let actual1 = 0;
  let actual2 = 0;

  switch (result) {
    case "win":
      actual1 = 1;
      actual2 = 0;
      break;
    case "loss":
      actual1 = 0;
      actual2 = 1;
      break;
    case "draw":
      actual1 = 0.5;
      actual2 = 0.5;
      break;
    default:
      console.error("Invalid result");
      return;
  }

  player1.elo += K * (actual1 - expected1);
  player2.elo += K * (actual2 - expected2);

  updatePlayer({
    playerId: player1.id, // Assuming the Player class has an 'id' field that stores the Firestore document ID
    name: player1.name,
    elo: player1.elo,
    record: player1.record,
  })
    .then(() => {
      updatePlayer({
        playerId: player2.id,
        name: player2.name,
        elo: player2.elo,
        record: player2.record,
      });
    })
    .catch((error) => {
      console.log("Error updating players: ", error);
    });
}

let formDisplayed = false; // Flag to track form display status

const showForm = () => {
  if (formDisplayed) return; // Exit if form is already displayed

  // Create form and its elements
  const form = document.createElement("form");
  form.className = "popup-form";

  const formHeader = document.createElement("div");
  formHeader.className = "form-header";
  formHeader.innerHTML = "<h3>Add Result</h3>";

  form.appendChild(formHeader);

  const createPlayerSelect = (labelText) => {
    const label = document.createElement("label");
    label.innerText = labelText;
    const select = document.createElement("select");

    players.forEach((player, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.text = player.name;
      select.appendChild(option);
    });

    return { label, select };
  };

  const winnerSelects = createPlayerSelect("Select Winner:");
  const loserSelects = createPlayerSelect("Select Loser:");

  const beatText = document.createElement("p");
  beatText.innerHTML = "beat";
  beatText.className = "beat-text";

  const result = document.createElement("div");
  result.className = "result";

  result.appendChild(winnerSelects.select);
  result.appendChild(beatText);
  result.appendChild(loserSelects.select);

  form.appendChild(result);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (winnerSelects.select.value === loserSelects.select.value) {
      alert("Winner and loser can't be the same!");
      return;
    }

    players[winnerSelects.select.value].record.wins += 1;
    players[loserSelects.select.value].record.losses += 1;

    updateELO(players[winnerSelects.select.value], players[loserSelects.select.value], "win");
    updateLeaderboard();
    form.style.display = "none";
    formDisplayed = false; // Update flag
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.innerText = "Submit";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.innerText = "Close";
  closeBtn.addEventListener("click", () => {
    form.style.display = "none";
    formDisplayed = false; // Update flag
  });

  form.appendChild(document.createElement("br"));
  let row = document.createElement("div");
  row.className = "row buttons";
  form.appendChild(row);
  row.appendChild(submitBtn);
  row.appendChild(closeBtn);

  // Append form to body
  document.getElementById("main").appendChild(form);

  // Show form
  form.style.display = "flex";
  formDisplayed = true; // Update flag
};

// Get the show form button and attach event
const showFormBtn = document.getElementById("show-form-btn");
showFormBtn.addEventListener("click", showForm);

updateLeaderboard();
