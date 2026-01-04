import { AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import React, { useContext } from 'react';
import { useState, useEffect } from 'react';
import FactPopup from './FactPopup';
import { FactModal } from './Modal';
import { ResearchContext } from '../ResearchContext';
import Cookies from 'universal-cookie';

const MapMarker = ({
    id,
    title,
    description,
    lat,
    lng,
    category,
    user,
    rangeRef
}) => {
    
    const [popupEnabled, setPopupEnabled] = useState(false);
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [showFullFact, setShowFullFact] = useState(false);

    const [userRange, setUserRange] = useState(100);
    const currentUser = useContext(ResearchContext).currentUser;
    const cookieHandler = useContext(ResearchContext).cookies;
    const userAchievement = useContext(ResearchContext).checkForUserLevelup;

    useEffect(() => {
        if (currentUser !== null) {
        setUserRange(currentUser.range);
        } else {
        setUserRange(100);
        }
    }, [currentUser]);

    const toggleFullscreenFact = () => {
        setShowFullFact(!showFullFact);
    }

    const handleFactPopup = (event) => {
        if (popupEnabled) {
            setPopupEnabled(false);
            return;
        }

        const markerRect = marker.getBoundingClientRect();
        const rangeRect = rangeRef.current.getBoundingClientRect();

        const markerCenterX = markerRect.left + markerRect.width / 2;
        const markerCenterY = markerRect.top + markerRect.height / 2;

        const rangeCenterX = rangeRect.left + rangeRect.width / 2;
        const rangeCenterY = rangeRect.top + rangeRect.height / 2;

        const distance = Math.sqrt(
            Math.pow(markerCenterX - rangeCenterX, 2) + 
            Math.pow(markerCenterY - rangeCenterY, 2)
        );

        if (distance <= userRange) {
            setPopupEnabled(!popupEnabled);
            console.log("Within range");
            if (cookieHandler.get(id, {path: '/viewed'})) {
                // Already viewed this fact in the last half hour
            } else {
                userAchievement("factsViewed", 1);
                cookieHandler.set(id, 0, { maxAge: 1800, path: '/viewed' });
            }
        } else {
            console.log("Out of range");
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
            {(popupEnabled) && <FactPopup anchor={marker} title={title} description={description} username={user} closeFact={handleFactPopup} fullscreenFact={toggleFullscreenFact}/>}
        </div>
        {(showFullFact) && <FactModal show={showFullFact} title={title} description={description} user={user} onClose={toggleFullscreenFact} />}
        </>
    )
}

export default MapMarker;