import { InfoWindow } from '@vis.gl/react-google-maps';
import './FactPopup.css';
import { useState } from 'react';

const FactPopup = ({
    anchor,
    title,
    description,
    username,
    closeFact,
    fullscreenFact
}) => {
    const isLongContent = description && description.length > 200;

    return (
        <>
            <InfoWindow anchor={anchor} className='FactPopup' shouldFocus={true} headerContent={<h2 className='Title'>{title}</h2>} onCloseClick={closeFact}>
                <p className='Author'>Submitted by {username}</p>
                <p className={`PopupDescription ${isLongContent ? 'long-content' : ''}`}>{description}</p>
                <button className='ReadMore' onClick={fullscreenFact}>Read More</button>
            </InfoWindow>
        </>
    )
}

export default FactPopup;