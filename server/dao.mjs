import sqlite from 'sqlite3';
import crypto from 'crypto';
import dayjs from 'dayjs';
import { User, Card, Game, GameCard } from './models.mjs';

// Open DB
const db = new sqlite.Database('database.sqlite', (err) => {
  if (err) throw err;
});

export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM USER WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) reject(err);
      else if (row == undefined) resolve(false);
      else {
        crypto.scrypt(password, row.salt, 32, (err, hashedPwd) => {
          if (err) reject(err);          else if (!crypto.timingSafeEqual(Buffer.from(row.password_hash, 'hex'), hashedPwd))
            resolve(false);
          else
            resolve(new User(row.id, row.username));
        });
      }
    });
  });
};

export const getAllCards = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM CARD';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else if (rows.length === 0) resolve({ error: 'No cards found' });
      else resolve(rows.map(row => new Card(row.id, row.name, row.image_path, row.misfortune_index)));
    });
  });
};

export const getCardById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM CARD WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (row == undefined) resolve({ error: 'Card not found' });
      else resolve(new Card(row.id, row.name, row.image_path, row.misfortune_index));
    });
  });
};

export const addGame = (game) => {
    return new Promise((resolve, reject) => {
        if (!['win', 'lose'].includes(game.result)) {
            return reject({error: 'Invalid game result'});
        }
        if (game.endTime == undefined || game.endTime == null) {
            return reject({error: 'End time must be defined'});
        }
        const sql = 'INSERT INTO GAME(user_id, start_time, end_time, result) VALUES (?, ?, ?, ?)';
        db.run(sql, [game.userId, game.startTime.format(), game.endTime.format(), game.result], function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};


export const getGameById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM GAME WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (row == undefined) resolve({ error: 'Game not found' });
      else resolve(new Game(row.id, row.user_id, row.start_time, row.end_time, row.result));
    });
  });
};

export const getGameByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM GAME WHERE user_id = ? ORDER BY start_time DESC';
    db.all(sql, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => new Game(r.id, r.user_id, r.start_time, r.end_time, r.result)));
    });
  });
};

export const addGameCard = (gameCard) => {
  return new Promise((resolve, reject) => {
    if (![0, 1].includes(gameCard.initial)) {
        return reject({ error: 'Invalid initial value' });
    }
    if (gameCard.initial === 1 && gameCard.round !== null) {
        return reject({ error: 'Initial card must have round null' });
    }
    if (gameCard.initial === 0 && (gameCard.round === null || gameCard.round < 1)) {
        return reject({ error: 'Non-initial card must have round defined and greater than 0' });
    }
    if (gameCard.won !== null && ![0, 1].includes(gameCard.won)) {
        return reject({ error: 'Invalid won value' });
    }
    const sql = 'INSERT INTO GAME_CARD(game_id, card_id, round_number, is_initial, won) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [gameCard.gameId, gameCard.cardId, gameCard.round, gameCard.initial, gameCard.won], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

export const getCardsOfGame = (gameId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT gc.id as gc_id, gc.round_number, gc.won, gc.is_initial, gc.card_id, c.id, c.name, c.image_path, c.misfortune_index FROM GAME_CARD gc JOIN CARD c ON gc.card_id = c.id WHERE gc.game_id = ? ORDER BY gc.round_number`;
    db.all(sql, [gameId], (err, rows) => {
      if (err) reject(err);
      else {
        const result = rows.map(row => ({
          gameCard: new GameCard(row.gc_id, gameId, row.card_id, row.round_number, row.is_initial, row.won),
          card: new Card(row.id, row.name, row.image_path, row.misfortune_index)
        }));
        resolve(result);
      }
    });
  });
};

export const getRandomCards = (count) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM CARD ORDER BY RANDOM() LIMIT ?`;
    
    db.all(sql, [count], (err, rows) => {
      if (err) reject(err);
      else if (rows.length === 0) resolve({ error: 'No cards available' });
      else resolve(rows.map(row => new Card(row.id, row.name, row.image_path, row.misfortune_index, true)));
    });
  });
};

export const getRandomCard = (excludeIds = []) => {
  return new Promise((resolve, reject) => {
    const excludeClause = excludeIds.length > 0 ? `WHERE id NOT IN (${excludeIds.map(() => '?').join(',')})` : '';
    const sql = `SELECT * FROM CARD ${excludeClause} ORDER BY RANDOM() LIMIT 1`;
    
    db.all(sql, excludeIds, (err, rows) => {
      if (err) reject(err);
      else if (rows.length === 0) resolve({ error: 'No cards available' });
      else resolve(new Card(rows[0].id, rows[0].name, rows[0].image_path, rows[0].misfortune_index));
    });
  });
};

export const updateGame = (game) => {
  return new Promise((resolve, reject) => {
    if (game.result && !['win', 'lose'].includes(game.result)) {
      return reject({ error: 'Invalid game result' });
    }
    const sql = 'UPDATE GAME SET end_time = ?, result = ? WHERE id = ?';
    db.run(sql, [game.endTime.format(), game.result, game.id], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

export const checkIndex = (cardId, playerCardIds, insertPosition) => {
  return new Promise((resolve, reject) => {
    const getCardSql = 'SELECT misfortune_index FROM CARD WHERE id = ?';
    
    db.get(getCardSql, [cardId], (err, cardRow) => {
      if (err) return reject(err);
      if (!cardRow) return resolve({ error: "Card not found" });
      
      const cardIndex = cardRow.misfortune_index;
      
      if (playerCardIds.length === 0) {
        return resolve({ correct: true }); 
      }
      
      const placeholders = playerCardIds.map(() => '?').join(',');
      const getPlayerCardsSql = `SELECT id, misfortune_index FROM CARD WHERE id IN (${placeholders}) ORDER BY misfortune_index`;
      
      db.all(getPlayerCardsSql, playerCardIds, (err, playerCards) => {
        if (err) return reject(err);
        let correct = false;
        let correctPosition = 0;
        
        
        for (let i = 0; i < playerCards.length; i++) {
          if (cardIndex < playerCards[i].misfortune_index) {
            correctPosition = i;
            break;
          }
          correctPosition = i + 1;
        }
          
        correct = (insertPosition === correctPosition);
        
        
        if (correct) {
          resolve({ correct: true });
        } else {
          resolve({ correct: false, correctPosition });
        }
      });
    });
  });
};

