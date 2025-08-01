import { Link } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import './Navbar.css';
import { useState, useEffect } from "react";

const Navbar = ({

}) => {
    const [navbarOpen, setNavbarOpen] = useState(false);
    const [navbarClass, setNavbarClass] = useState("Navbar");
    const [overlayClass, setOverlayClass] = useState("Overlay");

    const toggleNavbarState = (e) => {
        setNavbarOpen(!navbarOpen);
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
                    <div className="HomeButton">
                        <Link to="/">Home</Link>
                    </div>

                    <div className="AdminButton">
                        <Link to="/admin">Admin</Link>
                    </div>

                    <div className="LoginButton">
                        <Link to="/login">Login</Link>
                    </div>

                    <div className="InputButton">
                        <Link to="/input">Input</Link>
                    </div>

                    <div className="MapButton">
                        <Link to="/map">Map</Link>
                    </div>

                    <div className="ProfileButton">
                        <Link to="/profile">Profile</Link>
                    </div>
                </div>
            </div>

            <button className="toggle-button" id="toggleButton" onClick={toggleNavbarState}>
                <MenuIcon id="navbarHamburger"></MenuIcon>
            </button>
        </div>

    )
}

export default Navbar;