import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { bannerActions } from '../redux/actions';

const Styles = styled.div`
  .mask {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 2;
  }
  .dot {
    position: fixed;
    top: 50%;
    width: 30px;
    height: 30px;
    border-radius: 15px;
    background: red;
    transform: translateX(-50%);
    z-index: 100;
  }
`;

export default function RedDot() {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(0.3);

  const loop = useCallback(() => setPosition(position => {
    if (position + direction >= 100) {
      setDirection(-0.3);
      return 100;
    };
    if (position + direction <= 0) {
      setDirection(0.3);
      return 0;
    };
    return position + direction;
  }), [direction]);

  useEffect(() => {
    const i = window.setInterval(loop, 16);
    setInterval(i);

    return () => window.clearInterval(i);
  }, [loop])

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bannerActions.set('primary', 'Please follow the red dot.'))
    return () => dispatch(bannerActions.clear);
  }, [dispatch]);

  return (
    <Styles>
      <div className='mask' />
      <div className='dot' style={{ left: `${position}%` }}></div>
    </Styles>
  )
}
