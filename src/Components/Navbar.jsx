import { Link } from "react-router-dom";
import React from "react";
import MenuIcon from '@mui/icons-material/Menu';
import './Navbar.css';
import { useState, useEffect, useContext } from "react";
import LoginButton from "./Subcomponents/LoginButton";
import { ResearchContext } from './ResearchContext';
import { LoginModal, Modal } from "./Subcomponents/Modal";
import { useNavigate } from 'react-router-dom';

const Navbar = ({

}) => {
    const [navbarOpen, setNavbarOpen] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [showLogout, setShowLogout] = useState(false);
    const [navbarClass, setNavbarClass] = useState("Navbar");
    const [overlayClass, setOverlayClass] = useState("Overlay");
    const [showLoginRequirement, setShowLoginRequirement] = useState(false);

    const cookieHandler = useContext(ResearchContext).cookies;
    const currentUser = useContext(ResearchContext).currentUser;
    const logoutCurrentUser = useContext(ResearchContext).logoutCurrentUser;

    const navigate = useNavigate();

    const toggleNavbarState = (e) => {
        setNavbarOpen(!navbarOpen);
    }

    const toggleLoginPopup = (e) => {
        setShowLoginRequirement(false);
        setShowLogin(!showLogin);
    }

    const toggleLogoutPopup = (e) => {
        setShowLogout(!showLogout);
    }

    const toggleLoginRequirement = (e) => {
        setShowLoginRequirement(!showLoginRequirement);
    }

    const logoutUser = () => {
        navigate("/");
        cookieHandler.remove('user', { path: '/' });
        logoutCurrentUser();
        setShowLogout(false);
    }

    useEffect(() => {
        navbarOpen ? setNavbarClass("Navbar collapsed") : setNavbarClass("Navbar");
        navbarOpen ? setOverlayClass("Overlay") : setOverlayClass("Overlay active")
    }, [navbarOpen]);

    return (
        <div className='Navbar-Total'>
            <div className={overlayClass} id="overlay" onClick={toggleNavbarState}></div>

            <div className="Navbar-Container">
                <div className={navbarClass} id="navbar">
                    {/* <div className="HomeButton">
                        <Link to="/">Home</Link>
                    </div> */}

                    {(currentUser != null) &&
                    <div className="AdminButton">
                        <Link to="/admin" onClick={toggleNavbarState}>Admin</Link>
                    </div>}

                    <div className="LoginButton">
                        {(currentUser == null) && <a onClick={toggleLoginPopup}>Login</a>}
                        {(currentUser != null) && <a onClick={toggleLogoutPopup}>Logout</a>}
                    </div>
                    

                    {// Deprecated, add button on map page replaces this
                    /* <div className="InputButton">
                        <Link to="/input" onClick={toggleNavbarState}>Input</Link>
                    </div> */}

                    <div className="MapButton">
                        <Link to="/" onClick={toggleNavbarState}>Map</Link>
                    </div>

                    <div className="ProfileButton">
                        {(currentUser != null) && <Link to="/profile" onClick={toggleNavbarState}>Profile</Link>}
                        {(currentUser == null) && <a onClick={toggleLoginRequirement}>Profile</a>}
                    </div>
                </div>
            </div>

            <button className="toggle-button" id="toggleButton" onClick={toggleNavbarState}>
                <MenuIcon id="navbarHamburger"></MenuIcon>
            </button>

            <LoginModal show={showLogin} onClose={toggleLoginPopup}/>

            <Modal show={showLoginRequirement} onClose={toggleLoginRequirement} title={"Not Logged In"} message={"You need to log in first!"} warningLevel={1} action={toggleLoginPopup} actionClass={'success'} actionText={"Login"}/>

            <Modal show={showLogout} onClose={toggleLogoutPopup} title={"Logout"} message={"Are you sure you want to log out?"} warningLevel={1} action={logoutUser} actionClass={'success'} actionText={"Logout"}/>
        </div>

    )
}

export default React.memo(Navbar);