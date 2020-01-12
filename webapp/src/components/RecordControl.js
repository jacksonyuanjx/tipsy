import React, { useState } from 'react';
import styled from 'styled-components';
import Countdown from 'react-countdown';
import { useDispatch } from 'react-redux';
import { serverAction } from '../redux/actions';

const Styles = styled.div`
  .count-down {
    color: #bbb;
    font-size: 6rem;
  }

  .button {
    color: #666;
    padding: 0.5rem;
    border: 3px solid black;
    background: rgba(255, 255, 255, 0.7);
    font-size: 2rem;
    cursor: pointer;
    border-radius: 1rem;
    &:hover {
      color: black;
    }
  }

  .count-down, .button {
    position: fixed;
    z-index: 10;
    left: 50%;
    bottom: 30%;
    transform: translateX(-50%);
  }

  .status-label {
    position: fixed;
    right: 1rem;
    top: 5rem;
    color: #000;
    background: rgba(255, 255, 255, 0.7);
    border-color: #000;
    border-width: 1px;
    border-style: solid;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    border-radius: 0.3rem;
    z-index: 3;
    display: flex;
    flex-direction: row;
    align-items: center;

    .red {
      margin-right: 5px;
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background: red;
    }
  }
`;

export default function RecordControl() {
  const [status, setStatus] = useState('NOT_START');
  const dispatch = useDispatch();

  return (
    <Styles>
      {status === 'IN_PROGRESS' && <span className='status-label'>
        <span className='red'></span>  Recording video
      </span>}
      {
        status === 'COUNTING' && (
          <Countdown
            date={Date.now() + 14000}
            intervalDelay={1000}
            precision={3}
            renderer={({ seconds, completed }) => (
              !completed && (
                <div className='count-down'>{seconds + 1}</div>
              )
            )}
            onComplete={() => {
              setStatus('IN_PROGRESS')
              dispatch(serverAction('START_RECORD'))
            }}
          />
        )
      }
      {
        status === 'NOT_START' && (
          <div className='button' onClick={() => setStatus('COUNTING')}>Start Recording</div>
        )
      }
      {
        status === 'IN_PROGRESS' && (
          <div className='button' onClick={() => {
            setStatus('FINISHED')
            dispatch(serverAction('END_RECORD'))
          }}>Stop Recording</div>
        )
      }
    </Styles>
  )
}
