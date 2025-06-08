import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import API from "./API";

import DefaultLayout from "./components/DefaultLayout";
import HomePage from "./components/HomePage";
import GamePage from "./components/GamePage";
import HistoryPage from "./components/HistoryPage";
import { Routes, Route, Navigate } from "react-router";
import { LoginForm } from "./components/AuthComponents";
import NotFound from "./components/NotFound";

function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch (err) {
        setLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setMessage({msg: `Benvenuto, ${user.name}!`, type: 'success'});
      setUser(user);
    } catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setMessage('');
    setUser('');
  };

  return (
    <Routes>
      <Route element={ <DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage} user={user}/> } >
        <Route path="/" element={ <HomePage /> } />
        <Route path="/game" element={ <GamePage loggedIn={loggedIn} user={user} /> } />
        <Route path="/history" element={ loggedIn ? <HistoryPage user={user} /> : <Navigate replace to='/' />} />
        <Route path="/login" element={ loggedIn ? <Navigate replace to='/' /> : <LoginForm handleLogin={handleLogin} />} />
        <Route path="*" element={ <NotFound /> } />
      </Route>
    </Routes>
  )
}

export default App;