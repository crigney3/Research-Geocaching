import './App.css';
import { useEffect, useState } from "react";
import MapPage from './Components/Pages/map';
import InputPage from './Components/Pages/input';
import ProfilePage from './Components/Pages/profile';
import LoginPage from './Components/Pages/login';
import HomePage from './Components/Pages/home';
import AdminPage from './Components/Pages/Admin';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ResearchContext from './Components/ResearchContext';
import { BACKEND_URL } from './secrets';

function App() {

  const [allCategories, setAllCategories] = useState([]);

  useEffect(() => {
    getAllCategories();
  }, []);

  useEffect(() => {

  }, [setAllCategories]);

  const getAllCategories = () => {
    fetch(BACKEND_URL + "/get_all_categories", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors'
    }).then(response => response.json())
      .then(data => {
        setAllCategories(data);
      });
  }

  const createCategory = () => {
    fetch(BACKEND_URL + "/add_category", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors',
        body: JSON.stringify({title: 'testCat'})
    }).then(response => {
        getAllCategories();
    });
  }

  return (
    <div className="App">
      <BrowserRouter>
      <ResearchContext value={{allCategories}}>
        <Routes>
          <Route path="/" element={<HomePage/>}>
          
          </Route>
          <Route path='/map' element={<MapPage/>}>
            
          </Route>
          <Route path='/input' element={<InputPage/>}>

          </Route>
          <Route path='/profile' element={<ProfilePage/>}>

          </Route>
          <Route path='/login' element={<LoginPage/>}>

          </Route>
          <Route path='admin' element={<AdminPage/>}>

          </Route>
        </Routes>
      </ResearchContext>
      </BrowserRouter>
    </div>
  );
}

export default App;
