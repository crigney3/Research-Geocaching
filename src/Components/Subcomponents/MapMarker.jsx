import { AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import React from 'react';
import { useState, useRef } from 'react';
import FactPopup from './FactPopup';
import { FactModal } from './Modal';

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
    const [showFullFact, setShowFullFact] = useState(false);

    const toggleFullscreenFact = () => {
        setShowFullFact(!showFullFact);
    }

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
        <>
        <div className='Marker' style={{zIndex: 10001}}>
            <AdvancedMarker ref={markerRef} position={{lat, lng}} title={title} onClick={handleFactPopup}>
                <Pin background='var(--purple-main)' borderColor='var(--orange-main)' glyphColor='var(--white)'/>
            </AdvancedMarker>
            {(popupEnabled) && <FactPopup anchor={marker} title={title} description={description} username={"Yakman3"} closeFact={handleClose} fullscreenFact={toggleFullscreenFact}/>}
        </div>
        {(showFullFact) && <FactModal show={showFullFact} title={title} description={description} user={"Yakman3"} onClose={toggleFullscreenFact} />}
        </>
    )
}

export default MapMarker;