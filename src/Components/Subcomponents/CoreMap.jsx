import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { GOOGLE_API_KEY } from "../../secrets";
import { useState, useCallback } from 'react';
import MapMarker from './MapMarker';

const center = {
    lat: 37.97336898429983,
    lng: -87.53240843750176
}

const containerStyle = {
  width: '400px',
  height: '400px',
}

const CoreMap = ({

}) => {

    return (
        <APIProvider apiKey={GOOGLE_API_KEY}>
          <Map
            style={{width: '100vw', height: '100vh'}}
            defaultCenter={center}
            defaultZoom={19}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={'c76512eeb5c9a901267de88f'}
          >
            <MapMarker/>
          </Map>
        </APIProvider>
    )
}

export default CoreMap;