import { Map, AdvancedMarker, useMap, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { MAP_ID, BACKEND_URL } from "../../secrets";
import { useState, useCallback, useContext, useEffect, useRef } from 'react';
import MapMarker from './MapMarker';
import { LocationContext, ResearchContext } from '../ResearchContext';
import NavigationIcon from '@mui/icons-material/Navigation';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ComponentModal } from './Modal';
import InputPage from '../Pages/input.jsx';
import './Map.css';

const center = {
    lat: 37.97336898429983,
    lng: -87.53240843750176
}

const centerSeattle = {
  lat: 47.57033851927011,
  lng: -122.29415420009254
}

const containerStyle = {
  width: '400px',
  height: '400px',
}

const CoreMap = ({

}) => {
    const allFacts = useContext(ResearchContext).allFacts;
    const [currentCategoryFacts, setCurrentCategoryFacts] = useState([]);
    const [currentCategory, setCurrentCategory] = useState([]);
    const [currentLoc, setCurrentLoc] = useState({lat: centerSeattle.lat, lng: centerSeattle.lng, heading: 0});
    const [refreshClass, setRefreshClass] = useState('refresh-button');
    const [addWindowOpen, setAddWindowOpen] = useState(false);
    const [circleRadius, setCircleRadius] = useState(0);
    const [inputMode, setInputMode] = useState(false);

    const [selectedCoords, setSelectedCoords] = useState({lat: 0, lng: 0});

    const [mapMarkers, setMapMarkers] = useState([]);

    const map = useMap();
    const [navMarkerRef, navMarker] = useAdvancedMarkerRef();
    const rangeRef = useRef(null);

    const userLoc = useContext(LocationContext).currentLocation;
    const refreshFacts = useContext(ResearchContext).getAllFacts;
    const userRange = useContext(ResearchContext).testUser.range;

    useEffect(() => {
        createMapMarkers();
    }, [allFacts]);

    useEffect(() => {
      if (userLoc !== null) {
        setCurrentLoc({
          lat: userLoc?.coords.latitude,
          lng: userLoc?.coords.longitude,
          heading: userLoc?.coords.heading
        });
      }
    }, [userLoc]);

    useEffect(() => {
      if (selectedCoords.lat !== 0 &&
          selectedCoords.lng !== 0) {
        toggleInputWindow(true);
        setInputMode(false);
      }
    }, [selectedCoords]);

    const calculateCircleRadius = () => {
        if (!map) return 0;
      
        const zoom = map.getZoom();
        const center = map.getCenter();

        // Get meters per pixel at current zoom level
        const metersPerPixel = 156543.03392 * Math.cos(center.lat() * Math.PI / 180) / Math.pow(2, zoom);

        // Convert range to meters, then meters to pixels
        const radiusInPixels = (userRange * 0.3048) / metersPerPixel;

        return radiusInPixels;
    };

    const createMapMarkers = () => {
        let tempMarkers = [];

        allFacts.forEach((fact) => {
            tempMarkers.push(<MapMarker key={fact.id} id={fact.id} title={fact.title} description={fact.description} lat={fact.lat} lng={fact.lng} category={fact.category} rangeRef={rangeRef}/>);
        })

        setMapMarkers(tempMarkers);
    }

    const FetchAllFactsOfCategory = (category) => {
        fetch(BACKEND_URL + "/get_all_facts_of_category", {
            method: 'GET',
            headers: {
             'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors',
            body: JSON.stringify({category: 'TODO'})
        }).then(response => response.json())
          .then(data => {
            setCurrentCategoryFacts(data);
      });
    }

    const handleRefresh = () => {
      refreshFacts();
      setRefreshClass("refresh-button spinning");
      const classClear = setTimeout(() => {
        setRefreshClass("refresh-button");
        clearTimeout(classClear);
      }, 601);
    }

    const toggleInputWindow = () => {
      setAddWindowOpen(!addWindowOpen);
    }

    const handleAddButtonClicked = () => {
      setInputMode(true);
    }

    const handleSetSelectedCoords = (e) => {
      if (inputMode) {
        setSelectedCoords({lat: e.detail.latLng.lat, lng: e.detail.latLng.lng});
      }
    }

    const handleZoomChanged = () => {
      setCircleRadius(calculateCircleRadius());
    }

    return (
      <>
          <button className={refreshClass} onClick={handleRefresh}>
            <RefreshIcon/>
          </button>

          <button className='add-button' onClick={handleAddButtonClicked}>
            <AddLocationAltIcon/>
          </button>

          <div className='RangeCircle' ref={rangeRef} style={{
              width: `${circleRadius * 2}px`,
              height: `${circleRadius * 2}px`,
          }}/>

          <ComponentModal show={addWindowOpen} onClose={toggleInputWindow} component={<InputPage inLat={selectedCoords.lat} inLng={selectedCoords.lng}/>}/>

          <Map
            className='MainMap'
            center={{lat: currentLoc.lat, lng: currentLoc.lng}}
            defaultZoom={19}
            gestureHandling={'greedy'}
            disableDoubleClickZoom={false}
            zoomControl={true}
            zoomControlOptions={{position: window.google?.maps?.ControlPosition?.LEFT_BOTTOM}}
            disableDefaultUI={true}
            mapId={MAP_ID}
            onTilesLoaded={handleZoomChanged}
            onZoomChanged={handleZoomChanged}   
            onClick={handleSetSelectedCoords}    
          >
            {// Marks the user's current position with an arrow
            userLoc && <AdvancedMarker position={{lat: currentLoc.lat, lng: currentLoc.lng}} ref={navMarkerRef} style={{zIndex: 100000, transform: "translate(0%, 50%)"}}>
              <NavigationIcon style={{
                  transform: `rotate(${currentLoc.heading}deg)`,
                  color: "#F68B1F"
                }}/>
            </AdvancedMarker>}
            {!inputMode && mapMarkers}
          </Map>
        </>
    )
}

export default CoreMap;