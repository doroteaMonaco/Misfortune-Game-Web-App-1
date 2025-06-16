import { Alert, Container, Row } from "react-bootstrap";
import { Outlet } from "react-router";
import NavHeader from "./NavHeader";
import Footer from "./Footer";

function DefaultLayout(props) {
    return (
        <>
            <NavHeader loggedIn={props.loggedIn} handleLogout={props.handleLogout} user={props.user} />
            <Container fluid className="mt-3">
                {props.message && (
                    <Row>
                        <Alert variant={props.message.type} onClose={() => props.setMessage('')} dismissible>
                            {props.message.msg}
                        </Alert>
                    </Row>
                )}
                <Outlet />
            </Container>
            <Footer />
        </>
    )
}

export default DefaultLayout;