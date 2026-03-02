import { Map, AdvancedMarker, useMap, useAdvancedMarkerRef, OverlayView } from '@vis.gl/react-google-maps';
import { MAP_ID, BACKEND_URL, CLIENT_AUTH_SECRET } from "../../secrets";
import { useState, useCallback, useContext, useEffect, useRef, memo, useMemo, Children, cloneElement } from 'react';
import MapMarker from './MapMarker';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import LockIcon from '@mui/icons-material/Lock';
import { LocationContext, ResearchContext } from '../ResearchContext';
import NavigationIcon from '@mui/icons-material/Navigation';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ComponentModal, LoginModal, Modal } from './Modal';
import InputPage from '../Pages/input.jsx';
import { Geolocation } from '@capacitor/geolocation';
import Select from "react-select";
import { Preferences } from '@capacitor/preferences';
import CloseIcon from '@mui/icons-material/Close';
import './Map.css';

const centerSeattle = {
  lat: 47.62045709976152,
  lng: -122.34932598909077
}

const containerStyle = {
  width: '400px',
  height: '400px',
}

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distanceInMeters = R * c;
  const distanceInFeet = distanceInMeters * 3.28084;
  
  return distanceInFeet;
};

const CoreMap = ({

}) => {
    const allFacts = useContext(ResearchContext).allAccessibleFacts;
    const [factsToShow, setFactsToShow] = useState([]);
    const allCategories = useContext(ResearchContext).allAccessibleCategories;
    const [currentCategoryFacts, setCurrentCategoryFacts] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [categoryWindowOpen, setCategoryWindowOpen] = useState(false);
    const [refreshClass, setRefreshClass] = useState('refresh-button');
    const [addWindowOpen, setAddWindowOpen] = useState(false);
    const [inputMode, setInputMode] = useState(false);
    const [showLoginRequirement, setShowLoginRequirement] = useState(false);
    const [showRangeError, setShowRangeError] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const [selectedCoords, setSelectedCoords] = useState({lat: 0, lng: 0});

    const [mapMarkers, setMapMarkers] = useState([]);
    const rangeRef = useRef(null);
    const currentLocRef = useRef(null);

    const map = useMap();

    const loginState = useContext(ResearchContext).loginState;
    const setLoginState = useContext(ResearchContext).setLoginState;
    const refreshFacts = useContext(ResearchContext).getAllFactsOfAccess;
    const refreshCategories = useContext(ResearchContext).getAllUserAllowedCategories;
    const currentUser = useContext(ResearchContext).currentUser;
    const setAddTutorialMode = useContext(ResearchContext).setAddTutorialMode;
    const setEulaModal = useContext(ResearchContext).setShowEULAModal;

    useEffect(() => {
        createMapMarkers();
    }, [factsToShow]);

    const getCurrentLocation = useCallback(() => currentLocRef.current, []);

    useEffect(() => {
      let tempFacts = [];

      allFacts.forEach((fact) => {
        if (currentCategory === null) {
          tempFacts.push(fact);
        } else {
          if(fact.category === currentCategory.value) {
            tempFacts.push(fact);
          }
        }
      });

      setFactsToShow(tempFacts);
    }, [allFacts, currentCategory]);

    useEffect(() => {
      if (selectedCoords.lat !== 0 &&
          selectedCoords.lng !== 0) {
        toggleInputWindow(true);
        setInputMode(false);
      }
    }, [selectedCoords]);

    const createMapMarkers = () => {
        let tempMarkers = [];

        factsToShow.forEach((fact) => {
            tempMarkers.push(<MapMarker key={fact.id} id={fact.id} title={fact.title} description={fact.description} lat={fact.lat} lng={fact.lng} category={fact.category} user={fact.username} rangeRef={rangeRef} getCurrentLocation={getCurrentLocation}/>);
        })

        setMapMarkers(tempMarkers);
    }

    const checkForFirstAdd = async () => {
      const { value } = await Preferences.get({key: 'addTutorialComplete'});

      if (value === null) {
        // Activate the tutorial
        setAddTutorialMode(true);

        // And don't let it activate again afterwards
        await Preferences.set({key: 'addTutorialComplete', value: 'true'});
      }
    }

    const FetchAllFactsOfCategory = (category) => {
        fetch(BACKEND_URL + "/get_all_facts_of_category", {
            method: 'GET',
            headers: {
             'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
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
      refreshCategories();
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
      checkForFirstAdd();
      setInputMode(true);
    }

    const handleSetSelectedCoords = useCallback((e) => {
      if (inputMode) {
        if (calculateDistance(currentLocRef.current.lat, currentLocRef.current.lng, e.detail.latLng.lat, e.detail.latLng.lng) <= currentUser.range) {
          setSelectedCoords({lat: e.detail.latLng.lat, lng: e.detail.latLng.lng});
        } else {
          // That's out of range, show an error modal
          // This check is extremely jank on desktop due to the low precision of desktop GPS
          setShowRangeError(true);
        }
        
      }
    }, [inputMode]);

    const toggleLoginPopup = (e) => {
        setShowLoginRequirement(false);
        setShowLogin(!showLogin);
    }

    const toggleLoginRequirement = async (e) => {
      const { value } = await Preferences.get({ key: "eula" });

      if (value == null || value == "false") {
          setEulaModal(true);
      } else if (value === "true") {
        setShowLoginRequirement(!showLoginRequirement);
      }
    }

    const memoMapProps = useMemo(() => ({
      className: 'MainMap',
      defaultZoom: 19,
      gestureHandling: 'greedy',
      disableDoubleClickZoom: true,
      zoomControl: true,
      zoomControlOptions: {position: 6},
      disableDefaultUI: true,
      mapId: MAP_ID,
      onClick: handleSetSelectedCoords 
    }), [handleSetSelectedCoords]);

    useEffect(() => {
        categoriesToOptions();
    }, [allCategories]);

    const categoriesToOptions = () => {
        let tempCat = [];

        allCategories.forEach((cat) => {
            tempCat.push({value: cat.id, label:cat.title, private: cat.private});
        });

        setCategoryOptions(tempCat);
    }

    const handleCatChange = (category) => {
      setCurrentCategory(category);
      setCategoryWindowOpen(false);
    }

    const CategorySelect = ({ options, onChange }) => {
      
      const customCategoryStyles = {
        option: (provided, state) => {
          const bgColor = state.data.private 
          ? 'rgba(76, 38, 131, 0.5)' 
          : 'rgba(246, 139, 31, 0.5)';

          return {
          ...provided,
          backgroundColor: '#FFFFFF',
          color: '#000000',
          padding: '12px 16px',
          cursor: 'pointer',
        }},
        singleValue: (provided, state) => ({
          ...provided,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        })
      };

      const normalizedOptions = options.map(option => ({
        ...option,
        private: option.private ?? false
      }));

      const formatOptionLabel = (option) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: "8px" }}>
          <span>{option.label}</span>
          {option.private && <LockIcon style={{ fontSize: '16px', opacity: 0.7 }} />}
        </div>
      );

      return (
      <div className="react-select-container">
          <Select 
              options={normalizedOptions}
              onChange={onChange}
              className="react-select-category-dropdown"
              classNamePrefix="react-select"
              maxMenuHeight={250}
              isSearchable={false}
              styles={customCategoryStyles}
              value={currentCategory && { label: currentCategory.label, private: currentCategory.private ?? false}}
              formatOptionLabel={formatOptionLabel}
          />
      </div>
    )};

    const toggleCategoryWindow = () => {
      setCategoryWindowOpen(!categoryWindowOpen);
    }

    const handleFilterClear = () => {
      setCurrentCategory(null);
      setCategoryWindowOpen(false);
    }

    return (
      <>
          <button className={refreshClass} onClick={handleRefresh}>
            <RefreshIcon/>
          </button>

          {(currentUser !== null) && <button className={`add-button ${inputMode ? 'input-mode-active' : ''}`} onClick={inputMode ? () => setInputMode(false) : handleAddButtonClicked}>
            {inputMode ? <CloseIcon /> : <AddLocationAltIcon />}
          </button>}

          {(currentUser === null) && <button className='add-button' onClick={toggleLoginRequirement}>
            <AddLocationAltIcon/>
          </button>}

          <button className='category-toggle-button' onClick={toggleCategoryWindow}>
            <KeyboardDoubleArrowUpIcon />
          </button>

          {/* Overlay */}
          {categoryWindowOpen && (
            <div className='category-overlay' onClick={toggleCategoryWindow} />
          )}

          {/* Sliding category window */}
          <div className={`category-window ${categoryWindowOpen ? 'open' : ''}`}>
            <button className='category-close-button' onClick={toggleCategoryWindow}>
              <KeyboardDoubleArrowDownIcon />
            </button>
            
            <div className='category-content'>
              <label>Select Category:</label>
              <CategorySelect options={categoryOptions} onChange={handleCatChange}/>
            </div>

            <button className='clear-filter-button' onClick={handleFilterClear}>Clear</button>
          </div>

          <ComponentModal show={addWindowOpen} onClose={toggleInputWindow} component={<InputPage inLat={selectedCoords.lat} inLng={selectedCoords.lng}/>}/>

          <LoginModal show={showLogin} onClose={toggleLoginPopup} loginState={loginState} setLoginState={setLoginState}/>

          <Modal show={showLoginRequirement} onClose={toggleLoginRequirement} title={"Not Logged In"} message={"You need to log in first!"} warningLevel={1} action={toggleLoginPopup} actionClass={'success'} actionText={"Login"}/>

          <Modal show={showRangeError} onClose={() => {setShowRangeError(false)}} title={"Out of range!"} message={"Try picking a spot within your range."} warningLevel={1}/>

          <div style={{position: 'relative'}}>
            <MapSubComponent rangeRef={rangeRef} currentLocRef={currentLocRef} {...memoMapProps}>
              {!inputMode && mapMarkers}
            </MapSubComponent>
          </div>
        </>
    )
}

const MapSubComponent = memo(({rangeRef, currentLocRef, children, ...props}) => {
  const [currentLoc, setCurrentLoc] = useState({lat: centerSeattle.lat, lng: centerSeattle.lng, heading: 0});
  const [userLoc, setUserLoc] = useState(null);
  const [isUserDragging, setIsUserDragging] = useState(false);
  const [circleRadius, setCircleRadius] = useState(0);
  const [userRange, setUserRange] = useState(100);
  
  const map = useMap();
  const dragTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const releaseTimeRef = useRef(null);
  const hasInitializedRef = useRef(false);

  const currentUser = useContext(ResearchContext).currentUser;
  const hasLocationPermissions = useContext(ResearchContext).hasLocationPermissions;

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

  useEffect(() => {
    if (currentUser !== null) {
      setUserRange(currentUser.range);
    } else {
      setUserRange(100);
    }
  }, [currentUser]);
  
  useEffect(() => {
    currentLocRef.current = currentLoc;

    // Run animation on first real location update
    if (!hasInitializedRef.current && 
        currentLoc.lat !== centerSeattle.lat && 
        currentLoc.lng !== centerSeattle.lng) {
      hasInitializedRef.current = true;
      // Small delay to ensure map is ready
      setTimeout(() => {
        startReturnAnimation();
      }, 100);
    }
  }, [currentLoc]);

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
    console.log(hasLocationPermissions);
    if (!hasLocationPermissions) {
      return;
    }

    // Watch our position so it updates constantly
    const callbackID = Geolocation.watchPosition({
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 2000
    }, (coords) => {
      setUserLoc(coords);
    });

    return () => Geolocation.clearWatch({id: callbackID});
  }, [hasLocationPermissions]);

  useEffect(() => {
    if (!map) return;

    const handleDragStart = () => {
      setIsUserDragging(true);
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handleDragEnd = () => {
      setIsUserDragging(false);
      releaseTimeRef.current = Date.now();
      
      // Wait 0.1 seconds after release before starting return animation
      dragTimeoutRef.current = setTimeout(() => {
        startReturnAnimation();
      }, 100);
    };

    const dragStartListener = map.addListener('dragstart', handleDragStart);
    const dragEndListener = map.addListener('dragend', handleDragEnd);

    return () => {
      if (dragStartListener) dragStartListener.remove();
      if (dragEndListener) dragEndListener.remove();
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (isUserDragging) return;

    map.panTo({ lat: currentLoc.lat, lng: currentLoc.lng });
  }, [currentLoc]);

  const startReturnAnimation = () => {
    if (!map) return;

    const startTime = Date.now();
    const duration = 2000; // 2 seconds
    const startCenter = map.getCenter();
    const targetLat = currentLocRef.current.lat;
    const targetLng = currentLocRef.current.lng;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Exponential easing out function (starts slow, accelerates)
      const easedProgress = progress === 1 ? 1 : Math.pow(2, 15 * progress - 15);
      
      const currentLat = startCenter.lat() + (targetLat - startCenter.lat()) * easedProgress;
      const currentLng = startCenter.lng() + (targetLng - startCenter.lng()) * easedProgress;
      
      map.panTo({ lat: currentLat, lng: currentLng });
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };
    
    animate();
  };

  const handleZoomChanged = useCallback(() => {
    setCircleRadius(calculateCircleRadius());
  }, [map, userRange]);

  return (
    <Map
    defaultCenter={{lat: currentLoc.lat, lng: currentLoc.lng}}
    onZoomChanged={handleZoomChanged}
    onTilesLoaded={handleZoomChanged}
    {...props}>
      <UserLocationMarker inLoc={currentLoc} rangeRef={rangeRef} radius={circleRadius}/>
      <AdvancedMarker position={{lat: currentLoc.lat, lng: currentLoc.lng}} style={{zIndex: 100000, transform: "translate(0%, 50%)"}}>
        <div 
          ref={rangeRef}
          className='RangeCircle' 
          style={{
            width: `${circleRadius * 2}px`,
            height: `${circleRadius * 2}px`,
          }}
        />
      </AdvancedMarker>
      {children}
      {/* {Children.map(children, child => 
        cloneElement(child, { getCurrentLocation })
      )} */}
    </Map>
  );
});

const UserLocationMarker = (inLoc) => {
  const [currentLoc, setCurrentLoc] = useState({});

  useEffect(() => {
    setCurrentLoc({
        lat: inLoc.inLoc.lat,
        lng: inLoc.inLoc.lng,
        heading: inLoc.inLoc.heading
      });
  }, [inLoc]);

  if (currentLoc == null) {
    return null;
  }

  return (
    <>
    <AdvancedMarker position={{lat: currentLoc.lat, lng: currentLoc.lng}} style={{zIndex: 100000, transform: "translate(0%, 50%)"}}>
      <NavigationIcon style={{
          transform: `rotate(${currentLoc.heading}deg)`,
          color: "#F68B1F"
        }}/>
    </AdvancedMarker>
    </>
  );
}

export default CoreMap;