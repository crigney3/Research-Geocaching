import './App.css';
import Cookies from 'universal-cookie';
import { useCallback, useEffect, useState } from "react";
import MapPage from './Components/Pages/map';
import InputPage from './Components/Pages/input';
import ProfilePage from './Components/Pages/profile';
import LoginPage from './Components/Pages/login';
import HomePage from './Components/Pages/home';
import AdminPage from './Components/Pages/Admin';
import Navbar from './Components/Navbar';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ResearchContext from './Components/ResearchContext';
import { BACKEND_URL } from './secrets';
import { Geolocation } from '@capacitor/geolocation';

function App() {

  const [allCategories, setAllCategories] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const cookies = new Cookies();

  const testUser = {
    id: 12397142,
    username: 'yakman3',
    permLevel: 3,
    level: 0,
    xp: 0,
    logins: 0,
    factsViewed: 0,
    factsPlaced: 0,
    range: 100
  }

  useEffect(() => {
    getAllCategories();
    getAllFacts();
    getCurrentLocation();

    // Watch our position so it updates constantly
    const callbackID = Geolocation.watchPosition({
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 2000
    }, (coords) => {
      setCurrentLocation(coords);
    });

    return () => Geolocation.clearWatch(callbackID);
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const coords = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 2000
      });
      setCurrentLocation(coords);
    } catch(err) {
      if (err.code !== 3) {
        console.log(err);
      }
    }
  });

  const getAllCategories = async () => {
    try {
      await fetch(BACKEND_URL + "/get_all_categories", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => response.json())
        .then(data => {
          setAllCategories(data);
        });
    } catch (err) {
      console.log(err);
    }
  }

  const getAllFacts = async () => {
    try {
      await fetch(BACKEND_URL + "/get_all_facts", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => response.json())
        .then(data => {
          setAllFacts(data);
      });
    } catch (err) {
      console.log(err);
    }
  }

  const getCategoryTitleFromID = (id) => {
    let title = "Unknown";

    allCategories.some((cat) => {
      if (cat.id == id) {
        title = cat.title;
        // This returns .some, not the outer function
        // It's a hacky way to make this a break foreach loop
        // I say hacky but the alternative is that this function
        // gets super laggy. So it's an optimization hacky
        return true;
      }
    });

    return title;
  }

  return (
    <div className="App">
      
      <BrowserRouter>
        <ResearchContext.Provider value={{
          allCategories, 
          allFacts, 
          getCategoryTitleFromID, 
          currentLocation, 
          getAllCategories, 
          getAllFacts, 
          getCurrentLocation, 
          currentUser, 
          setCurrentUser, 
          isLoggedIn, 
          setIsLoggedIn, 
          testUser,
          cookies}}>

          <Navbar/>
          <Routes>
            {/* <Route path="/" element={<HomePage/>}>

            </Route> */}
            <Route path='/' element={<MapPage/>}>

            </Route>
            <Route path='/input' element={<InputPage/>}>

            </Route>
            <Route path='/profile' element={<ProfilePage/>}>

            </Route>
            <Route path='/login' element={<LoginPage/>}>

            </Route>
            <Route path='/admin' element={<AdminPage/>}>

            </Route>
          </Routes>
        </ResearchContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
