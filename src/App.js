import './App.css';
import React from "react";
import MapPage from '../app/map';
import InputPage from '../app/input';
import ProfilePage from '../app/profile';
import LoginPage from '../app/login';
import HomePage from '../app/home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<HomePage/>}>
          
          </Route>
          <Route path='/map' element={<MapPage/>}>
            
          </Route>
          <Route path='/input' element={<InputPage/>}>

          </Route>
          <Route path='/profile' element={<ProfilePage/>}>

          </Route>
          <Route path='/login' element={<LoginPage/>}>

          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
