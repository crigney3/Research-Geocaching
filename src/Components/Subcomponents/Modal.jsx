import './Modal.css'

const Modal = ({ 
    show, 
    title, 
    message, 
    warningLevel,
    onClose,
    action = null
}) => {
    // Define styles and content based on warning level
    const getModalStyles = (level) => {
        switch (level) {
            case 0: // Error
                return {
                    iconClass: 'error',
                    icon: '❌',
                    buttonText: 'Try Again',
                    buttonClass: 'error'
                };
            case 1: // Warning
                if (action !== null) {
                    return {
                        iconClass: 'warning',
                        icon: '⚠️',
                        buttonText: 'Cancel',
                        buttonClass: 'warning'
                    };
                }

                return {
                    iconClass: 'warning',
                    icon: '⚠️',
                    buttonText: 'OK',
                    buttonClass: 'warning'
                };
            case 2: // Success
                return {
                    iconClass: 'success',
                    icon: '✓',
                    buttonText: 'Great!',
                    buttonClass: 'success'
                };
            default:
                return {
                    iconClass: 'error',
                    icon: '❌',
                    buttonText: 'OK',
                    buttonClass: 'error'
                };
        }
    };

    const modalStyles = getModalStyles(warningLevel);

    return (
        <div 
            className={`modal-overlay ${show ? 'show' : ''}`}
            onClick={onClose}
        >
            <div 
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`modal-icon ${modalStyles.iconClass}`}>
                    {modalStyles.icon}
                </div>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                <button 
                    className={`modal-button ${modalStyles.buttonClass}`}
                    onClick={onClose}
                >
                    {modalStyles.buttonText}
                </button>

                {(action !== null) && <button className='modal-button modal-btn-confirm' onClick={action}>Confirm</button>}
            </div>
        </div>
    );
};

const FactModal = ({
    show, 
    title, 
    message,
    user,
    onClose
}) => {

}

export {
    Modal,
    FactModal
} ;