import React from 'react';
import { useSelector } from 'react-redux';
import VideoCaptureView from './VideoCaptureView';

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

  return getViewForStep(step);
}