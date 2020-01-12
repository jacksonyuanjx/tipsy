import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

const Styles = styled.div`
  display: inline-flex;
  align-items: center;

  div {
    border: 2px solid white;
    color: #aaa;
    font-size: 2rem;
    padding-left: 0.8rem;
    padding-right: 0.8rem;
    border-radius: 1.5rem;
    &.current {
      background: white;
      color: #000;
    }
    &.unlock {
      background: green;
      color: #fff;
    }
  }

  .line {
    width: 4rem;
    height: 5px;
    background: white;
  }
`;

const stepTitles = [
  'Face Verification',
  'One Leg Test',
  'LOOK AT RED DOT',
];

export default function ProgressBar() {

  const step = useSelector(state => state.step);

  return (
    <Styles>
      {stepTitles.map((stepTitle, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className='line' />}
          <div className={step === i ? 'current' : ''}>{step === i ? stepTitle : i + 1}</div>
        </React.Fragment>
      ))}
      <span className='line' />
      <div className='unlock'>UNLOCK</div>
    </Styles>
  );
}