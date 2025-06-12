import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { GOOGLE_API_KEY, MAP_ID, BACKEND_URL } from "../../secrets";
import { useState, useCallback, useContext, useEffect } from 'react';
import MapMarker from './MapMarker';
import ResearchContext from '../ResearchContext';

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
    const allFacts = useContext(ResearchContext).allFacts;
    const [currentCategoryFacts, setCurrentCategoryFacts] = useState([]);
    const [currentCategory, setCurrentCategory] = useState([]);

    const [mapMarkers, setMapMarkers] = useState([]);

    useEffect(() => {
        createMapMarkers();
    }, [allFacts]);

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

    return (
        <APIProvider apiKey={GOOGLE_API_KEY}>
          <Map
            style={{width: '100vw', height: '100vh'}}
            defaultCenter={center}
            defaultZoom={19}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={MAP_ID}
          >
            {mapMarkers}
            {/* <MapMarker/> */}
          </Map>
        </APIProvider>
    )
}

export default CoreMap;