import {useContext, useEffect, useState} from 'react';
import { BACKEND_URL, CLIENT_AUTH_SECRET } from '../../secrets';
import { ResearchContext } from '../ResearchContext';
import { ErrorBoundary }from 'react-error-boundary';
import { Modal } from './Modal';
import { SocialLogin } from '@capgo/capacitor-social-login';
import GoogleIcon from '@mui/icons-material/Google';
import './GAuth.css';

const GoogleAuth = ({
    loginState,
    setLoginState
}) => {
 const cookieHandler = useContext(ResearchContext).cookies;
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
    let potentialNewUsername = "New_User" + Math.floor(Math.random() * 10000);
    let JSONString = JSON.stringify({credential: credentialResponse.idToken, client_id: credentialResponse.profile.id, inUsername: potentialNewUsername});

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
    }).then(data => {
        setLoginState(1);
        cookieHandler.set('user', 'id_' + data.user[0].id, { path: '/' });
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

export default GoogleAuth;