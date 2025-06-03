import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import React from 'react';
import { useState, useCallback } from 'react';

const MapMarker = ({

}) => {
    return (
        <AdvancedMarker position={{lat: 37.97336898429983, lng: -87.53240843750176}}>
            <Pin background='var(--purple-main)' borderColor='var(--orange-main)' glyphColor='var(--white)'/>
        </AdvancedMarker>
    )
}

export default MapMarker;