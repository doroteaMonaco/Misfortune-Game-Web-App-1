import { Container, Row, Col} from 'react-bootstrap';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <Container className="mt-4">
      <Row className="text-center mb-5">
        <Col>
          <h1 className="display-4 mb-3">Welcome to "Stuff Happens"!!!</h1>
          <p className="lead">
            Are you ready to play?
          </p>
        </Col>
      </Row>

      <Row className="text-center mt-4">
        <Col>
          <Link to="/game" className="btn btn-success btn-lg me-3">
            Start
          </Link>
          <Link to="/login" className="btn btn-outline-success btn-lg">
            LogIn
          </Link>
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;