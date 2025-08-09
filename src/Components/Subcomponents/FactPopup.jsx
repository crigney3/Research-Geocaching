import { useEffect } from 'react';
import { InfoWindow } from '@vis.gl/react-google-maps';
import './FactPopup.css';

const FactPopup = ({
    anchor,
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
        <InfoWindow anchor={anchor} className='FactPopup' style={{position: "absolute", top: inTop + 'px', left: inLeft + 'px'}}>
            <div className='TopRow'>
                <p>{title}</p>
                <button onClick={handleClose}>X</button>
            </div>
            <p className='PopupDescription'>{description}</p>
        </InfoWindow>
    )
}

export default FactPopup;