import React from 'react';
import './App.css';
import store from './redux/store';
import { Provider } from 'react-redux';
import { Switch, BrowserRouter, Route } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import IdelView from './components/IdleView';
import DetectionView from './components/DetectionView';
import { Container, Row, Col } from 'react-bootstrap';

const history = createBrowserHistory();

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter history={history}>
        <Container>
          <Row>
            <Col>
              <h1>Tipsy</h1>
            </Col>
          </Row>
          <Row>
            <Col>
              <Switch>
                <Route path='/' exact component={IdelView} />
                <Route path='/detect' exact component={DetectionView} />
              </Switch>
            </Col>
          </Row>
        </Container>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
