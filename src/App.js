import './App.css';
import Cookies from 'universal-cookie';
import { useCallback, useEffect, useState, useMemo } from "react";
import MapPage from './Components/Pages/map';
import InputPage from './Components/Pages/input';
import ProfilePage from './Components/Pages/profile';
import LoginPage from './Components/Pages/login';
import AdminPage from './Components/Pages/Admin';
import Navbar from './Components/Navbar';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ResearchContext, LocationContext } from './Components/ResearchContext';
import { BACKEND_URL, CLIENT_AUTH_SECRET, GOOGLE_LOGIN_CLIENT_ID, GOOGLE_LOGIN_IOS_ID } from './secrets';
import { Geolocation } from '@capacitor/geolocation';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Preferences } from '@capacitor/preferences';
import Notification from './Components/Subcomponents/Notification';
import achievements from './AchievementData';
import { Modal, TutorialModal } from './Components/Subcomponents/Modal';
import BookIcon from '@mui/icons-material/Book';
import StarRateIcon from '@mui/icons-material/StarRate';
import CreateIcon from '@mui/icons-material/Create';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import GavelIcon from '@mui/icons-material/Gavel';

const cookies = new Cookies();

const mainTutorialTitles = [
  "Welcome to FactDrop!",
  "Map Controls",
  "Facts And Categories",
  "Your Profile",
  "Rules and Moderation",
  "Enjoy!"
]

const mainTutorialMessages = [
  "Thanks for downloading FactDrop! Here you can leave messages or facts for other users to find - so long as they're in range of the message in real life.",
  "You can use your finger to scroll around on the map, but it will always move itself back to your current position. If you want to see a fact elsewhere, better get moving! You can also change the zoom level in the bottom left of your screen, and refresh the map and its facts in the top left.",
  "When you're in range of a fact, tap its marker on the map to open a preview! If you want to Read More, press the button that says just that. You can also sort by categories by opening the category menu in the bottom middle of your screen. If you want to add a fact, press the button in the bottom right!",
  "Actions like viewing facts, adding facts, and logging in daily earn you experience and achievements! Check out your profile at the button in the top right. P.S. No, spam viewing the same fact won't earn you xp. Neither will spam creating facts. Good try, though!",
  "Treat this like any other open-input forum. Don't be hateful, don't post your crypto scam link, and definitely don't post your social security number. Yes, this is moderated (and if you're a moderator, you can access your mod tools through the button at the top right.)",
  "I hope you enjoy FactDrop! If you have any feedback (or you find a bug), please email coreycoofficial@gmail.com."
]

const mainTutorialIcons = [
  <img src='/icon-only.webp'/>, // 1: main icon
  <ZoomOutMapIcon />, // 2: zoom
  <CreateIcon />, // 3: pencil
  <StarRateIcon />, // 4: star
  <GavelIcon />, // 5: rules
  <BookIcon /> // 6: book
]

const addTutorialTitles = [
  "Adding Your First Fact"
]

const addTutorialMessages = [
  "To get started adding a fact, click anywhere within your range after hitting the add button. You'll then need to write a title, the message itself, and choose a category. After that you're good to go!"
]

const addTutorialIcons = [
  <CreateIcon />
]

function sanitizeColumnName(title) {
  // Remove all non-alphanumeric characters (keeps only letters and numbers)
  let sanitized = title.replace(/[^a-zA-Z0-9]/g, '');
  
  // Ensure it starts with a letter (MySQL requirement)
  if (!/^[a-zA-Z]/.test(sanitized)) {
    sanitized = 'achievement_' + sanitized;
  }
  
  // Limit length to 64 characters (MySQL column name limit)
  if (sanitized.length > 64) {
    sanitized = sanitized.substring(0, 64);
  }
  
  return sanitized;
}

const secretPath = process.env.REACT_APP_SECRET_ENV || 'secrets';

function App() {

  const [allCategories, setAllCategories] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [tutorialMode, setTutorialMode] = useState(false);
  const [addTutorialMode, setAddTutorialMode] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  useEffect(() => {
    async function importClientID() {
      const { GOOGLE_LOGIN_CLIENT_ID } = await import(`./${secretPath}`);

      await SocialLogin.initialize({
        google: {
          webClientId: GOOGLE_LOGIN_CLIENT_ID,
          iOSClientId: GOOGLE_LOGIN_IOS_ID
        }
      });
    }
    importClientID();

    checkPermissions();

    checkForFirstRun();

    getAllCategories();
    getAllFacts();
    getAllUsers();
    getCurrentLocation();
    
    checkForExistingUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    
  }, [secretPath]);

  useEffect(() => {
    if (isLoggedIn) {
      checkForSigninDay();
    }
  }, [isLoggedIn]);

  const checkPermissions = async () => {
    const status = await Geolocation.checkPermissions();

    if (status.location === 'granted') {
      return; // Clear to continue
    } else if (status.location === 'denied' || status.location === 'prompt') {
      // Try prompting for permissions, any status other than granted
      // Is a fail state for the app
      const status2 = await Geolocation.requestPermissions({ permissions: 'location'});

      if (status2 === 'granted') {
        return; //resume normal flow
      }
    }

    // If we haven't returned yet we're in a fail state. Inform the user of this
    setShowFailModal(true);
  }

  const checkForFirstRun = async () => {
    const { value } = await Preferences.get({key: 'tutorialComplete'});

    if (value === null) {
      // Activate the tutorial
      setTutorialMode(true);

      // And don't let it activate again afterwards
      await Preferences.set({key: 'tutorialComplete', value: 'true'});
    }
  }

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

  const checkForSigninDay = async () => {
    const currentDate = new Date();
    const { value } = await Preferences.get({key: 'lastLoginDay'});

    if (value === null) {
      // App is on first run, create a key with today
      await Preferences.set({key: 'lastLoginDay', value: currentDate.getUTCDate()});
      console.log(currentDate.getUTCDate());
    }

    // If it's a different day than the stored date, update the date and achievements
    // This only runs if checkForExistingUser finds a user so it should be fine
    // It also runs on new login
    if (value != new Date().getUTCDate()) {
      await Preferences.set({key: 'lastLoginDay', value: currentDate.getUTCDate()});

      console.log("new day");

      checkForUserLevelup('daysUsed', 1);
    }
  }

  const checkForExistingUser = useCallback(async () => {
    if (cookies.get('user')) {
      // We already have a login session, fetch data based on that
      let tempUser = {};

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
        throw new Error(error);
      });

      await fetch(BACKEND_URL + "/get_user_all_stats_by_id?id=" + cookies.get('user').replace('id_', ''), {
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
        throw new Error(error);
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
        let tempAchievementKeys = {};
        let keys = Object.keys(data[0]);
        let values = Object.values(data[0]);

        for (let i = 0; i < keys.length; i++) {
          if (values[i] === null || values[i] == 0) {
            tempAchievementKeys[keys[i]] = false;
          }
          tempAchievementKeys[keys[i]] = values[i];
        }

        tempUser.achievementKeys = tempAchievementKeys;
      }).catch(error => {
        console.error('Error: ', error);
        throw new Error(error);
      });

      setCurrentUser(tempUser);
      setIsLoggedIn(true);
    }
  }, []);

  const checkForUserLevelup = (statString, valueToAdd) => {
    // Run the fetch to achievements here, then if we did level up update currentUser data
    // Also update completions, based on the full list of acheivements and statString
    try {
        let JSONString = JSON.stringify({id: currentUser.id, stat: statString, statValue: valueToAdd});

        achievements.forEach(achievement => {
          if (achievement.statBase == statString && !achievement.completed) {
            if (currentUser[statString] + valueToAdd >= achievement.target) {
              let achievementJSON = JSON.stringify({id: currentUser.id, stat: achievement.title});
              // We completed an achievement - fire a notification if the achievement
              // data updates successfully
              fetch(BACKEND_URL + "/set_achievement_complete", {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
                    'Content-Type': 'application/json;charset=utf-8'
                  },
                  mode: 'cors',
                  body: achievementJSON
              }).then(response => {
                  if (response.ok) {
                      // Achievement was updated, fire a notification
                      fireNotifications(currentUser, false, true, achievement.title);
                  } else {
                      console.error("Something went wrong updating achievements! " + response)
                  }
                  return response.json();
              });
            }
          }
        });

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
    }
  }

  // This fires when we need to check if there has been a notified achievement,
  // not just an xp gain.
  const fireNotifications = (newUserData, leveled, achievement, achievementName) => {
    let notifCounter = 0;
    let tempNotifArray = [];

    if (leveled) {
      notifCounter++;
      tempNotifArray.push({message: "Level up! You are now level " + newUserData.level, id: Date.now()});
      console.log(tempNotifArray);
    } else if (achievement) {
      tempNotifArray.push({message: "New Achievement: " + achievementName + "!"})
    }
    else {
      return;
    }

    if (notifCounter > 0) {
      setShowNotifications(true);
      setNotifications(prev => [...prev, ...tempNotifArray]);
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
    setIsLoggedIn(false);
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
    cookies,
    checkForExistingUser,
    logoutCurrentUser,
    checkForUserLevelup,
    setAddTutorialMode
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
          <TutorialModal show={tutorialMode} onClose={() => setTutorialMode(false)} pageCount={6} titles={mainTutorialTitles} descriptions={mainTutorialMessages} Icons={mainTutorialIcons}/>

          <TutorialModal show={addTutorialMode} onClose={() => setAddTutorialMode(false)} pageCount={1} titles={addTutorialTitles} descriptions={addTutorialMessages} Icons={addTutorialIcons}/>

          <Modal show={showFailModal} onClose={() => setShowFailModal(false)} title={"GPS Error!"} message={"This app requires location permissions. Without them, you're stuck at the Space Needle forever."} warningLevel={0}/>

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
