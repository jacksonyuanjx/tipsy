import React from 'react';
import styled from 'styled-components';

const Styles = styled.div`
  span {
    position: fixed;
    left: 50%;
    top: 50%;
    font-size: 3rem;
    transform: translateX(-50%);
  }

  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url('/IMG_3496bfree.jpg');
  background-size: cover;

  .mask {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.7);
  }
`;

export default function UnlockView() {
  return (
    <Styles>
      <div className='mask' />
      <span>You may drive the car now.</span>
    </Styles>
  );
}