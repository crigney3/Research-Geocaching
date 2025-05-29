import './App.css';
import React from "react";
import { BrowserRouter, Route, Switch } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/home">
          
          </Route>
          <Route path='/map'>
          
          </Route>
          <Route path='/input'>

          </Route>
          <Route path='/profile'>

          </Route>
          <Route path='/login'>

          </Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
