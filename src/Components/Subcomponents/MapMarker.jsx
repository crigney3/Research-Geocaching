import { AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import React, { useContext } from 'react';
import { useState, useEffect } from 'react';
import FactPopup from './FactPopup';
import { FactModal, Modal } from './Modal';
import { ResearchContext } from '../ResearchContext';
import Cookies from 'universal-cookie';

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distanceInMeters = R * c;
  const distanceInFeet = distanceInMeters * 3.28084;
  
  return distanceInFeet;
};

const MapMarker = ({
    id,
    title,
    description,
    lat,
    lng,
    category,
    user,
    rangeRef,
    getCurrentLocation,
    userId
}) => {
    
    const [popupEnabled, setPopupEnabled] = useState(false);
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [showFullFact, setShowFullFact] = useState(false);
    const [showOutOfRange, setShowOutOfRange] = useState(false);

    const [userRange, setUserRange] = useState(100);
    const currentUser = useContext(ResearchContext).currentUser;
    const setCookie = useContext(ResearchContext).setWithExpiry;
    const getCookie = useContext(ResearchContext).getWithExpiry;
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

        const userLocation = getCurrentLocation();
        const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);

        if (distance <= userRange) {
            setPopupEnabled(!popupEnabled);
            console.log("Within range");
            if (getCookie(id)) {
                // Already viewed this fact in the last half hour
            } else {
                userAchievement("factsViewed", 1);
                setCookie(id, 0, 30, 1000 * 60);
            }
        } else {
            console.log("Out of range");
            setShowOutOfRange(true);
        }
        
    }

    const handleClose = (event) => {
        setPopupEnabled(false);
    }

    const handleRangeClose = () => {
        setShowOutOfRange(false);
    }

    return (
        <>
        <div className='Marker' style={{zIndex: 10001}}>
            <AdvancedMarker ref={markerRef} position={{lat, lng}} title={title} onClick={handleFactPopup}>
                <Pin background='var(--purple-main)' borderColor='var(--orange-main)' glyphColor='var(--white)'/>
            </AdvancedMarker>
            {(popupEnabled) && <FactPopup anchor={marker} title={title} description={description} username={user} closeFact={handleFactPopup} fullscreenFact={toggleFullscreenFact} userId={userId} factId={id}/>}
        </div>
        {(showFullFact) && <FactModal show={showFullFact} title={title} description={description} user={user} onClose={toggleFullscreenFact} userId={userId} factId={id}/>}
        {(showOutOfRange) && <Modal show={showOutOfRange} title={"Out of Range!"} message={"Get within range to view more about " + title} onClose={handleRangeClose} warningLevel={1}/>}
        </>
    )
}

export default MapMarker;