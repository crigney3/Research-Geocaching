import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_LOGIN_CLIENT_ID } from '../../secrets';

const GoogleAuth = () => {
 const clientId = GOOGLE_LOGIN_CLIENT_ID;
  return (
   <GoogleOAuthProvider clientId={clientId}>
     <GoogleLogin
       onSuccess={credentialResponse => {
         console.log(credentialResponse);
       }}
       onError={() => {
         console.log('Login Failed');
       }}
     />
   </GoogleOAuthProvider>
   );
};

export default GoogleAuth;