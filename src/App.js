import './App.css';
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
  const [allAccessibleCategories, setAllAccessibleCategories] = useState([]);
  const [allOwnedCategories, setAllOwnedCategories] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [allFactsOfOwnedCategories, setAllFactsOfOwnedCategories] = useState([]);
  const [allAccessibleFacts, setAllAccessibleFacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersOfOwnedCategories, setAllUsersOfOwnedCategories] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [hasLocationPermissions, setHasLocationPermissions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [tutorialMode, setTutorialMode] = useState(false);
  const [addTutorialMode, setAddTutorialMode] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  // -1: not attempted/logged out
  // 0: login failed
  // 1: login successful
  const [loginState, setLoginState] = useState(-1);

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
    getAllUserAllowedCategories();
    getAllFacts();
    getAllFactsOfAccess();
    getAllUsers();
    
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

  useEffect(() => {
    if (currentUser != null) {
      getAllUserAllowedCategories();
      getAllFactsOfAccess();
      getAllOwnedCategories();
      getAllFactsOfOwnedCategories();
      getAllUsersOfOwnedCategories();
    }
  }, [currentUser]);

  const setWithExpiry = async (key, value, expiryTime = null, expiryMult = null) => {
    const data = {
      value: value,
      expiry: expiryTime ? Date.now() + (expiryTime * expiryMult) : null
    };
    
    await Preferences.set({
      key: key,
      value: JSON.stringify(data)
    });
  }

  const getWithExpiry = async (key) => {
    const { value } = await Preferences.get({ key: key });
    
    if (!value) {
      return null;
    }
    
    try {
      const data = JSON.parse(value);
      
      // Check if has expiry and if it's expired
      if (data.expiry && Date.now() > data.expiry) {
        // Expired - remove it
        await Preferences.remove({ key: key });
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error(`Error parsing preference "${key}":`, error);
      return null;
    }
  }

  const hasValidStoredValue = async (key) => {
    const value = await getWithExpiry(key);
    return value !== null;
  }

  const removeWithExpiry = async (key) => {
    await Preferences.remove({ key: key});
  }

  const checkPermissions = async () => {
    const status = await Geolocation.checkPermissions();
    
    if (status.location === 'granted') {
      setHasLocationPermissions(true);
      return;
    }
    
    // Request permissions - this will show the native dialog
    const requestResult = await Geolocation.requestPermissions({ 
      permissions: ['location'] 
    });
    
    // Check the result of the request
    if (requestResult.location === 'granted') {
      setHasLocationPermissions(true);
      return;
    }
    
    // If still 'prompt', try actually getting position to verify
    // This is the key: temporary perms will allow getCurrentPosition to succeed
    if (requestResult.location === 'prompt') {
      try {
        await Geolocation.getCurrentPosition({
          timeout: 5000,
          enableHighAccuracy: false
        });
        // If we got here, we have functional location access (likely temporary)
        setHasLocationPermissions(true);
        return;
      } catch (error) {
        console.log('Position request failed:', error);
        // Actually denied or user dismissed prompt
        setShowFailModal(true);
        return;
      }
    }
  
    // Explicit denial
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
    const currentDateString = currentDate.toISOString().split('T')[0];
    const { value } = await Preferences.get({key: 'lastLoginDay'});

    if (value === null) {
      // App is on first run, create a key with today
      // We don't need to update the lastLoginDay on the db
      // Because it's handled on user creation
      await Preferences.set({key: 'lastLoginDay', value: currentDateString});
      
      checkForUserLevelup('daysUsed', 1);
      return;
    } else {
      // If it's a different day than the stored date, update the date and achievements
      if (value !== currentDateString) {
        await Preferences.set({key: 'lastLoginDay', value: currentDateString});

        updateLoginDay(currentDateString);
        checkForUserLevelup('daysUsed', 1);
      }
    }
  }

  const updateLoginDay = async (dateString) => {
    let JSONString = JSON.stringify({id: currentUser.id, lastLoginDay: dateString});

    const response = await fetch(BACKEND_URL + "/change_last_login_day", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      mode: 'cors',
      body: JSONString
    }).catch(error => {
      console.error(error);
    });
  }

  const checkForUserOwnedCategories = async () => {
    let tempCategories = null;
    let userID = await getWithExpiry('user');

    await fetch(BACKEND_URL + "/get_all_owned_categories?id=" + userID, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors'
    }).then(response => {
      if(!response.ok) {
        console.error('Getting user with cookie ID failed');
        return null;
      }

      return response.json();
    }).then(data => {

      if (data == null) {
        return null;
      }

      tempCategories = data;
    }).catch(error => {
      console.error('Error: ', error);
      return null;
    });

    return tempCategories;
  }

  const checkForExistingUser = useCallback(async () => {
    let userID = await getWithExpiry('user');

    if (userID != null) {
      // We already have a login session, fetch data based on that
      let tempUser = {};

      await fetch(BACKEND_URL + "/get_user_by_id?id=" + userID, {
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
        tempUser.privateCategoryAccess = data[0].private_access_array;
      }).catch(error => {
        console.error('Error: ', error);
        throw new Error(error);
      });

      tempUser.ownedCategories = await checkForUserOwnedCategories();

      await fetch(BACKEND_URL + "/get_user_all_stats_by_id?id=" + userID, {
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

      await fetch(BACKEND_URL + "/get_user_all_achievements_by_id?id=" + userID, {
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

  const checkForUserLevelup = async (statString, valueToAdd) => {
    // Run the fetch to achievements here, then if we did level up update currentUser data
    // Also update completions, based on the full list of acheivements and statString
    try {
      let JSONString = JSON.stringify({id: currentUser.id, stat: statString, statValue: valueToAdd});

      // First, update the stat
      const response = await fetch(BACKEND_URL + "/add_to_achievement", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors',
          body: JSONString
      });

      const data = await response.json();
      
      if (data.error) {
          console.error("Achievements failed to update - invalid data!");
          return;
      }

      // check achievements AFTER the stat is updated
      const newStatValue = currentUser[statString] + valueToAdd;
      
      achievements.forEach(achievement => {
        if (achievement.statBase === statString && !achievement.completed) {
          if (newStatValue >= achievement.target) {
            let achievementJSON = JSON.stringify({id: currentUser.id, stat: achievement.title});
            
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
                    fireNotifications(currentUser, false, true, achievement.title);
                } else {
                    console.error("Something went wrong updating achievements! " + response);
                }
                return response.json();
            });
          }
        }
      });

      // Handle level up notification
      if (data.leveled) {
          let tempUser = {
              level: data.user.level,
              xp: data.user.xp,
              daysUsed: data.user.daysUsed,
              factsPlaced: data.user.factsPlaced,
              factsViewed: data.user.factsViewed,
              range: data.user.userRange
          };

          fireNotifications(tempUser, true);
          setCurrentUser(tempUser);
      }
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

  const getAllFactsOfAccess = async () => {
    let tempFacts = null;
    let userID = await getWithExpiry('user');

    if (currentUser != null) {
      if (currentUser.permLevel >= 2) {
        await fetch(BACKEND_URL + "/get_all_facts", {
            method: 'GET',
            headers: {
              'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
              'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors'
        }).then(response => response.json())
          .then(data => {
            tempFacts = data;
            setAllFacts(data);
        });
      }
      await fetch(BACKEND_URL + "/get_all_facts_of_access?id=" + userID, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => {
        if(!response.ok) {
          console.error('Getting facts with cookie ID failed');
          return null;
        }

        return response.json();
      }).then(data => {

        if (data == null) {
          return null;
        }

        tempFacts = data;
      }).catch(error => {
        console.error('Error: ', error);
        return null;
      });
    } else {
      await fetch(BACKEND_URL + "/get_all_public_facts", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors'
      }).then(response => {
        if(!response.ok) {
          console.error('Getting public facts failed');
          return null;
        }

        return response.json();
      }).then(data => {

        if (data == null) {
          return null;
        }

        tempFacts = data;
      }).catch(error => {
        console.error('Error: ', error);
        return null;
      });
    }

    setAllAccessibleFacts(tempFacts);
  }

  const getAllFactsOfOwnedCategories = async () => {
    let tempFacts = null;
    let userID = await getWithExpiry('user');

    await fetch(BACKEND_URL + "/get_all_facts_of_owned_categories?id=" + userID, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors'
    }).then(response => {
      if(!response.ok) {
        console.error('Getting user with cookie ID failed');
        return null;
      }

      return response.json();
    }).then(data => {

      if (data == null) {
        return null;
      }

      tempFacts = data;
    }).catch(error => {
      console.error('Error: ', error);
      return null;
    });

    setAllFactsOfOwnedCategories(tempFacts);
  }

  const getAllUsersOfOwnedCategories = async () => {
    let tempUsers = null;
    let userID = await getWithExpiry('user');

    await fetch(BACKEND_URL + "/get_all_users_of_owned_categories?id=" + userID, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors'
    }).then(response => {
      if(!response.ok) {
        console.error('Getting user with cookie ID failed');
        return null;
      }

      return response.json();
    }).then(data => {

      if (data == null) {
        return null;
      }

      tempUsers = data;
    }).catch(error => {
      console.error('Error: ', error);
      return null;
    });

    setAllUsersOfOwnedCategories(tempUsers);
  }

  const getAllOwnedCategories = async () => {
    let tempCategories = null;
    let userID = await getWithExpiry('user');

    await fetch(BACKEND_URL + "/get_all_owned_categories?id=" + userID, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors'
    }).then(response => {
      if(!response.ok) {
        console.error('Getting user with cookie ID failed');
        return null;
      }

      return response.json();
    }).then(data => {

      if (data == null) {
        return null;
      }

      tempCategories = data;
    }).catch(error => {
      console.error('Error: ', error);
      return null;
    });

    setAllOwnedCategories(tempCategories);
  }

  const getAllUserAllowedCategories = async () => {
    let tempCategories = null;
    let userID = await getWithExpiry('user');

    if (currentUser != null) {
      if (currentUser.permLevel >= 2) {
        await fetch(BACKEND_URL + "/get_all_categories", {
            method: 'GET',
            headers: {
              'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
              'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors'
        }).then(response => response.json())
          .then(data => {
            tempCategories = data;
            setAllCategories(data);
        });
      }
      await fetch(BACKEND_URL + "/get_all_user_allowed_categories?id=" + userID, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => {
        if(!response.ok) {
          console.error('Getting user with cookie ID failed');
          return null;
        }

        return response.json();
      }).then(data => {

        if (data == null) {
          return null;
        }

        tempCategories = data;
      }).catch(error => {
        console.error('Error: ', error);
        return null;
      });
    } else {
      await fetch(BACKEND_URL + "/get_all_public_categories", {
          method: 'GET',
          headers: {
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
            'Content-Type': 'application/json;charset=utf-8'
          },
          mode: 'cors'
      }).then(response => {
        if(!response.ok) {
          console.error('Getting user with cookie ID failed');
          return null;
        }

        return response.json();
      }).then(data => {
        if (data == null) {
          return null;
        }

        tempCategories = data;
      }).catch(error => {
        console.error('Error: ', error);
        return null;
      });
    }

    setAllAccessibleCategories(tempCategories);
  }

  const researchValue = useMemo(() => ({
    allCategories,
    allAccessibleCategories,
    allOwnedCategories, 
    allFacts,
    allAccessibleFacts,
    allFactsOfOwnedCategories,
    allUsers,
    allUsersOfOwnedCategories,
    getCategoryTitleFromID,
    getAllCategories, 
    getAllFacts,
    getAllUsers, 
    getCurrentLocation, 
    currentUser, 
    setCurrentUser, 
    isLoggedIn, 
    setIsLoggedIn, 
    checkForExistingUser,
    logoutCurrentUser,
    checkForUserLevelup,
    setAddTutorialMode,
    loginState,
    setLoginState,
    setWithExpiry,
    getWithExpiry,
    removeWithExpiry,
    getAllUsersOfOwnedCategories,
    getAllFactsOfOwnedCategories,
    getAllFactsOfAccess,
    getAllUserAllowedCategories,
    getAllOwnedCategories,
    hasLocationPermissions
  }), [
    allCategories, 
    allAccessibleCategories,
    allOwnedCategories, 
    allFacts,
    allAccessibleFacts,
    allFactsOfOwnedCategories,
    allUsers,
    allUsersOfOwnedCategories,
    getCategoryTitleFromID,
    getAllCategories, 
    getAllFacts,
    getAllUsers,
    getCurrentLocation, 
    currentUser, 
    isLoggedIn, 
    checkForExistingUser,
    getAllUsersOfOwnedCategories,
    getAllFactsOfOwnedCategories,
    getAllFactsOfAccess,
    getAllUserAllowedCategories,
    getAllOwnedCategories,
    hasLocationPermissions
  ]);

  return (
    <div className="App">
      
      <BrowserRouter>
        <ResearchContext.Provider value={researchValue}>
          <TutorialModal show={tutorialMode} onClose={() => setTutorialMode(false)} pageCount={6} titles={mainTutorialTitles} descriptions={mainTutorialMessages} Icons={mainTutorialIcons}/>

          <TutorialModal show={addTutorialMode} onClose={() => setAddTutorialMode(false)} pageCount={1} titles={addTutorialTitles} descriptions={addTutorialMessages} Icons={addTutorialIcons}/>

          <Modal show={showFailModal} onClose={() => setShowFailModal(false)} title={"GPS Error!"} message={"This app requires location permissions. Without them, you're stuck at the Space Needle forever."} warningLevel={0} action={checkPermissions} actionText={"Try Again"}/>

          <Navbar/>
          {(showNotifications) && notifications.map((notif, index) => (
            <Notification message={notif.message} isVisible={showNotifications} onHide={removeNotification} index={index} key={notif.id} />
          ))}
          <Routes>
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
