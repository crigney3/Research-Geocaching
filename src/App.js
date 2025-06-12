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
  const [allFacts, setAllFacts] = useState([]);

  useEffect(() => {
    getAllCategories();
    getAllFacts();
  }, []);

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

  const getAllFacts = () => {
    fetch(BACKEND_URL + "/get_all_facts", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        mode: 'cors'
    }).then(response => response.json())
      .then(data => {
        setAllFacts(data);
    });
  }

  const getCategoryTitleFromID = (id) => {
    allCategories.forEach((cat) => {
      if (cat.id === id) {
        return cat.title;
      }
    });

    return "Unknown";
  }

  return (
    <div className="App">
      <BrowserRouter>
      <ResearchContext value={{allCategories, allFacts, getCategoryTitleFromID}}>
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
