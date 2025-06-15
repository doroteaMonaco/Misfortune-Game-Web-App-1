import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function HomePage(props) {
  return (
    <Container className="mt-4">
      {/* Hero Section */}
      <Row className="text-center mb-5">        
        <Col>
          <Card className="border-0 bg-light shadow-sm">
            <Card.Body className="py-5">
              <h1 className="display-4 mb-3 text-success">Welcome to "Stuff Happens"!</h1>
              {!props.loggedIn && (
                <div className="mt-4 mb-4">
                  <Button as={Link} to="/game/demo" variant="success" size="lg" className="me-3">
                    <i className="bi bi-play-circle me-2"></i>
                    Play Demo
                  </Button>
                  <Button as={Link} to="/login" variant="success" size="lg">
                    <i className="bi bi-person-plus me-2"></i>
                    Play Full Game
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>      {/* Action Buttons for Logged In Users */}
      {props.loggedIn && (
        <Row className="text-center mb-5">
          <Col>
            <Card className="border-success">
              <Card.Header className="bg-success text-white">
                <h4 className="mb-0">
                  <i className="bi bi-person-check me-2"></i>
                  Welcome back, {props.user?.username || 'Player'}!
                </h4>
              </Card.Header>
              <Card.Body className="py-4">
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button as={Link} to="/game" variant="success" size="lg">
                    <i className="bi bi-controller me-2"></i>
                    Play Full Game
                  </Button>
                  <Button as={Link} to="/history" variant="outline-success" size="lg">
                    <i className="bi bi-clock-history me-2"></i>
                    View History
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Game Rules Section */}
      <Row className="mb-4">
        <Col>
          <Card className="border-success">
            <Card.Header className="bg-success text-white text-center">
              <h3 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Game Rules
              </h3>
            </Card.Header>
          </Card>
        </Col>
      </Row>      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 border-success shadow-sm">
            <Card.Header className="bg-success text-white text-center">
              <h4 className="mb-0">
                <i className="bi bi-play-circle me-2"></i>
                Demo Game
              </h4>
            </Card.Header>
            <Card.Body>
              <p className="card-text">
                <strong>Trial mode for all visitors:</strong>
              </p>
              <ul className="list-unstyled mb-3">
                <li className="mb-2">
                  <i className="bi bi-clock text-warning me-2"></i>
                  <strong>Duration:</strong> 30 seconds
                </li>
                <li className="mb-2">
                  <i className="bi bi-target text-primary me-2"></i>
                  <strong>Objective:</strong> 1 round only
                </li>
                <li className="mb-2">
                  <i className="bi bi-collection text-info me-2"></i>
                  <strong>Cards:</strong> 3 initial cards + 1 card to guess
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100 border-success shadow-sm">
            <Card.Header className="bg-success text-white text-center">
              <h4 className="mb-0">
                <i className="bi bi-trophy me-2"></i>
                Full Game
              </h4>
            </Card.Header>
            <Card.Body>
              <p className="card-text">
                <strong>Complete experience for registered users:</strong>
              </p>
              <ul className="list-unstyled mb-3">
                <li className="mb-2">
                  <i className="bi bi-clock text-warning me-2"></i>
                  <strong>Duration:</strong> 30 seconds per round
                </li>
                <li className="mb-2">
                  <i className="bi bi-arrow-repeat text-primary me-2"></i>
                  <strong>Objective:</strong> Multiple rounds
                </li>
                <li className="mb-2">
                  <i className="bi bi-collection text-info me-2"></i>
                  <strong>Cards:</strong> 3 initial cards + continuous play
                </li>
                <li className="mb-2">
                  <i className="bi bi-graph-up text-success me-2"></i>
                  <strong>Features:</strong> Score tracking & history
                </li>
              </ul>
              <div className="text-center">
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;