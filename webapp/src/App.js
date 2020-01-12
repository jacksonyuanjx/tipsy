import React from 'react';
import './App.css';
import store from './redux/store';
import { Provider } from 'react-redux';
import { Switch, BrowserRouter, Route } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import IdelView from './components/IdleView';
import DetectionView from './components/DetectionView';
import { Navbar, Form } from 'react-bootstrap';
import styled from 'styled-components';
import Banner from './components/Banner';
import DebugPanel from './components/DebugPanel';
import ProgressBar from './components/ProgressBar';
import UnlockView from './components/UnlockView';

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
          <Navbar bg="dark" variant="dark" className='justify-content-between'>
            <Navbar.Brand>Tipsy</Navbar.Brand>
            <Form inline><ProgressBar /></Form>
          </Navbar>
          <div className='content'>
            <Switch>
              <Route path='/' exact component={DetectionView} />
            </Switch>
          </div>
          <Banner />
        </BrowserRouter>
        <DebugPanel />
      </Provider>
    </Styles>
  );
}

export default App;
