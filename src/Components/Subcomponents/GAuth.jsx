import {useContext} from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_LOGIN_CLIENT_ID } from '../../secrets';
import { BACKEND_URL } from '../../secrets';
import ResearchContext from '../ResearchContext';

const GoogleAuth = ({
    loginState,
    setLoginState
}) => {
 const clientId = GOOGLE_LOGIN_CLIENT_ID;
 const cookieHandler = useContext(ResearchContext).cookies;
  
 return (
   <GoogleOAuthProvider clientId={clientId}>
     <GoogleLogin
       onSuccess={credentialResponse => {
        console.log(credentialResponse);
        // TODO: Generate simple username, make it easy for people to change their username.
        // Maybe allow admins to force-set a username to something?
        let potentialNewUsername = "New_User" + Math.floor(Math.random() * 10000);
        let JSONString = JSON.stringify({credential: credentialResponse.credential, client_id: credentialResponse.clientId, inUsername: potentialNewUsername});

        fetch(BACKEND_URL + "/google_login", {
            method: 'POST',
            headers: {
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
            console.log(cookieHandler.get('user'));
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
   );
};

export default GoogleAuth;