import React from 'react';
import CoreMap from '../Subcomponents/CoreMap';
import { GOOGLE_API_KEY } from "../../secrets";
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

const MapPage = ({

}) => {
    return (
        <APIProvider apiKey={GOOGLE_API_KEY}>
            <CoreMap/>
        </APIProvider>
    )
}

export default MapPage;