import { AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import React from 'react';
import { useState, useRef } from 'react';
import FactPopup from './FactPopup';

const MapMarker = ({
    id,
    title,
    description,
    lat,
    lng,
    category
}) => {
    
    const [popupEnabled, setPopupEnabled] = useState(false);
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0});

    const handleFactPopup = (event) => {
        setPopupEnabled(!popupEnabled);

        if (markerRef.current) {
            const rect = markerRef.current.getBoundingClientRect();

            setPopupPosition({top: rect.top, left: rect.left});
        } else {
            console.log("Can't get ref! Popup will display incorrectly");
        }
    }

    const handleClose = (event) => {
        setPopupEnabled(false);
    }

    return (
        <div className='Marker'>
            <AdvancedMarker ref={markerRef} position={{lat, lng}} title={title} onClick={handleFactPopup}>
                <Pin background='var(--purple-main)' borderColor='var(--orange-main)' glyphColor='var(--white)'/>
            </AdvancedMarker>
            {(popupEnabled) && <FactPopup anchor={marker} title={title} description={description} username={"Yakman3"}/>}
        </div>
    )
}

export default MapMarker;