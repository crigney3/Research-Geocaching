import './App.css';
import Cookies from 'universal-cookie';
import { useCallback, useEffect, useState, useMemo } from "react";
import MapPage from './Components/Pages/map';
import InputPage from './Components/Pages/input';
import ProfilePage from './Components/Pages/profile';
import LoginPage from './Components/Pages/login';
import HomePage from './Components/Pages/home';
import AdminPage from './Components/Pages/Admin';
import Navbar from './Components/Navbar';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ResearchContext, LocationContext } from './Components/ResearchContext';
import { BACKEND_URL } from './secrets';
import { Geolocation } from '@capacitor/geolocation';

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

function App() {

  const [allCategories, setAllCategories] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    getAllCategories();
    getAllFacts();
    getAllUsers();
    getCurrentLocation();
    
    checkForExistingUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, []);

  const getAllCategories = useCallback(async () => {
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
  }, []);

  const getAllFacts = useCallback(async () => {
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
  }, []);

  const getAllUsers = useCallback(async () => {
    try {
      await fetch(BACKEND_URL + "/get_all_users", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => response.json())
        .then(data => {
          setAllUsers(data);
      });
    } catch (err) {
      console.log(err);
    }
  }, []);

  const getCategoryTitleFromID = useCallback((id, categories) => {
    let title = "Unknown";

    categories.some((cat) => {
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
  }, []);

  const checkForExistingUser = useCallback(async () => {
    if (cookies.get('user')) {
      // We already have a login session, fetch data based on that
      let tempUser = {};
      console.log(cookies.get('user').replace('id_', ''));

      await fetch(BACKEND_URL + "/get_user_by_id?id=" + cookies.get('user').replace('id_', ''), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => {
        if(!response.ok) {
          throw new Error('Getting user with cookie ID failed');
        }

        return response.json();
      }).then(data => {
        tempUser.id = data[0].id;
        tempUser.username = data[0].username;
        tempUser.permLevel = data[0].permissions;
      }).catch(error => {
            console.error('Error: ', error);
      });

      await fetch(BACKEND_URL + "/get_user_all_achievements_by_id?id=" + cookies.get('user').replace('id_', ''), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => {
        if(!response.ok) {
          throw new Error('Getting user achievements with cookie ID failed');
        }

        return response.json();
      }).then(data => {
        tempUser.level = data[0].level;
        tempUser.xp = data[0].xp;
        tempUser.daysUsed = data[0].daysUsed;
        tempUser.factsViewed = data[0].factsViewed;
        tempUser.factsPlaced = data[0].factsPlaced;
        tempUser.range = data[0].userRange;
      }).catch(error => {
            console.error('Error: ', error);
      });

      setCurrentUser(tempUser);
    }
  }, []);

  const researchValue = useMemo(() => ({
    allCategories, 
    allFacts,
    allUsers,
    getCategoryTitleFromID,
    getAllCategories, 
    getAllFacts,
    getAllUsers, 
    getCurrentLocation, 
    currentUser, 
    setCurrentUser, 
    isLoggedIn, 
    setIsLoggedIn, 
    testUser,
    cookies,
    checkForExistingUser
  }), [
    allCategories, 
    allFacts,
    allUsers,
    getCategoryTitleFromID,
    getAllCategories, 
    getAllFacts,
    getAllUsers,
    getCurrentLocation, 
    currentUser, 
    isLoggedIn, 
    checkForExistingUser
  ]);

  return (
    <div className="App">
      
      <BrowserRouter>
        <LocationContext.Provider value={{currentLocation}}>
        <ResearchContext.Provider value={researchValue}>

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
        </LocationContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
