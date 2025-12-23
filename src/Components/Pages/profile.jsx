import { useContext, useEffect, useState } from 'react';
import './profile.css';
import ResearchContext from '../ResearchContext';
import Achievement from '../Subcomponents/Achievement';
import { BACKEND_URL } from '../../secrets';

import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BookIcon from '@mui/icons-material/Book';
import StarRateIcon from '@mui/icons-material/StarRate';
import CreateIcon from '@mui/icons-material/Create';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { InputModal } from '../Subcomponents/Modal';

const ProfilePage = ({

}) => {
  const currentUser = useContext(ResearchContext).currentUser;
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    if (currentUser != null) {
      setIsUserLoaded(true);
      console.log(currentUser);
    }
  }, [])

  if(!isUserLoaded) {
    return null;
  }

  const getPermissionString = (permLevel) => {
    switch (permLevel) {
      case 0: return 'student';
      case 1: return 'professor';
      case 2: return 'administrator';
      case 3: return 'dev';
      default: return 'user';
    }
  };

  // Calculate level progress
  const xpPerLevel = 1000;
  const currentLevelXP = currentUser.xp % xpPerLevel;
  const levelProgress = (currentLevelXP / xpPerLevel) * 100;

  // Test achievements data
  const achievements = [
    {
      title: "First Steps",
      description: "Walk around",
      current: currentUser.daysUsed,
      target: 1,
      difficulty: 1,
      image: <DirectionsWalkIcon/>
    },
    {
      title: "Explorer",
      description: "View facts around you",
      current: currentUser.factsViewed,
      target: 10,
      difficulty: 2,
      image: <BookIcon/>
    },
    {
      title: "Contributor",
      description: "Place facts on the map",
      current: currentUser.factsPlaced,
      target: 5,
      difficulty: 3,
      image: <CreateIcon/>
    },
    {
      title: "Regular User",
      description: "Log in multiple times",
      current: currentUser.daysUsed,
      target: 7,
      difficulty: 0,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Knowledge Seeker",
      description: "Discover many facts",
      current: currentUser.factsViewed,
      target: 50,
      difficulty: 0,
      image: <StarRateIcon/>
    },
    {
      title: "Map Maker",
      description: "Add facts to help others",
      current: currentUser.factsPlaced,
      target: 25,
      difficulty: 0,
      image: <CreateIcon/>
    },
    {
      title: "Veteran",
      description: "Reach level 5",
      current: currentUser.level,
      target: 5,
      difficulty: 0,
      image: <CreateIcon/>
    },
    {
      title: "Expert",
      description: "Accumulate experience",
      current: currentUser.xp,
      target: 5000,
      difficulty: 0,
      image: <EventRepeatIcon/>
    }
  ];

  const handleNewUsername = (newName) => {
    fetch(BACKEND_URL + "/change_username", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors',
        body: JSON.stringify({id: currentUser.id, username: newName})
    }).then(response => {
        if (response.ok) {

        } else {
          throw new Error("Request to change username failed!");
        }

        return response.json();
    }).then(data => {
      currentUser.username = data[0].username;
    }).catch(error => {
      console.error('Error: ', error);
      return;
    } );   

    setShowUsernameModal(false);
  }

  return (
    <div className="profile-container">
      <InputModal
        show={showUsernameModal}
        title="Edit Your Username"
        placeholder="Type here..."
        warningLevel={2}
        onClose={() => setShowUsernameModal(false)}
        action={handleNewUsername}
      />

      <div className="profile-header">
        <h1 className="profile-username" onClick={() => setShowUsernameModal(true)}>
          {currentUser.username}
        </h1>
        
        <div>
          <div className="profile-level-section">
            <span className="profile-level-label">
              Level {currentUser.level} {getPermissionString(currentUser.permLevel)}
            </span>
            <span className="profile-xp-label">
              {currentLevelXP}/{xpPerLevel} XP
            </span>
          </div>
          
          <div className="profile-progress-bar">
            <div 
              className="profile-progress-fill"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="profile-divider" />

      <h2 className="achievements-title">
        Achievements
      </h2>

      <div className="achievements-grid">
        {achievements.map((achievement, index) => (
          <Achievement
            key={index}
            image={achievement.image}
            title={achievement.title}
            description={achievement.description}
            current={achievement.current}
            target={achievement.target}
            difficulty={achievement.difficulty}
          />
        ))}
      </div>
    </div>
  );
}

export default ProfilePage;