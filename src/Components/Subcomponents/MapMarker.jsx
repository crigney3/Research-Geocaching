import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import React from 'react';
import { useState, useCallback } from 'react';

const MapMarker = ({
    id,
    title,
    description,
    lat,
    lng,
    category
}) => {
    return (
        <AdvancedMarker position={{lat, lng}} title={title}>
            <Pin background='var(--purple-main)' borderColor='var(--orange-main)' glyphColor='var(--white)'/>
        </AdvancedMarker>
    )
}

export default MapMarker;