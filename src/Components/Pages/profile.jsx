import { useContext, useEffect, useState } from 'react';
import './profile.css';
import { ResearchContext } from '../ResearchContext';
import Achievement from '../Subcomponents/Achievement';
import { BACKEND_URL, CLIENT_AUTH_SECRET } from '../../secrets';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BookIcon from '@mui/icons-material/Book';
import StarRateIcon from '@mui/icons-material/StarRate';
import CreateIcon from '@mui/icons-material/Create';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import BoltIcon from '@mui/icons-material/Bolt';
import { InputModal } from '../Subcomponents/Modal';

const ProfilePage = ({

}) => {
  const currentUser = useContext(ResearchContext).currentUser;
  const reloadUser = useContext(ResearchContext).checkForExistingUser;
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    if (currentUser != null) {
      setIsUserLoaded(true);
    }
  }, [currentUser]);

  if(currentUser === null) {
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
  const xpPerLevel = Math.round(50 * Math.pow(1.15, currentUser.level));
  const currentLevelXP = currentUser.xp % xpPerLevel;
  const levelProgress = (currentLevelXP / xpPerLevel) * 100;

  const achievements = [
    {
      title: "First Steps",
      description: "Log in for the first time",
      current: currentUser.daysUsed,
      target: 1,
      difficulty: 0,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Hiker",
      description: "View a fact in your range",
      current: currentUser.factsViewed,
      target: 1,
      difficulty: 0,
      image: <BookIcon/>
    },
    {
      title: "Make Your Mark",
      description: "Add your first fact",
      current: currentUser.factsPlaced,
      target: 1,
      difficulty: 0,
      image: <CreateIcon/>
    },
    {
      title: "Studied",
      description: "Reach level 5",
      current: currentUser.level,
      target: 5,
      difficulty: 0,
      image: <BoltIcon/>
    },
    {
      title: "Hey, you came back!",
      description: "A long weekend's worth of logins",
      current: currentUser.daysUsed,
      target: 3,
      difficulty: 1,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Experienced",
      description: "Reach level 15",
      current: currentUser.level,
      target: 15,
      difficulty: 1,
      image: <BoltIcon/>
    },
    {
      title: "Bushwhacker",
      description: "View several facts",
      current: currentUser.factsViewed,
      target: 10,
      difficulty: 1,
      image: <BookIcon/>
    },
    {
      title: "Contributor",
      description: "Add a few more facts",
      current: currentUser.factsPlaced,
      target: 10,
      difficulty: 1,
      image: <CreateIcon/>
    },
    {
      title: "Regular User",
      description: "A week's worth of logins",
      current: currentUser.daysUsed,
      target: 7,
      difficulty: 2,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Expert",
      description: "Reach level 30",
      current: currentUser.level,
      target: 30,
      difficulty: 2,
      image: <BoltIcon/>
    },
    {
      title: "World Traveller",
      description: "View lots of facts",
      current: currentUser.factsViewed,
      target: 50,
      difficulty: 2,
      image: <BookIcon/>
    },
    {
      title: "Cartographacter",
      description: "Add a couple dozen facts. And then one more",
      current: currentUser.factsPlaced,
      target: 25,
      difficulty: 2,
      image: <CreateIcon/>
    },
    {
      title: "Power User",
      description: "A whole month's worth of logins",
      current: currentUser.daysUsed,
      target: 30,
      difficulty: 3,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Rick Steves",
      description: "View way too many facts",
      current: currentUser.factsViewed,
      target: 300,
      difficulty: 3,
      image: <BookIcon/>
    },
    {
      title: "Staple of the Community",
      description: "Sprinkle four dozen facts around. And then a couple more",
      current: currentUser.factsPlaced,
      target: 50,
      difficulty: 3,
      image: <CreateIcon/>
    },
    {
      title: "No More Impostor Syndrome",
      description: "Reach level 50",
      current: currentUser.level,
      target: 50,
      difficulty: 3,
      image: <BoltIcon/>
    },
  ];

  const handleNewUsername = (newName) => {
    fetch(BACKEND_URL + "/change_username", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors',
        body: JSON.stringify({id: currentUser.id, username: newName})
    }).then(response => {
        if (response.ok) {
          reloadUser();
        } else {
          throw new Error("Request to change username failed!");
        }
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