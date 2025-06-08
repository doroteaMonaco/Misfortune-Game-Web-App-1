const SERVER_URL = "http://localhost:3001";

// Login
const logIn = async (credentials) => {
  const response = await fetch(SERVER_URL + '/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  if(response.ok) {
    const user = await response.json();
    return user;
  }
  else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

// Get user info
const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    credentials: 'include',
  });
  const user = await response.json();
  if (response.ok) {
    return user;
  } else {
    throw user;
  }
};

// Logout
const logOut = async() => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
  if (response.ok)
    return null;
}

// Demo game - get initial cards
const startDemoGame = async () => {
  const response = await fetch(SERVER_URL + '/api/games/demo');
  if(response.ok) {
    const initialCards = await response.json();
    return initialCards;
  }
  else {
    throw new Error("Unable to start demo game");
  }
};

// Demo game - get round card
const getDemoRoundCard = async (excludeIds) => {
  const queryString = excludeIds.join(',');
  const response = await fetch(SERVER_URL + `/api/games/demo/round?initialCards=${queryString}`);
  if(response.ok) {
    const roundCard = await response.json();
    return roundCard;
  }
  else {
    throw new Error("Unable to get round card");
  }
};

// Demo game - make guess
const makeDemoGuess = async (cardId, playerCardIds, insertPosition) => {
  const response = await fetch(SERVER_URL + '/api/game/demo/guess', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      cardId: cardId,
      playerCardIds: playerCardIds,
      insertPosition: insertPosition
    })
  });
  
  if(response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const error = await response.json();
    throw error;
  }
};

// Authenticated game - start new game
const startNewGame = async () => {
  const response = await fetch(SERVER_URL + '/api/games/new', {
    method: 'POST',
    credentials: 'include'
  });
  if(response.ok) {
    const initialCards = await response.json();
    return initialCards;
  }
  else {
    throw new Error("Unable to start new game");
  }
};

// Authenticated game - get round card
const getRoundCard = async (gameId, excludeIds) => {
  const queryString = excludeIds.join(',');
  const response = await fetch(SERVER_URL + `/api/games/${gameId}/round?initialCards=${queryString}`);
  if(response.ok) {
    const roundCard = await response.json();
    return roundCard;
  }
  else {
    throw new Error("Unable to get round card");
  }
};

// Authenticated game - make guess
const makeGuess = async (gameId, cardId, position, round) => {
  const response = await fetch(SERVER_URL + `/api/games/${gameId}/guess`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({
      cardId: cardId,
      position: position,
      round: round
    })
  });
  
  if(response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const error = await response.json();
    throw error;
  }
};

// End game
const endGame = async (gameId, startTime, endTime, result) => {
  const response = await fetch(SERVER_URL + `/api/games/${gameId}/end`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({
      startTime: startTime,
      endTime: endTime,
      result: result
    })
  });
  
  if(response.ok) {
    const gameResult = await response.json();
    return gameResult;
  }
  else {
    const error = await response.json();
    throw error;
  }
};

// Get user games
const getUserGames = async () => {
  const response = await fetch(SERVER_URL + '/api/games', {
    credentials: 'include'
  });
  if(response.ok) {
    const games = await response.json();
    return games;
  }
  else {
    throw new Error("Unable to get user games");
  }
};

// Get game cards
const getGameCards = async (gameId) => {
  const response = await fetch(SERVER_URL + `/api/games/${gameId}/cards`, {
    credentials: 'include'
  });
  if(response.ok) {
    const cards = await response.json();
    return cards;
  }
  else {
    throw new Error("Unable to get game cards");
  }
};

// Add game card
const addGameCard = async (gameId, cardId, round, initial, won) => {
  const response = await fetch(SERVER_URL + `/api/games/${gameId}/cards`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({
      cardId: cardId,
      round: round,
      initial: initial,
      won: won
    })
  });
  
  if(response.ok) {
    const result = await response.json();
    return result;
  }
  else {
    const error = await response.json();
    throw error;
  }
};

const API = { 
  logIn, 
  getUserInfo, 
  logOut, 
  startDemoGame, 
  getDemoRoundCard, 
  makeDemoGuess,
  startNewGame, 
  getRoundCard, 
  makeGuess,
  endGame,
  getUserGames,
  getGameCards,
  addGameCard
};

export default API;