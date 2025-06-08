import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { check, validationResult } from 'express-validator';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import dayjs from 'dayjs';

import { 
  getUser, 
  getAllCards, 
  getCardById, 
  getRandomCards, 
  getRandomCard,
  addGame, 
  getGameById, 
  getGameByUserId, 
  addGameCard, 
  getCardsOfGame,  
  updateGame,
  checkIndex 
} from './dao.mjs';
import { Game, GameCard } from './models.mjs';

const app = express();
const port = 3001;

app.use(express.json());
app.use(morgan('dev'));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200, // Per IE11 e vecchi browser
  credentials: true
};

app.use(cors(corsOptions));

// Uso LocalStrategy per l'autenticazione con username e password e verifica se l'utente esiste
passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if (!user)
    return cb(null, false, 'Incorrect username or password.');
    
  return cb(null, user);
}));

// Serialize viene usato per salvare l'utente nella sessione
passport.serializeUser(function (user, cb) {
  cb(null, user);
});

// Deserialize viene usato per recuperare l'utente dalla sessione
passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

// se l'utente è autenticato, passa al prossimo middleware
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized' });
};

// sessioni
app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

//TODO verificare se è necessario inserire una funziona per il check dell'ownership del game

///*************LOGIN***************//

// LOGIN
app.post('/api/sessions', passport.authenticate('local'), function(req, res) {
  return res.status(201).json(req.user);
});

// Prende la sessione corrente
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// LOGOUT
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

///*************DEMO***************//

// Inizio una partita demo per utenti non autenticati
app.get('/api/games/demo', async (req, res) => {
  try {
    const initialCards = await getRandomCards(3);
    res.json(initialCards);
  } catch (error) {
    res.status(500).json({ error: 'Unable to get initial cards' });
  }
});

app.get('/api/games/demo/round', async (req, res) => {
  try {
    // Se initialCards è passato come stringa separata da virgole: "1,2,3"
    const excludeIds = req.query.initialCards 
      ? req.query.initialCards.split(',').map(id => parseInt(id)) 
      : [];
    
    const roundCard = await getRandomCard(excludeIds);
    if (roundCard.error) {
      return res.status(500).json({ error: 'Unable to get round card' });
    }

    const {id, name, image} = roundCard;
    res.json({id, name, image});
  } catch (error) {
    console.error('Error starting demo game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inserisco una risposta per la richiesta di indovinare una carta nella partita demo
app.post('/api/game/demo/guess', [
  check('cardId').isInt({ min: 1 }),
  check('playerCardIds').isArray(),
  check('playerCardIds.*').isInt({ min: 1 }),
  check('insertPosition').isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const result = await checkIndex(
      req.body.cardId,
      req.body.playerCardIds,
      req.body.insertPosition
    );
    
    if (result.error) {
      return res.status(404).json(result);
    }
    if (result.correct === false) {
      
      return res.json(result.correct);
    }
    else {
      const card = await getCardById(req.body.cardId);
      if (card.error) {
        return res.status(404).json(card);
      }
      result.card = {
        name: card.name,
        image: card.image,
        misfortune: card.misfortune,
      };
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//TODO: Gestione fine

///*************GAME DI UTENTI***************///

// Inizio una nuova partita per utenti autenticati
app.post('/api/games/new', isLoggedIn, async (req, res) => {
  try {
    const initialCards = await getRandomCards(3);
    res.json(initialCards);
  }
  catch (error) {
    console.error('Error starting game:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/games/:gameId/round', async (req, res) => {
  try {
    // Se initialCards è passato come stringa separata da virgole: "1,2,3"
    const excludeIds = req.query.initialCards 
      ? req.query.initialCards.split(',').map(id => parseInt(id)) 
      : [];
    
    const roundCard = await getRandomCard(excludeIds);
    if (roundCard.error) {
      return res.status(500).json({ error: 'Unable to get round card' });
    }    const {id, name, image} = roundCard;
    res.json({id, name, image});
  } catch (error) {
    console.error('Error starting demo game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// L'utente fa una guess in una partita
app.post('/api/games/:gameId/guess', isLoggedIn, [
  check('cardId').isInt({ min: 1 }),
  check('position').isInt({ min: 0 }),
  check('round').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const result = await checkIndex(
      req.body.cardId,
      req.body.playerCardIds,
      req.body.insertPosition
    );
    
    if (result.error) {
      return res.status(404).json(result);
    }
    if (result.correct === false) {
      return res.json(result.correct);
    }
    else {
      const card = await getCardById(req.body.cardId);
      if (card.error) {
        return res.status(404).json(card);
      }
      result.card = {
        id: card.id,
        name: card.name,
        image: card.image,
        misfortune: card.misfortune,
      };
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Aggiungo una nuova partita quando l'utente la finisce
app.post('/api/games/:gameId/end', isLoggedIn, [
  check('startTime').isISO8601(),
  check('endTime').isISO8601(),
  check('result').isIn(['win', 'lose'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const game = new Game(
      null, 
      req.user.id,
      dayjs(req.body.startTime),
      dayjs(req.body.endTime),
      req.body.result
    );

    const gameId = await addGame(game);
    res.status(201).json({ gameId });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

///*************GAME DI UTENTI***************///

//TODO: nel cliente associamo le carte ai round
// Recuperare sessioni di gioco di un utente
app.get('/api/games', isLoggedIn, async (req, res) => {
  try {
    const games = await getGameByUserId(req.user.id);
    res.json(games);
  } catch (error) {
    console.error('Error fetching user games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//TODO: numero totale di carte alla fine della partita
//Recupero le carte di una partita
app.get('/api/games/:gameId/cards', isLoggedIn, async (req, res) => {
  try {
    const gameCards = await getCardsOfGame(req.params.gameId);
    res.json(gameCards);
  } catch (error) {
    console.error('Error fetching game cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inseriamo una carta in una partita
app.post('/api/games/:gameId/cards', isLoggedIn, [
  check('cardId').isInt({ min: 1 }),
  check('round').isInt({ min: 1 }),
  check('initial').isBoolean(),
  check('won').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const gameCard = new GameCard(
      null,
      req.params.gameId,
      req.body.cardId,
      req.body.round,
      req.body.initial ? 1 : 0,
      req.body.won ? 1 : null
    );

    const gameCardId = await addGameCard(gameCard);
    res.status(201).json({ gameCardId });
  } catch (error) {
    console.error('Error adding game card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});