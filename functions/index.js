const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// Add a new player
exports.addPlayer = functions.https.onCall((data, context) => {
  // Add validation and authentication checks here
  return db.collection("players").add({
    name: data.name,
    elo: data.elo,
    record: {
      wins: data.record.wins,
      losses: data.record.losses,
    },
  });
});

// Get all players (for populating the leaderboard)
exports.getPlayers = functions.https.onCall(async (data, context) => {
  const snapshot = await db.collection("players").orderBy("elo", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

// Update a player's info
exports.updatePlayer = functions.https.onCall((data, context) => {
  // Validate input and possibly check authentication
  const { playerId, name, elo, record } = data;
  return db.collection("players").doc(playerId).update({
    name: name,
    elo: elo,
    record: record,
  });
});

// Delete a player
exports.deletePlayer = functions.https.onCall((data, context) => {
  // Validate input and possibly check authentication
  return db.collection("players").doc(data.playerId).delete();
});
