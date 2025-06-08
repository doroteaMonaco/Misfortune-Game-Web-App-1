
-- Tabella degli utenti
CREATE TABLE USER (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,  
    salt TEXT NOT NULL
);

-- Tabella delle carte
CREATE TABLE CARD (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_path TEXT,
    misfortune_index REAL NOT NULL UNIQUE CHECK (misfortune_index >= 1 AND misfortune_index <= 100)
);

-- Tabella delle partite
CREATE TABLE GAME (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    result TEXT CHECK(result IN ('win', 'lose')),
    FOREIGN KEY(user_id) REFERENCES USER(id) ON DELETE CASCADE
    --ON DELETE CASCADE per eliminare le partite associate all'utente se l'utente viene eliminato
);

-- Tabella delle carte per partita e round
CREATE TABLE GAME_CARD (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    round_number INTEGER,
    is_initial BOOLEAN NOT NULL CHECK (is_initial IN (0, 1)), -- vale per le carte iniziali
    won BOOLEAN CHECK (won IN (0, 1)),
    FOREIGN KEY(game_id) REFERENCES GAME(id) ON DELETE CASCADE,
    FOREIGN KEY(card_id) REFERENCES CARD(id) ON DELETE RESTRICT, -- ON DELETE RESTRICT per evitare di eliminare una carta se è ancora in uso in una partita
    CHECK((is_initial = 1 AND round_number IS NULL) OR (is_initial = 0 AND round_number IS NOT NULL)) -- vincolo per garantire che le carte iniziali non abbiano un numero di round
);



