import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { GOOGLE_API_KEY, MAP_ID, BACKEND_URL } from "../../secrets";
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
    const [allFacts, setAllFacts] = useState([]);
    const [currentCategoryFacts, setCurrentCategoryFacts] = useState([]);
    const [currentCategory, setCurrentCategory] = useState([]);

    const FetchAllFacts = () => {
        fetch(BACKEND_URL + "/get_all_facts", {
            method: 'GET',
            headers: {
             'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors'
        }).then(response => response.json())
          .then(data => {
            setAllFacts(data);
      });
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
            setAllFacts(data);
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
            <MapMarker/>
          </Map>
        </APIProvider>
    )
}

export default CoreMap;