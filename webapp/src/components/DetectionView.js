import React from 'react';
import { useSelector } from 'react-redux';
import VideoCaptureView from './VideoCaptureView';
import styled from 'styled-components';

const Styles = styled.div`
  width: 100%;
  height: 100%;
`;

export default function DetectionView() {
  const step = useSelector(state => state.step);

  const getViewForStep = step => {
    switch (step) {
      case 0:
        return <VideoCaptureView />;
      default:
        return null;
    }
  };

  return <Styles>
    {getViewForStep(step)}
  </Styles>;
}