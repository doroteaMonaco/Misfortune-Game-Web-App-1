import { Button, Row, Col, Form, Alert, Card } from 'react-bootstrap';
import { useActionState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginForm(props) {
    const navigate = useNavigate();
    const [state, formAction, isPending] = useActionState(loginFunction, {username: '', password: ''});

    // Naviga dopo login di successo
    useEffect(() => {
        if (state.success) {
            navigate('/');
        }
    }, [state.success, navigate]);

    async function loginFunction(prevState, formData) {
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
        };

        try {
            await props.handleLogin(credentials);
            return { success: true };
        } catch (error) {
            return { error: 'Login failed. Check your credentials.' };
        }
    }return (
        <Row className="justify-content-center">
            <Col md={6}>
                <Card>
                    <Card.Body>
                        <h2 className="text-center mb-4">LogIn</h2>
                        
                        {state.error && (
                            <Alert variant="danger" className="mb-3">
                                {state.error}
                            </Alert>
                        )}

                        <Form action={formAction}>
                            <Form.Group className="mb-3">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="username"
                                    placeholder="Enter your username"
                                    disabled={isPending}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    disabled={isPending}
                                    required
                                />
                            </Form.Group>

                            <div className="d-grid">
                                <Button 
                                    variant="success" 
                                    type="submit" 
                                    disabled={isPending}
                                    size="lg"
                                >
                                    {isPending ? 'Loading...' : 'Login'}
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}

function LogoutButton(props) {
  return <Button variant='light' onClick={props.logout}>Logout</Button>;
}

export { LoginForm, LogoutButton };
