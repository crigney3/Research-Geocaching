import { Link } from "react-router-dom";
import React from "react";
import MenuIcon from '@mui/icons-material/Menu';
import './Navbar.css';
import { useState, useEffect, useContext } from "react";
import LoginButton from "./Subcomponents/LoginButton";
import { ResearchContext } from './ResearchContext';
import { LoginModal, Modal } from "./Subcomponents/Modal";

const Navbar = ({

}) => {
    const [navbarOpen, setNavbarOpen] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [navbarClass, setNavbarClass] = useState("Navbar");
    const [overlayClass, setOverlayClass] = useState("Overlay");
    const [showLoginRequirement, setShowLoginRequirement] = useState(false);

    const currentUser = useContext(ResearchContext).currentUser;

    const toggleNavbarState = (e) => {
        setNavbarOpen(!navbarOpen);
    }

    const toggleLoginPopup = (e) => {
        setShowLoginRequirement(false);
        setShowLogin(!showLogin);
    }

    const toggleLoginRequirement = (e) => {
        setShowLoginRequirement(!showLoginRequirement);
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

                    {(currentUser != null) && (currentUser.permLevel >= 2) &&
                    <div className="AdminButton">
                        <Link to="/admin" onClick={toggleNavbarState}>Admin</Link>
                    </div>}

                    <div className="LoginButton">
                        <button onClick={toggleLoginPopup}>Login</button>
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
                        {(currentUser == null) && <button onClick={toggleLoginRequirement}>Profile</button>}
                    </div>
                </div>
            </div>

            <button className="toggle-button" id="toggleButton" onClick={toggleNavbarState}>
                <MenuIcon id="navbarHamburger"></MenuIcon>
            </button>

            <LoginModal show={showLogin} onClose={toggleLoginPopup}/>

            <Modal show={showLoginRequirement} onClose={toggleLoginRequirement} title={"Not Logged In"} message={"You need to log in first!"} warningLevel={1} action={toggleLoginPopup} actionClass={'success'} actionText={"Login"}/>
        </div>

    )
}

export default React.memo(Navbar);