import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import API from '../API';

function GameDemo() {
  const [gameState, setGameState] = useState('loading'); // 'loading', 'playing', 'won', 'lost'
  const [initialCards, setInitialCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState('');
  const [showResult, setShowResult] = useState(false);  const [gameResult, setGameResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerId, setTimerId] = useState(null);
  useEffect(() => {
    startDemo();
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && currentCard && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      setTimerId(timer);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      // Time's up!
      handleTimeUp();
    }
  }, [timeLeft, gameState, currentCard]);

  const handleTimeUp = () => {
    setMessage("Time's up! You didn't choose in time. Game Over!");
    setGameState('lost');
    setGameResult({
      type: 'lose',
      rounds: round,
      reason: 'timeout',
      cardName: currentCard?.name || 'Unknown'
    });
    setShowResult(true);
  };
  const startTimer = () => {
    setTimeLeft(30);
  };

  const stopTimer = () => {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
  };const startDemo = async () => {
    try {
      setGameState('loading');
      const cards = await API.startDemoGame();
      const sortedCards = cards.sort((a, b) => a.misfortune - b.misfortune);
      setInitialCards(sortedCards);
      setPlayerCards([...sortedCards]);
      setGameState('playing');
      setMessage('Demo Game Started! Try to guess where the new card fits!');
      await nextRound(sortedCards.map(c => c.id));
    } catch (error) {
      setMessage('Error starting demo game: ' + error);
      setGameState('lost');
    }
  };
  const nextRound = async (excludeIds) => {
    try {
      const card = await API.getRoundCard(excludeIds);
      setCurrentCard(card);
      startTimer(); 
    } catch (error) {
      setMessage('Error getting next card: ' + error);
    }
  };  const makeGuess = async (position) => {
    try {
      stopTimer(); 
      
      const result = await API.makeGuess(
        currentCard.id,
        playerCards.map(c => c.id),
        position
      );if (result.correct) {
        const newPlayerCards = [...playerCards];
        newPlayerCards.splice(position, 0, {
          id: currentCard.id,
          name: result.card.name,
          image: result.card.image,
          misfortune: result.card.misfortune
        });
        setPlayerCards(newPlayerCards);
        setMessage(`Correct! You placed "${result.card.name}" in the right position!`);
        
        setGameState('won');
        setGameResult({
          type: 'win',
          rounds: round,
          cardName: result.card.name
        });
        setShowResult(true);
      } else {
        // Wrong guess
        setMessage(`Wrong! The card "${currentCard.name}" doesn't go there. Game Over!`);
        setGameState('lost');
        setGameResult({
          type: 'lose',
          rounds: round,
          correctPosition: result.correctPosition,
          cardName: currentCard.name
        });
        setShowResult(true);
      }
    } catch (error) {
      setMessage('Error making guess: ' + error);
    }
  };
  const restartGame = () => {
    stopTimer(); 
    setGameState('loading');
    setInitialCards([]);
    setCurrentCard(null);
    setPlayerCards([]);
    setRound(1);    setMessage('');
    setShowResult(false);
    setGameResult(null);
    setTimeLeft(30);
    startDemo();
  };

  if (gameState === 'loading') {
    return (
      <Container className="mt-4">
        <Row>
          <Col>
            <Alert variant="info">Loading demo game...</Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Demo Game - Modern Daily Disasters</h2>            <div>
              <span className="me-3">Round: {round}/1</span>
              {gameState === 'playing' && currentCard && (
                <span className={`me-3 ${timeLeft <= 10 ? 'text-danger fw-bold' : 'text-warning'}`}>
                  Time: {timeLeft}s
                </span>
              )}
              <Button variant="success" onClick={restartGame}>Restart Demo</Button>
            </div>
          </div>
        </Col>
      </Row>

      {message && (
        <Row className="mb-3">
          <Col>
            <Alert variant={gameState === 'lost' ? 'danger' : 'success'} dismissible onClose={() => setMessage('')}>
              {message}
            </Alert>
          </Col>
        </Row>
      )}

      {gameState === 'playing' && currentCard && (
        <Row className="mb-4">
          <Col>
            <Card className="text-center">
              <Card.Header>
                <h4>Current Card to Place</h4>
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
              <Button 
                variant="success" 
                size="sm"
                onClick={() => makeGuess(0)}
                disabled={!currentCard}
              >
                Insert Here
              </Button>
              
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
                  
                  {index < playerCards.length - 1 && (
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
              
              {playerCards.length > 0 && (
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

      <Modal show={showResult} onHide={() => setShowResult(false)} centered>        
        <Modal.Header closeButton>
          <Modal.Title>
            {gameResult?.type === 'win' ? (
              <span className="text-success"> Victory </span>
            ) : (
              <span className="text-danger"> Game Over </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            {gameResult?.type === 'win' ? (
              <div>
                <h5>Congratulations!</h5>
                <p>You correctly placed "{gameResult.cardName}"!</p>
              </div>
            ) : (
              <div>
                <h5>Better luck next time!</h5>
                {gameResult?.reason === 'timeout' ? (
                  <p>You ran out of time!</p>
                ) : (
                  <p>You guessed the wrong position for "{gameResult?.cardName}".</p>
                )}
              </div>
            )}
          </div>

          <div className="text-center">
            <h6>Your Card Collection ({playerCards.length} cards):</h6>            
            <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
              {playerCards.map((card, index) => (
                <div key={`card-${card.id}-${index}`} className="border rounded p-2 text-center" style={{minWidth: '140px'}}>
                  <small className="d-block fw-bold mb-2">{card.name}</small>
                  {card.image && (
                    <div className="mb-2">
                      <img 
                        src={card.image} 
                        alt={card.name} 
                        style={{width: '100px', height: '70px', objectFit: 'cover'}}
                        className="rounded shadow-sm"
                      />
                    </div>
                  )}
                  <small className="text-muted">Level: {card.misfortune}</small>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" onClick={() => setShowResult(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={restartGame}>
            Play Again
          </Button>
          <Link to="/login" className="btn btn-success">
            Play Full Game
          </Link>
        </Modal.Footer>
      </Modal>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body>              <h5>How to Play</h5>              <ul>
                <li>You start with 3 random disaster cards arranged by misfortune level</li>
                <li>You get one new card to place in the correct position</li>
                <li>You have <strong>30 seconds</strong> to make your choice!</li>
                <li>Click "Insert Here" buttons to place the card where you think it belongs</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GameDemo;
