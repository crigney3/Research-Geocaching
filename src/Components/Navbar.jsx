import { Link } from "react-router-dom";


const Navbar = ({

}) => {
    return (
        <div className='Navbar'>
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
    )
}

export default Navbar;