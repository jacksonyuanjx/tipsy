import React from 'react';
import { useSelector } from 'react-redux';
import VideoCaptureView from './VideoCaptureView';
import styled from 'styled-components';
import UnlockView from './UnlockView';
import RedDot from './RedDot';
import RecordControl from './RecordControl';

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

  return <Styles>
    {getViewForStep(step)}
    {getRecordControl(step)}
  </Styles>;
}