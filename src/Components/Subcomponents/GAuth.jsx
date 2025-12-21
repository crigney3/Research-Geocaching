import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_LOGIN_CLIENT_ID } from '../../secrets';
import { BACKEND_URL } from '../../secrets';

const GoogleAuth = () => {
 const clientId = GOOGLE_LOGIN_CLIENT_ID;
  return (
   <GoogleOAuthProvider clientId={clientId}>
     <GoogleLogin
       onSuccess={credentialResponse => {
        console.log(credentialResponse);
        // TODO: Generate simple username, make it easy for people to change their username.
        // Maybe allow admins to force-set a username to something?
        let JSONString = JSON.stringify({credential: credentialResponse.credential, client_id: credentialResponse.clientId, inUsername: "New_User"});

        fetch(BACKEND_URL + "/google_login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            mode: 'cors',
            body: JSONString
        }).then(response => {
            if (response.ok) {
                console.log("User logged in");
            } else {
                console.log('Login Failed');
                console.log(response);
            }
        })
       }}
       onError={() => {
         console.log('Login Failed');
       }}
     />
   </GoogleOAuthProvider>
   );
};

export default GoogleAuth;