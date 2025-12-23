import { ResearchContext } from '../ResearchContext';
import './LoginButton.css';
import { useContext, useEffect, useState } from "react";
import { Modal } from './Modal';

const LoginButton = ({

}) => {
    const loggedIn = useContext(ResearchContext).isLoggedIn;
    const currentUser = useContext(ResearchContext).currentUser;

    const setLoggedIn = useContext(ResearchContext).setIsLoggedIn;
    const setCurrentUser = useContext(ResearchContext).setCurrentUser;
    const getAllFacts = useContext(ResearchContext).getAllFacts;

    // Remember to remove this once UE gets back to me
    const testUser = useContext(ResearchContext).testUser;

    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({title: "", message: "", warningLevel: 0});

    const handleLogin = () => {
        setLoggedIn(true);
        setCurrentUser(testUser);
    }

    useEffect(() => {
        setShowModal(true);
        if (loggedIn) {
            setModalConfig({
                title: "Login successful!",
                message: "You can now add facts and view your profile.",
                warningLevel: 2
            });
        } else {
            setModalConfig({
                title: "Login failed!",
                message: "Please wait a moment and try to log in again.",
                warningLevel: 0
            });
        }
    }, [loggedIn]);

    const handleModalClose = () => {
        setShowModal(false);
    }

    return (
            <button className='LoginButton' onClick={handleLogin}>
                Login
            </button>

            // <Modal show={showModal} onClose={handleModalClose} title={modalConfig.title} message={modalConfig.message} warningLevel={modalConfig.warningLevel} />
    )
}

export default LoginButton;