import { useEffect, useState } from 'react';
import { Button, Container, Navbar, Nav } from 'react-bootstrap';
import { Link } from "react-router-dom";
import { LogoutButton } from './AuthComponents';
import { useNavigate } from 'react-router-dom';

function NavHeader(props) {

  const navigate = useNavigate();

  const handleLogout = () => {
    props.handleLogout();
    navigate('/');
  }
    return(
    <Navbar bg='success' data-bs-theme='dark'>
      <Container fluid>
      <Link to="/" className="navbar-brand">Stuff Happens</Link>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {props.loggedIn && <Nav.Link as={Link} to="/game">Play</Nav.Link>}
            <Nav.Link as={Link} to="/game/demo">Demo</Nav.Link>
            {props.loggedIn && <Nav.Link as={Link} to="/history">History</Nav.Link>}
          </Nav>
          <div className="d-flex align-items-center">
            {props.loggedIn ? (
              <div className="d-flex align-items-center">
                <span className="text-light me-2">Ciao, {props.user.username}!</span>
                <LogoutButton logout={handleLogout} />
              </div>
            ) : (
              <Link to='/login' className='btn btn-outline-light'>Login</Link>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavHeader;