import dayjs from 'dayjs';

function User(id, username) {
    this.id = id;
    this.username = username;
    // SECURITY: password, password_hash, and salt are NEVER stored in this object
    // They should only be used for authentication, never exposed in API responses
}

function Card(id, name, image, misfortune, initial = false, won = false) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.misfortune = misfortune;
    this.initial = initial;
    this.won = won;
}

function Game(id, userId, startTime, endTime, result) {
    this.id = id;
    this.userId = userId;
    this.startTime = dayjs(startTime);
    this.endTime = endTime ? dayjs(endTime): null;
    this.result = result ? result : null; 
}

function GameCard(id, gameId, cardId, round, initial, won) {
    this.id = id;
    this.gameId = gameId;
    this.cardId = cardId;
    this.round = round;
    this.initial = initial;
    this.won = won;
}

export { User, Card, Game, GameCard };