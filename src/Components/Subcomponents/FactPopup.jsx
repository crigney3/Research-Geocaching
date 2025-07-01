import { useEffect } from 'react';
import './FactPopup.css';

const FactPopup = ({
    title,
    description,
    handleClose,
    inTop,
    inLeft
}) => {

    useEffect(() => {
        console.log(inTop);
        console.log(inLeft);
    }, [])

    return (
        <div className='FactPopup' style={{position: "absolute", top: inTop + 'px', left: inLeft + 'px'}}>
            <div className='TopRow'>
                <p>{title}</p>
                <button onClick={handleClose}>X</button>
            </div>
            <p className='PopupDescription'>{description}</p>
        </div>
    )
}

export default FactPopup;