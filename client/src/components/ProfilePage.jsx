import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function ProfilePage({ user }) {
  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="border-success shadow">
            <Card.Header className="bg-success text-white text-center">              <h3 className="mb-0">
                <i className="bi bi-person-circle me-2"></i>
                User Profile
              </h3>
            </Card.Header>
            <Card.Body className="py-4">
              <Row className="mb-4">
                <Col md={12}>
                  <h4 className="text-success mb-3 text-center">Account Information</h4>
                  <div className="mb-2 text-center">
                    <strong>Username:</strong> {user?.username || 'N/A'}
                  </div>
                </Col>
              </Row>
              
              <hr className="my-4" />
              
              <Row className="text-center">
                <Col>
                  <div className="d-flex justify-content-center gap-3 flex-wrap">                    <Button as={Link} to="/game" variant="success" size="lg">
                      <i className="bi bi-controller me-2"></i>
                      Play Game
                    </Button>
                    <Button as={Link} to="/history" variant="success" size="lg">
                      <i className="bi bi-clock-history me-2"></i>
                      Game History
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;
