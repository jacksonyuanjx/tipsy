import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import VideoCaptureView from './VideoCaptureView';
import styled from 'styled-components';
import { bannerActions } from '../redux/actions';

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

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(bannerActions.set('primary', 'Please Make sure your face is visible and complete.'))
  }, [dispatch])

  return <Styles>
    {getViewForStep(step)}
  </Styles>;
}