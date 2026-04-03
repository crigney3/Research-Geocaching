import {useContext, useEffect, useState} from 'react';
import { BACKEND_URL, CLIENT_AUTH_SECRET } from '../../secrets';
import { ResearchContext } from '../ResearchContext';
import { ErrorBoundary }from 'react-error-boundary';
import { Modal } from './Modal';
import { SocialLogin } from '@capgo/capacitor-social-login';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import './GAuth.css';

const GoogleAuth = ({
    loginState,
    setLoginState
}) => {
 const setPreference = useContext(ResearchContext).setWithExpiry;
 const loginAsGoogleUser = useContext(ResearchContext).checkForExistingUser;

 const [errorRenderShow, setErrorRenderShow] = useState(false);
 const [seed, setSeed] = useState(1);

 const handleErrorRenderClose = () => {
    setErrorRenderShow(false);
 }

 const refreshComponent = () => {
  setSeed(Math.random());
 }

const handleLoginGoogle = async () => {
    const res = await SocialLogin.login({
      provider: 'google',
      options: {}
    });

    const credentialResponse = res.result;
    // handle the response
    console.log(credentialResponse);
    // TODO: set up email from response
    let potentialNewUsername = "New_User" + Math.floor(Math.random() * 10000);
    let JSONString = JSON.stringify({credential: credentialResponse.idToken, client_id: credentialResponse.profile.id, inUsername: potentialNewUsername, email: credentialResponse.profile.email});

    fetch(BACKEND_URL + "/google_login", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
            'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors',
        body: JSONString
    }).then(response => {
        if (!response.ok) {
            setLoginState(0);
            throw new Error('Login Request Failed');
        }

        return response.json();
    }).then(async (data) => {
        const expiryDate = new Date();
        await expiryDate.setDate(expiryDate.getDate() + 1); 
        setLoginState(1);
        await setPreference('user', data.user[0].id, 3, 86400000);
        loginAsGoogleUser();
    }).catch(error => {
        console.error('Error: ', error);
        setLoginState(0);
    })
  }
  
 return (
    <ErrorBoundary
      fallback={<Modal 
        show={errorRenderShow} 
        title='Component Error' 
        message="Something went wrong while trying to create the login component. Try resetting with the button below."
        action={refreshComponent}
        warningLevel={0}
        actionText="Refresh"/>}>
          <div className="google-auth-container">
            <button onClick={handleLoginGoogle}>
              <GoogleIcon className="google-icon" />
              Login with Google
            </button>
          </div>
    </ErrorBoundary>
  );
};

const AppleAuth = ({
  loginState,
  setLoginState
}) => {
  const setPreference = useContext(ResearchContext).setWithExpiry;
  const loginAsAppleUser = useContext(ResearchContext).checkForExistingUser;

  const [errorRenderShow, setErrorRenderShow] = useState(false);
  const [seed, setSeed] = useState(1);

  const handleErrorRenderClose = () => {
      setErrorRenderShow(false);
  }

  const refreshComponent = () => {
    setSeed(Math.random());
  }

  const handleLoginApple = async () => {
    const res = await SocialLogin.login({
        provider: 'apple',
        options: {}
    });

    const credentialResponse = res.result;
    console.log(credentialResponse);

    const appleUserId = credentialResponse.profile.user;
    const idToken = credentialResponse.idToken;
    const email = credentialResponse.profile.email; // null on repeat logins
    const givenName = credentialResponse.profile.givenName;
    const familyName = credentialResponse.profile.familyName;

    let potentialNewUsername = "New_User" + Math.floor(Math.random() * 10000);

    // Build a display name from Apple's name fields if available
    if (givenName || familyName) {
      potentialNewUsername = [givenName, familyName].filter(Boolean).join('_').replace(/\s/g, '_');
    }

    let JSONString = JSON.stringify({
      credential: idToken,
      client_id: appleUserId,
      inUsername: potentialNewUsername,
      email: email // may be null on repeat logins — backend must handle this
    });

    fetch(BACKEND_URL + "/apple_login", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer: ${CLIENT_AUTH_SECRET}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      mode: 'cors',
      body: JSONString
    }).then(response => {
      if (!response.ok) {
        setLoginState(0);
        throw new Error('Login Request Failed');
      }
      return response.json();
    }).then(async (data) => {
      setLoginState(1);
      await setPreference('user', data.user[0].id, 3, 86400000);
      loginAsAppleUser();
    }).catch(error => {
      console.error('Error: ', error);
      setLoginState(0);
    });
  }
  
 return (
    <ErrorBoundary
      fallback={<Modal 
        show={errorRenderShow} 
        title='Component Error' 
        message="Something went wrong while trying to create the login component. Try resetting with the button below."
        action={refreshComponent}
        warningLevel={0}
        actionText="Refresh"/>}>
          <div className="apple-auth-container">
            <button onClick={handleLoginApple}>
              <AppleIcon className="google-icon" />
              Login with Apple (iOS only)
            </button>
          </div>
    </ErrorBoundary>
  );
}

export {
  GoogleAuth,
  AppleAuth
};