import './App.css';
import React from "react";
import MapPage from './Components/Pages/map';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/home">
          
          </Route>
          <Route path='/map' element={<MapPage/>}>
            
          </Route>
          <Route path='/input'>

          </Route>
          <Route path='/profile'>

          </Route>
          <Route path='/login'>

          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
