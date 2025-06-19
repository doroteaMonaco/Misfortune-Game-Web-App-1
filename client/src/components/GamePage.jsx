import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import API from '../API';
import dayjs from 'dayjs';

function GamePage({ user }) {
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('loading'); // 'loading', 'playing', 'roundResult', 'won', 'lost'
  const [initialCards, setInitialCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState('');
  const [gameStartTime, setGameStartTime] = useState(null);
  const [lastRoundResult, setLastRoundResult] = useState(null);
  const [cardsWon, setCardsWon] = useState(0);
  const [cardsLost, setCardsLost] = useState(0);
  const [gameResults, setGameResults] = useState([]); 
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerId, setTimerId] = useState(null);
  
  // Stato per la fine del gioco
  const [showResult, setShowResult] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [finalGameResult, setFinalGameResult] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    startGame();
  }, [user, navigate]);

  useEffect(() => {
    if (gameState === 'playing' && currentCard && timeLeft > 0) { //il timer parte solo se il gioco è in corso e c'è una carta corrente
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1); //dopo 1 secondo diminuisco il tempo rimanente
      }, 1000);
      setTimerId(timer);
      return () => clearTimeout(timer); //alla fine dell'effetto pulisco il timer
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeUp(); //appena scade il timer, chiamo la funzione 
    }  }, [timeLeft, gameState, currentCard]);

  const handleTimeUp = () => {
    if (!currentCard) { //scade il timer ma non c'è una carta corrente
      console.error('handleTimeUp called but currentCard is null');
      return;
    }
    
    setMessage(`Time's up! You lost the round with "${currentCard.name}"!`);
  
    const newResult = {
      round: round,
      cardId: currentCard.id,
      cardName: currentCard.name,
      won: false,
      reason: 'timeout'
    };
    
    const newGameResults = [...gameResults, newResult];
    setGameResults(newGameResults);
    const newCardsLost = cardsLost + 1;
    setCardsLost(newCardsLost);
    setLastRoundResult(newResult);
    
    //se il giocatore ha perso 3 carte, termina il gioco 
    if (newCardsLost >= 3) {
      endGame('lose', newGameResults);
    } else {
      setGameState('roundResult');
    }
  };

  //setta il timer a 30 secondi all'inizio del gioco
  const startTimer = () => {
    setTimeLeft(30);
  };

  //ferma il timer se è in esecuzione
  const stopTimer = () => {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
  };

  const startGame = async () => {
    try {
      setGameState('loading'); //inizio il gioco in stato di caricamento
      setGameStartTime(dayjs());      
      const cards = await API.startNewGame();
      const sortedCards = cards.sort((a, b) => a.misfortune - b.misfortune); //ordino le carte iniziali
      setInitialCards(sortedCards);
      setPlayerCards([...sortedCards]);
      setGameState('playing');
      setMessage('Game Started! You have 3 initial cards. Try to win 3 more cards before losing 3!');
      
      await nextRound();
    } catch (error) {
      setMessage('Error starting game: ' + error);
      setGameState('lost');
    }
  };
  const nextRound = async () => {
    try {
      const usedCardIds = [
        ...initialCards.map(c => c.id),
        ...gameResults.filter(r => r.won).map(r => r.cardId)
      ]; //filtro le carte iniziali e quelle vinte nei round precedenti
      
      const card = await API.getRoundCard(usedCardIds); //ottengo una carta per il round corrente
      setCurrentCard(card);
      startTimer(); //inizio il timer per il round corrente
    } catch (error) {
      setMessage('Error getting next card: ' + error);
    }
  };  
  const makeGuess = async (position) => {
    try {
      stopTimer();
      
      const result = await API.makeGuess(
        currentCard.id,
        playerCards.map(c => c.id),
        position
      );
      
      if (result.correct) {
        const newCard = {
          id: currentCard.id,
          name: result.card.name,
          image: result.card.image,
          misfortune: result.card.misfortune  
        }; //se la risposta è corretta, creo un nuovo oggetto carta e lo aggiungo alle carte del giocatore
        
        const newPlayerCards = [...playerCards];
        newPlayerCards.splice(position, 0, newCard);
        setPlayerCards(newPlayerCards);
        
        setMessage(`Correct! You won "${result.card.name}"!`);
        
        const newResult = {
          round: round,
          cardId: currentCard.id,
          cardName: result.card.name,
          won: true,
          position: position,          
          cardDetails: newCard //aggiungo i dettagli della carta vinta
        };
        
        const newGameResults = [...gameResults, newResult];
        setGameResults(newGameResults);
        const newCardsWon = cardsWon + 1;
        setCardsWon(newCardsWon); //incremento il conteggio delle carte vinte
        setLastRoundResult(newResult); //mostro i risultati dell'ultimo round
        
        if (newCardsWon >= 3) {
          endGame('win', newGameResults);
        } else {
          setGameState('roundResult');
        } //se il giocatore ha vinto 3 carte, termina il gioco
      } else {
        setMessage(`Wrong! "${currentCard.name}" doesn't go in position ${position + 1}. Correct position was ${result.correctPosition + 1}.`);
        
        //se la risposta è sbagliata, creo un nuovo oggetto risultato e lo aggiungo ai risultati del gioco
        const newResult = {
          round: round,
          cardId: currentCard.id,
          cardName: currentCard.name,
          won: false,
          guessedPosition: position,          
          correctPosition: result.correctPosition
        };
        
        const newGameResults = [...gameResults, newResult];
        setGameResults(newGameResults);
        const newCardsLost = cardsLost + 1;
        setCardsLost(newCardsLost);
        setLastRoundResult(newResult);
        
        if (newCardsLost >= 3) {
          endGame('lose', newGameResults);
        } else {
          setGameState('roundResult');
        }
      }    
    } catch (error) {
      setMessage('Error making guess: ' + error);
      console.error('Error in makeGuess:', error);
    }
  };

  const endGame = async (result, results) => {
    try {
      stopTimer(); //fermo il timer prima di terminare il gioco
      setGameState(result);
      
      const gameEndTime = dayjs();

      const gameResponse = await API.endGame(
        'new',
        gameStartTime.toISOString(),
        gameEndTime.toISOString(),
        result
      ); //salvo il gioco nel database
      
      const gameId = gameResponse.gameId;      

      for (const card of initialCards) {
        await API.addGameCard(gameId, card.id, null, true);
      }
      
      for (const roundResult of results) {
        await API.addGameCard(
          gameId, 
          roundResult.cardId, 
          roundResult.round, 
          false, 
          roundResult.won
        );
      } //aggiungo le carte iniziali e i risultati dei round al gioco salvato
      
      const finalResult = {
        result: result,
        totalRounds: results.length,
        cardsWon: results.filter(r => r.won).length,
        cardsLost: results.filter(r => !r.won).length,
        gameTime: gameEndTime.diff(gameStartTime, 'second'),
        initialCards: initialCards,
        wonCards: results.filter(r => r.won),
        lostCards: results.filter(r => !r.won),
        allPlayerCards: playerCards
      };
      
      setFinalGameResult(finalResult);
      setShowFinalResult(true);
        } catch (error) {
      console.error('Error ending game:', error);
      setMessage('Error saving game: ' + (error.message || JSON.stringify(error)));
    }
  };

  const proceedToNextRound = () => {
    setRound(round + 1); //incremento il numero del round
    setLastRoundResult(null);
    setCurrentCard(null); //resetto la carta corrente e i risultati dell'ultimo round
    setGameState('playing');
    nextRound(); //richiamo la funzione per ottenere la prossima carta
  };
  const restartGame = () => {
    stopTimer();
    setGameState('loading');
    setInitialCards([]);
    setCurrentCard(null);
    setPlayerCards([]);
    setRound(1);
    setMessage('');
    setCardsWon(0);
    setCardsLost(0);
    setGameResults([]);
    setLastRoundResult(null);
    setShowResult(false);
    setShowFinalResult(false);
    setFinalGameResult(null);
    setTimeLeft(30);
    startGame(); //tutto il processo di avvio del gioco
  };

  if (!user) {
    return (
      <Container className="mt-4">
        <Row>
          <Col>
            <Alert variant="warning">Please log in to play the full game.</Alert>
            <Link to="/login" className="btn btn-primary">Login</Link>
          </Col>
        </Row>
      </Container>
    );
  }

  if (gameState === 'loading') {
    return (
      <Container className="mt-4">
        <Row>
          <Col>
            <Alert variant="info">Loading game...</Alert>
          </Col>
        </Row>
      </Container>
    );
  } 
  if (gameState === 'roundResult' && lastRoundResult) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center overflow-auto" 
           style={{backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, padding: '20px'}}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} xl={6}>
              <Card className="border-0 shadow-lg my-4">
                <Card.Header className={`${lastRoundResult.won ? 'bg-success' : 'bg-danger'} text-white py-3 text-center`}>
                  <h2 className="mb-0">Round {lastRoundResult.round} Complete</h2>
                  {lastRoundResult.won ? (
                    <h3 className="mt-2"> Victory </h3>
                  ) : (
                    <h3 className="mt-2"> Round Lost </h3>
                  )}
                </Card.Header>
                <Card.Body className="py-4 text-center">
                  {lastRoundResult.won ? (
                    <div>
                      <p className="lead">You placed <strong>"{lastRoundResult.cardName}"</strong> in the correct position!</p>
                      
                      <div className="my-3 p-3 bg-success bg-opacity-10 rounded">
                        <Row className="align-items-center">
                          <Col md={6}>
                            <div className="d-flex align-items-center justify-content-center">
                              <i className="bi bi-trophy-fill text-success me-2" style={{fontSize: '1.8rem'}}></i>
                              <div>
                                <h6 className="mb-0">Cards Won</h6>
                                <Badge bg="success" style={{fontSize: '1.3rem'}}>{cardsWon}/3</Badge>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex align-items-center justify-content-center">
                              <i className="bi bi-x-circle-fill text-danger me-2" style={{fontSize: '1.8rem'}}></i>
                              <div>
                                <h6 className="mb-0">Cards Lost</h6>
                                <Badge bg="danger" style={{fontSize: '1.3rem'}}>{cardsLost}/3</Badge>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="lead">
                        {lastRoundResult.reason === 'timeout' 
                          ? `Time ran out! You didn't place "${lastRoundResult.cardName}" in time.`
                          : `You placed "${lastRoundResult.cardName}" in position ${lastRoundResult.guessedPosition + 1}, but the correct position was ${lastRoundResult.correctPosition + 1}.`
                        }
                      </p>
                      
                      <div className="my-3 p-3 bg-danger bg-opacity-10 rounded">
                        <Row className="align-items-center">
                          <Col md={6}>
                            <div className="d-flex align-items-center justify-content-center">
                              <i className="bi bi-trophy-fill text-success me-2" style={{fontSize: '1.8rem'}}></i>
                              <div>
                                <h6 className="mb-0">Cards Won</h6>
                                <Badge bg="success" style={{fontSize: '1.3rem'}}>{cardsWon}/3</Badge>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex align-items-center justify-content-center">
                              <i className="bi bi-x-circle-fill text-danger me-2" style={{fontSize: '1.8rem'}}></i>
                              <div>
                                <h6 className="mb-0">Cards Lost</h6>
                                <Badge bg="danger" style={{fontSize: '1.3rem'}}>{cardsLost}/3</Badge>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <h6>Game Progress</h6>
                    <Row className="mt-2">
                      <Col md={4}>
                        <div className="text-center p-2 border rounded mb-2">
                          <small className="text-muted">Round</small>
                          <h5 className="text-primary mb-0">{lastRoundResult.round}</h5>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center p-2 border rounded mb-2">
                          <small className="text-muted">Goal</small>
                          <h6 className="text-success mb-0">Win 3 cards</h6>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center p-2 border rounded mb-2">
                          <small className="text-muted">Remaining</small>
                          <h6 className="mb-0">Need {Math.max(0, 3 - cardsWon)} wins</h6>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div className="mt-4 pt-3 border-top">
                    <Button 
                      variant={lastRoundResult.won ? "success" : "primary"}
                      size="lg" 
                      className="px-4 py-2"
                      onClick={proceedToNextRound}
                      style={{fontSize: '1.1rem'}}
                    >
                      Next Round
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Modern Daily Disasters - Full Game</h2>
            <div className="d-flex align-items-center gap-3">
              <span>Round: {round}</span>
              {gameState === 'playing' && currentCard && (
                <span className={`${timeLeft <= 10 ? 'text-danger fw-bold' : 'text-warning'}`}>
                  <i className="bi bi-clock"></i> {timeLeft}s
                </span>
              )}
              <Button variant="outline-secondary" size="sm" onClick={restartGame}>
                Restart Game
              </Button>
            </div>
          </div>
        </Col>
      </Row>     
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Row className="text-center">
                <Col md={6}>
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-trophy-fill text-success me-2" style={{fontSize: '1.5rem'}}></i>
                    <h4 className="mb-0">
                      <Badge bg="success" style={{fontSize: '1.2rem'}}>{cardsWon}/3</Badge>
                    </h4>
                    <span className="ms-2 text-success fw-bold">Cards Won</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-x-circle-fill text-danger me-2" style={{fontSize: '1.5rem'}}></i>
                    <h4 className="mb-0">
                      <Badge bg="danger" style={{fontSize: '1.2rem'}}>{cardsLost}/3</Badge>
                    </h4>
                    <span className="ms-2 text-danger fw-bold">Cards Lost</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {message && (
        <Row className="mb-3">
          <Col>
            <Alert 
              variant={cardsLost >= cardsWon ? 'danger' : 'success'} 
              dismissible 
              onClose={() => setMessage('')}
            >
              {message}
            </Alert>
          </Col>
        </Row>
      )}     
      {gameState === 'playing' && currentCard && (
        <Row className="mb-4">
          <Col>
            <Card className="text-center border-primary">
              <Card.Header className="bg-primary text-white">
                <h4>Round {round} - Place This Card</h4>
              </Card.Header>              <Card.Body>
                <h5>{currentCard.name}</h5>
                {currentCard.image && (
                  <div className="my-3">
                    <img 
                      src={currentCard.image} 
                      alt={currentCard.name} 
                      style={{maxWidth: '200px', maxHeight: '150px', objectFit: 'cover'}}
                      className="rounded shadow-sm"
                    />
                  </div>
                )}
                <div className={`mt-3 ${timeLeft <= 10 ? 'text-danger' : 'text-warning'}`}>
                  <i className="bi bi-clock"></i> {timeLeft} seconds remaining
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}      
      {gameState === 'playing' && (
        <Row>
          <Col>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {gameState === 'playing' && (
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => makeGuess(0)}
                  disabled={!currentCard}
                >
                  Insert Here
                </Button>
              )}
              
              {playerCards.map((card, index) => (
                <div key={`${card.id}-${index}`} className="d-flex align-items-center">                  <Card style={{ width: '200px' }} className="mb-2">
                    <Card.Body className="p-2">
                      <Card.Title className="h6">{card.name}</Card.Title>
                      {card.image && (
                        <div className="mb-2">
                          <img 
                            src={card.image} 
                            alt={card.name} 
                            style={{width: '100%', maxHeight: '120px', objectFit: 'cover'}}
                            className="rounded shadow-sm"
                          />
                        </div>
                      )}
                      <small className="text-muted">Misfortune: {card.misfortune}</small>
                    </Card.Body>
                  </Card>
                  
                  {gameState === 'playing' && index < playerCards.length - 1 && (
                    <Button 
                      variant="success" 
                      size="sm"
                      className="ms-2"
                      onClick={() => makeGuess(index + 1)}
                      disabled={!currentCard}
                    >
                      Insert Here
                    </Button>
                  )}
                </div>
              ))}
              
              {gameState === 'playing' && playerCards.length > 0 && (
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => makeGuess(playerCards.length)}
                  disabled={!currentCard}
                >
                  Insert Here
                </Button>
              )}
            </div>
          </Col>
        </Row>
      )}

   
      <Modal show={showFinalResult} onHide={() => setShowFinalResult(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {finalGameResult?.result === 'win' ? (
              <span className="text-success"> Victory </span>
            ) : (
              <span className="text-danger"> Game Over </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {finalGameResult && (
            <div>
              <Row className="mb-4">
                <Col className="text-center">
                  <h5>
                    {finalGameResult.result === 'win' 
                      ? 'Congratulations! You won 3 cards before losing 3!' 
                      : 'Better luck next time! You lost 3 cards before winning 3.'
                    }
                  </h5>
                  <p>
                    Game completed in {finalGameResult.totalRounds} rounds 
                    ({Math.floor(finalGameResult.gameTime / 60)}m {finalGameResult.gameTime % 60}s)
                  </p>
                </Col>
              </Row>

              <Row>                
                <Col md={6}>
                  <h6 className="mb-3">Initial Cards (3):</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {finalGameResult.initialCards.map(card => (
                      <div key={card.id} className="border rounded p-2" style={{minWidth: '140px'}}>
                        <small className="fw-bold d-block">{card.name}</small>
                        {card.image && (
                          <div className="my-2">
                            <img 
                              src={card.image} 
                              alt={card.name} 
                              style={{width: '100px', height: '70px', objectFit: 'cover'}}
                              className="rounded shadow-sm"
                            />
                          </div>
                        )}
                        <small className="text-muted">Misfortune: {card.misfortune}</small>
                      </div>
                    ))}
                  </div>
                </Col>                <Col md={6}>
                  <h6 className="mb-3">Cards Won ({finalGameResult.cardsWon}):</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {finalGameResult.wonCards.map(result => (
                      <div key={`won-${result.round}`} className="border border-success rounded p-2" style={{minWidth: '140px'}}>
                        <small className="text-success fw-bold d-block">Round {result.round}</small>
                        <small className="fw-bold d-block">{result.cardName}</small>
                        {result.cardDetails?.image && (
                          <div className="my-2">
                            <img 
                              src={result.cardDetails.image} 
                              alt={result.cardName} 
                              style={{width: '100px', height: '70px', objectFit: 'cover'}}
                              className="rounded shadow-sm"
                            />
                          </div>
                        )}
                        {result.cardDetails?.misfortune && (
                          <small className="text-muted">Misfortune: {result.cardDetails.misfortune}</small>
                        )}
                      </div>
                    ))}                  
                    </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFinalResult(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={restartGame}>
            Play Again
          </Button>
        </Modal.Footer>
      </Modal>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body>
              <h5>How to Play</h5>
              <ul>
                <li>You start with 3 random disaster cards arranged by misfortune level</li>
                <li>Each round, you get a new card to place in the correct position</li>
                <li>You have <strong>30 seconds</strong> per round to make your choice!</li>
                <li>Win the game by correctly placing 3 cards before making 3 mistakes</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GamePage;