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
    description,
    user,
    onClose
}) => {
    if (!show) return null;

    const isLongContent = description && description.length > 200;

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <div className="fact-popup" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="title">{title}</h2>
                        <button 
                            className="modal-close-button"
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                    </div>
                    
                    <p className="author">Submitted by {user}</p>
                    
                    <p className={`popup-description ${isLongContent ? 'long-content' : ''}`}>
                        {description}
                    </p>
                </div>
            </div>
        </>
    );
}

export {
    Modal,
    FactModal
} ;