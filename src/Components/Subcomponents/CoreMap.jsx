import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { GOOGLE_API_KEY, MAP_ID, BACKEND_URL } from "../../secrets";
import { useState, useCallback, useContext, useEffect } from 'react';
import MapMarker from './MapMarker';
import ResearchContext from '../ResearchContext';
import NavigationIcon from '@mui/icons-material/Navigation';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
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

    const [mapMarkers, setMapMarkers] = useState([]);

    const userLoc = useContext(ResearchContext).currentLocation;
    const refreshFacts = useContext(ResearchContext).getAllFacts;

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

    const createMapMarkers = () => {
        let tempMarkers = [];

        allFacts.forEach((fact) => {
            tempMarkers.push(<MapMarker key={fact.id} id={fact.id} title={fact.title} description={fact.description} lat={fact.lat} lng={fact.lng} category={fact.category}/>);
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

    const handleGoToUser = () => {
      centerSeattle.lat = userLoc?.coords.latitude;
      centerSeattle.lng = userLoc?.coords.longitude;
    }

    const handleRefresh = () => {
      refreshFacts();
      setRefreshClass("refresh-button spinning");
      const classClear = setTimeout(() => {
        setRefreshClass("refresh-button");
        clearTimeout(classClear);
      }, 601);
    }

    const addFactMap = () => {

    }

    return (
        <APIProvider apiKey={GOOGLE_API_KEY}>
          <button className={refreshClass} onClick={handleRefresh}>
            <RefreshIcon/>
          </button>

          <button className='add-button' onClick={addFactMap}>
            <AddIcon />
          </button>

          <Map
          className='MainMap'
            center={{lat: currentLoc.lat, lng: currentLoc.lng}}
            defaultZoom={19}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={MAP_ID}           
          >
            {// Marks the user's current position with an arrow
            userLoc && <AdvancedMarker position={{lat: currentLoc.lat, lng: currentLoc.lng}} >
              <NavigationIcon style={{
                  transform: `rotate(${currentLoc.heading}deg)`,
                  color: "#F68B1F"
                }}/>
            </AdvancedMarker>}
            {mapMarkers}
          </Map>
        </APIProvider>
    )
}

export default CoreMap;