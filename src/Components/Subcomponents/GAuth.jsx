import {useContext, useState} from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_LOGIN_CLIENT_ID } from '../../secrets';
import { BACKEND_URL, CLIENT_AUTH_SECRET } from '../../secrets';
import { ResearchContext } from '../ResearchContext';
import { ErrorBoundary }from 'react-error-boundary';
import { Modal } from './Modal';

const GoogleAuth = ({
    loginState,
    setLoginState
}) => {
 const clientId = GOOGLE_LOGIN_CLIENT_ID;
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
  
 return (
    <ErrorBoundary
      fallback={<Modal 
        show={errorRenderShow} 
        title='Component Error' 
        message="Something went wrong while trying to create the login component. Try resetting with the button below."
        action={refreshComponent}
        warningLevel={0}
        actionText="Refresh"/>}>
    <GoogleOAuthProvider key={seed} clientId={clientId}>
      <GoogleLogin
        onSuccess={credentialResponse => {
          console.log(credentialResponse);
          let potentialNewUsername = "New_User" + Math.floor(Math.random() * 10000);
          let JSONString = JSON.stringify({credential: credentialResponse.credential, client_id: credentialResponse.clientId, inUsername: potentialNewUsername});

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
        }}
        onError={() => {
          console.log('Login Failed');
          setLoginState(0);
        }}
      />
    </GoogleOAuthProvider>
    </ErrorBoundary>
  );
};

export default GoogleAuth;