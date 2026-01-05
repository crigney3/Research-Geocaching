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
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ResearchContext, LocationContext } from './Components/ResearchContext';
import { BACKEND_URL, CLIENT_AUTH_SECRET, GOOGLE_LOGIN_CLIENT_ID } from './secrets';
import { Geolocation } from '@capacitor/geolocation';
import { SocialLogin } from '@capgo/capacitor-social-login';
import Notification from './Components/Subcomponents/Notification';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_LOGIN_CLIENT_ID
      }
    })

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
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
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
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
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
      await fetch(BACKEND_URL + "/get_all_users_with_achievements", {
          method: 'GET',
          headers: {
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => response.json())
        .then(data => {
          let tempUsers = [];

          data.forEach((user) => {
            let tempUser = {};

            tempUser.id = user.id;
            tempUser.username = user.username;
            tempUser.permLevel = user.permissions;
            tempUser.dateJoined = user.dateJoined;
            tempUser.lastLogin = user.lastLoginDay;
            tempUser.level = user.level;
            tempUser.xp = user.xp;
            tempUser.daysUsed = user.daysUsed;
            tempUser.factsPlaced = user.factsPlaced;
            tempUser.factsViewed = user.factsViewed;
            tempUser.range = user.userRange;

            tempUsers.push(tempUser);
          })
          setAllUsers(tempUsers);
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
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
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
        tempUser.dateJoined = data[0].dateJoined;
        tempUser.lastLogin = data[0].lastLoginDay;
      }).catch(error => {
            console.error('Error: ', error);
      });

      await fetch(BACKEND_URL + "/get_user_all_achievements_by_id?id=" + cookies.get('user').replace('id_', ''), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
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

  const checkForUserLevelup = (statString, valueToAdd) => {
    // Run the fetch to achievements here, then if we did level up update currentUser data
    try {
        let JSONString = JSON.stringify({id: currentUser.id, stat: statString, statValue: valueToAdd});

        fetch(BACKEND_URL + "/add_to_achievement", {
            method: 'POST',
            headers: {
              'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
              'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors',
            body: JSONString
        }).then(response => {
            if (response.ok) {
                // We don't generally inform the user of achievement tracking
            } else {
                console.error("Something went wrong updating achievements! " + response)
                // setModalConfig({
                //     title: 'Achievement Update Failed',
                //     message: 'There was an error updating your achievements. Level/XP may not reflect your updated ' + statString + '. Response code: ' + response.status,
                //     warningLevel: 0
                // });
                // setShowModal(true);
            }
            return response.json();
        }).then(data => {
          console.log(data);
          if (data.error) {
            console.error("Achievements failed to update - invalid data!");
          }
          if (data.leveled) {
            let tempUser = {};

            tempUser.level = data.user.level;
            tempUser.xp = data.user.xp;
            tempUser.daysUsed = data.user.daysUsed;
            tempUser.factsPlaced = data.user.factsPlaced;
            tempUser.factsViewed = data.user.factsViewed;
            tempUser.range = data.user.userRange;

            // Before we overwrite currentUser, check if we should fire
            // any achievement notifications
            fireNotifications(tempUser, true);

            setCurrentUser(tempUser);
          }
        });
    } catch(err) {
      console.error(err);
        // setModalConfig({
        //     title: 'Unexpected error!',
        //     message: err,
        //     warningLevel: 0
        // });
        // setShowModal(true);
    }
  }

  // This fires when we need to check if there has been a notified achievement,
  // not just an xp gain.
  const fireNotifications = (newUserData, leveled) => {
    let notifCounter = 0;
    let tempNotifArray = [];

    if (leveled) {
      notifCounter++;
      tempNotifArray.push({message: "Level up! You are now level " + newUserData.level, id: Date.now()});
      console.log(tempNotifArray);
    } // TODO: Add goal-based achievement checks, store goals somewhere to check against
    else {
      return;
    }

    if (notifCounter > 0) {
      setShowNotifications(true);
      setNotifications(prev => [...prev, ...tempNotifArray]);
      // setTimeout(() => {
      //   setShowNotifications(false);
      //   setNotifications([]);
      // }, 3500);
    }
  }

  const removeNotification = (indexToRemove) => {
    setNotifications(prev => prev.filter((_, index) => index !== indexToRemove));
    if (notifications.length <= 1) {
      setShowNotifications(false);
    }
  }

  const logoutCurrentUser = () => {
    setCurrentUser(null);
  }

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
    checkForExistingUser,
    logoutCurrentUser,
    checkForUserLevelup
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
        <ResearchContext.Provider value={researchValue}>

          <Navbar/>
          {(showNotifications) && notifications.map((notif, index) => (
            <Notification message={notif.message} isVisible={showNotifications} onHide={removeNotification} index={index} key={notif.id} />
          ))}
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
