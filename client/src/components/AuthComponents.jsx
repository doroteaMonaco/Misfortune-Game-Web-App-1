import { Button, Row, Col} from 'react-bootstrap';

function LoginForm() {

    return (
        <Row className="justify-content-center">
            <Col md={6}>
                <h2 className="text-center mb-4">Accedi al Gioco della Sfortuna</h2>
            </Col>
        </Row>
    );
}

function LogoutButton(props) {
  return <Button variant='outline-dark' onClick={props.logout}>Logout</Button>;
}

export { LoginForm, LogoutButton };
