import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import VideoCaptureView from './VideoCaptureView';
import styled from 'styled-components';
import UnlockView from './UnlockView';
import RedDot from './RedDot';
import RecordControl from './RecordControl';
import { serverAction, bannerActions, stepActions } from '../redux/actions';
import { HOST } from '../config';

const Styles = styled.div`
  width: 100%;
  height: 100%;
`;

export default function DetectionView() {
  const step = useSelector(state => state.step);

  const getViewForStep = step => {
    switch (step) {
      case 0:
      case 1:
        return <VideoCaptureView />;
      case 2:
        return <>
          <VideoCaptureView />
          <RedDot />
        </>;
      default:
        return <UnlockView />;
    }
  };

  const getRecordControl = step => {
    switch (step) {
      case 1:
        return <RecordControl key={step} />;
      default:
        return null;
    }
  };

  const dispatch = useDispatch();
  useEffect(() => {
    window.setInterval(() => {
      dispatch(serverAction('POLL'))
    }, 500);
  }, [dispatch]);

  useEffect(() => {
    if (step === 0) {
      fetch(`http://${HOST}:8080/command`, {
        body: JSON.stringify({
          command: 'CHECK_FACE'
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      })
    }
  }, [step]);

  useEffect(() => {
    if (step !== 0) return;
    const listener = e => {
      if (e.key === 'c') {
        dispatch(bannerActions.set('primary', 'Facial Passed'))
        window.removeEventListener('keydown', listener)
        setTimeout(() => {
          dispatch(bannerActions.clear)
          dispatch(stepActions.next)
        }, 3000);
      }
    };
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener);
  }, [dispatch, step])

  useEffect(() => {
    const listener = e => {
      if (step >= 3) return;
      if (e.key === 'n') {
        dispatch(stepActions.next)
      }
    };
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener);
  }, [dispatch, step])

  return <Styles>
    {getViewForStep(step)}
    {getRecordControl(step)}
  </Styles>;
}