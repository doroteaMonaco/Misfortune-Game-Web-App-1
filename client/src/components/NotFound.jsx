import { Container, Row, Col} from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <Container className="text-center mt-5">
      <Row>
        <Col>
          <h1 className="display-1">404</h1>
          <h2>Page not found</h2>
          <Link to="/" className="btn btn-primary">
            Link to Home Page
          </Link>
        </Col>
      </Row>
    </Container>
  );
}

export default NotFound;