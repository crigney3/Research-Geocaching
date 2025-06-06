import './App.css';
import React from "react";
import MapPage from './Components/Pages/map';
import InputPage from './Components/Pages/input';
import ProfilePage from './Components/Pages/profile';
import LoginPage from './Components/Pages/login';
import HomePage from './Components/Pages/home';
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
