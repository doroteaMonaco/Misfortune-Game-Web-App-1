import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Accordion, Spinner, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../API';
import dayjs from 'dayjs';

function HistoryPage({ user }) {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [gameCards, setGameCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedGames, setExpandedGames] = useState([]);
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadGames();
  }, [user, navigate]);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all user games
      const userGames = await API.getUserGames();
      
      // Process the games to ensure date fields are properly formatted      // Check the original data format
      if (userGames.length > 0) {
        console.log('Game date fields format check:', {
          game: userGames[0],
          startTimeField: userGames[0].startTime ? 'startTime' : 'start_time',
          endTimeField: userGames[0].endTime ? 'endTime' : 'end_time',
          startTimeValue: userGames[0].startTime || userGames[0].start_time,
          endTimeValue: userGames[0].endTime || userGames[0].end_time
        });
      }
      
      const processedGames = userGames.map(game => {
        // Convert date strings to dayjs objects if they're not already
        return {
          ...game,
          // Use ISO string for consistent formatting
          startTime: game.startTime ? game.startTime : game.start_time,
          endTime: game.endTime ? game.endTime : game.end_time
        };
      });
      
      setGames(processedGames);
      
      // Get cards for each game
      const gameCardsData = {};
      for (const game of processedGames) {
        try {
          const cards = await API.getGameCards(game.id);
          gameCardsData[game.id] = cards;
        } catch (err) {
          console.error(`Error loading cards for game ${game.id}:`, err);
        }
      }
      
      setGameCards(gameCardsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading game history:', err);
      setError('Failed to load game history. Please try again later.');
      setLoading(false);
    }
  };  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    
    // Log the input type for debugging
    console.log('Date input type:', typeof dateInput, dateInput);
    
    // Handle different possible formats
    let date;
    
    if (typeof dateInput === 'string') {
      // Parse ISO string or other date string format
      date = dayjs(dateInput);
    } else if (typeof dateInput === 'object') {
      if (dateInput._isAMomentObject || dateInput._isValid) {
        // It's already a dayjs/moment object
        date = dateInput;
      } else if (dateInput instanceof Date) {
        // It's a JavaScript Date object
        date = dayjs(dateInput);
      } else if (dateInput.format) {
        // It might be a dayjs-like object with a format method
        return dateInput.format('DD/MM/YYYY HH:mm:ss');
      } else {
        // Try to convert from JSON representation
        try {
          date = dayjs(dateInput);
        } catch (e) {
          console.error("Cannot parse date object:", dateInput, e);
          return "Invalid Date Format";
        }
      }
    } else {
      // For other types, try direct conversion
      date = dayjs(dateInput);
    }
    
    // Check if the date is valid
    if (!date.isValid()) {
      console.error("Invalid date:", dateInput);
      return "Invalid Date";
    }
    
    // Format the date
    return date.format('DD/MM/YYYY HH:mm:ss');
  };

  const getGameDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    
    // Create dayjs objects from the dates
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    
    // Check if both dates are valid
    if (!start.isValid() || !end.isValid()) {
      console.error("Invalid date format for duration calculation:", { start: startTime, end: endTime });
      return "Invalid Duration";
    }
    
    const diffSeconds = end.diff(start, 'second');
    
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    
    return `${minutes}m ${seconds}s`;
  };

  const toggleGameDetails = (gameId) => {
    if (expandedGames.includes(gameId)) {
      setExpandedGames(expandedGames.filter(id => id !== gameId));
    } else {
      setExpandedGames([...expandedGames, gameId]);
    }
  };
  const getInitialCards = (gameId) => {
    if (!gameCards[gameId]) return [];
    return gameCards[gameId]
      .filter(item => item.gameCard.initial === 1)
      .map(item => item.card);
  };

  const getRoundCards = (gameId, won) => {
    if (!gameCards[gameId]) return [];
    return gameCards[gameId]
      .filter(item => item.gameCard.initial === 0 && item.gameCard.won === (won ? 1 : 0))
      .sort((a, b) => a.gameCard.round - b.gameCard.round);
  };
  
  const countCards = (gameId, type) => {
    if (!gameCards[gameId]) return 0;
    
    if (type === 'initial') {
      return gameCards[gameId].filter(item => item.gameCard.initial === 1).length;
    } else if (type === 'won') {
      return gameCards[gameId].filter(item => item.gameCard.initial === 0 && item.gameCard.won === 1).length;
    } else if (type === 'lost') {
      return gameCards[gameId].filter(item => item.gameCard.initial === 0 && item.gameCard.won === 0).length;
    }
    
    return 0;
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading game history...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <Button variant="primary" onClick={loadGames}>Try Again</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (games.length === 0) {
    return (
      <Container className="mt-4">
        <Card>
          <Card.Body className="text-center">
            <h2> Game History</h2>
            <Alert variant="info">
              You haven't played any games yet. 
              <div className="mt-3">
                <Button variant="success" onClick={() => navigate('/game')}>Play Now</Button>
              </div>
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h2> Game History</h2>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col>
          {games.map((game) => (
            <Card key={game.id} className="mb-4 shadow-sm">              
            <Card.Header className={`d-flex justify-content-between align-items-center ${game.result === 'win' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                <div>
                  <h5 className="mb-0">
                    {game.result === 'win' ? ' Victory' : ' Defeat'}
                    <Badge 
                      bg={game.result === 'win' ? 'light' : 'light'} 
                      text={game.result === 'win' ? 'success' : 'danger'}
                      className="ms-3"
                    >
                      Game #{game.id}
                    </Badge>
                  </h5>
                </div>
                <small>
                  {formatDate(game.startTime)}
                </small>
              </Card.Header>
              
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-clock me-2 text-primary"></i>                      <div>
                        <small className="text-muted">Duration</small>
                        <p className="mb-0 fw-bold">{getGameDuration(game.startTime, game.endTime)}</p>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={3}>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-trophy-fill me-2 text-success"></i>
                      <div>
                        <small className="text-muted">Won Cards</small>
                        <p className="mb-0 fw-bold">{countCards(game.id, 'won')}</p>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={3}>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-x-circle-fill me-2 text-danger"></i>
                      <div>
                        <small className="text-muted">Lost Cards</small>
                        <p className="mb-0 fw-bold">{countCards(game.id, 'lost')}</p>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={2} className="text-end">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => toggleGameDetails(game.id)}
                    >
                      {expandedGames.includes(game.id) ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </Col>
                </Row>
                
                {expandedGames.includes(game.id) && (
                  <div className="mt-3 pt-3 border-top">                    
                  <h6>Game Cards</h6>
                    
                    <Row className="g-3">
                      {/* Initial Cards */}
                      <Col md={4}>
                        <div className="border rounded p-3">
                          <h6 className="d-flex align-items-center">
                            <i className="bi bi-collection me-2"></i>
                            Initial Cards ({getInitialCards(game.id).length})
                          </h6>
                          <div className="d-flex flex-wrap gap-1">
                            {getInitialCards(game.id).map((card) => (
                              <Badge key={`initial-${card.id}`} bg="secondary" className="text-wrap">
                                {card.name}
                              </Badge>
                            ))}
                            {getInitialCards(game.id).length === 0 && (
                              <small className="text-muted">No initial cards</small>
                            )}
                          </div>
                        </div>
                      </Col>
                      
                      {/* Won Cards */}
                      <Col md={4}>
                        <div className="border border-success rounded p-3">
                          <h6 className="d-flex align-items-center text-success">
                            <i className="bi bi-trophy-fill me-2"></i>
                            Won Cards ({countCards(game.id, 'won')})
                          </h6>                          <div className="d-flex flex-wrap gap-1">
                            {getRoundCards(game.id, true).map((item) => (
                              <Badge key={`won-${item.gameCard.id}`} bg="success" className="text-wrap">
                                {item.card.name} (Round {item.gameCard.round})
                              </Badge>
                            ))}
                            {countCards(game.id, 'won') === 0 && (
                              <small className="text-muted">No cards won</small>
                            )}
                          </div>
                        </div>
                      </Col>
                      
                      {/* Lost Cards */}
                      <Col md={4}>
                        <div className="border border-danger rounded p-3">
                          <h6 className="d-flex align-items-center text-danger">
                            <i className="bi bi-x-circle-fill me-2"></i>
                            Lost Cards ({countCards(game.id, 'lost')})
                          </h6>                          <div className="d-flex flex-wrap gap-1">
                            {getRoundCards(game.id, false).map((item) => (
                              <Badge key={`lost-${item.gameCard.id}`} bg="danger" className="text-wrap">
                                {item.card.name} (Round {item.gameCard.round})
                              </Badge>
                            ))}
                            {countCards(game.id, 'lost') === 0 && (
                              <small className="text-muted">No cards lost</small>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                      <div className="mt-3 text-center">
                      <small className="text-muted">
                        Game started at {formatDate(game.startTime)} and ended at {formatDate(game.endTime)}
                      </small>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>
    </Container>
  );
}

export default HistoryPage;
