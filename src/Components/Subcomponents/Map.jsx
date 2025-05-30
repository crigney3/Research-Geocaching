import { GoogleMap, useJsApiLoader, MarkerF, OverlayViewF, MARKER_LAYER } from '@react-google-maps/api'
import { GOOGLE_API_KEY } from "../../secrets";
import { useState, useCallback } from 'react';

const center = {
    lat: 37.97336898429983,
    lng: -87.53240843750176
}

const containerStyle = {
  width: '400px',
  height: '400px',
}

const Map = ({

}) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_API_KEY,
    })

    const [map, setMap] = useState(null)

    const onLoad = useCallback(function callback(map) {
        const bounds = new window.google.maps.LatLngBounds(center)
        map.fitBounds(bounds)

        setMap(map)
    }, [])

    const onUnmount = useCallback(function callback(map) {
        setMap(null)
    }, [])

    return isLoaded ? (
        <GoogleMap
         mapContainerStyle={containerStyle}
         center={center}
         zoom={10}
         onLoad={onLoad}
         onUnmount={onUnmount}
        >
            <MarkerF position={center} label="test" clickable={true}/>
        <></>
        </GoogleMap>
    ) : (
        <></>
    )
}

export default Map;