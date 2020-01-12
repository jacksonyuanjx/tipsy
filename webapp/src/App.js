import React from 'react';
import './App.css';
import store from './redux/store';
import { Provider } from 'react-redux';
import { Switch, BrowserRouter, Route } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import IdelView from './components/IdleView';
import DetectionView from './components/DetectionView';
import { Navbar } from 'react-bootstrap';
import styled from 'styled-components';
import Banner from './components/Banner';

const history = createBrowserHistory();

const Styles = styled.div`
  position: fixed;
  flex-direction: column;
  left: 0;
  top: 0;
  display: flex;
  height: 100%;
  width: 100%;

  .content {
    flex-grow: 1;
  }
`;

function App() {
  return (
    <Styles>
      <Provider store={store}>
        <BrowserRouter history={history}>
          <Navbar bg="dark" variant="dark">
            <Navbar.Brand>Tipsy</Navbar.Brand>
          </Navbar>
          <div className='content'>
            <Switch>
              <Route path='/' exact component={IdelView} />
              <Route path='/detect' exact component={DetectionView} />
            </Switch>
          </div>
          <Banner />
        </BrowserRouter>
      </Provider>
    </Styles>
  );
}

export default App;
