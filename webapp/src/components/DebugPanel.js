import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { serverAction } from '../redux/actions';

const Styles = styled.div`
  position: fixed;
  z-index: 10;
  left: 1rem;
  top: 4rem;
  background: rgba(255, 255, 0, 0.3);
  padding: 0.5rem;
  color: grey;

  div {
    cursor: pointer;
    &:hover {
      color: black;
    }
  }
`;

const buttons = [
  'RESET',
  'NEXT_STEP',
  'CLEAR_BANNER',
  'PLACE_FACE',
  'UNLOCK_CAR',
  'YOU_ARE_DRUNK',
  'RETRY_STEP',
]

export default function DebugPanel() {
  const dispatch = useDispatch();

  return (
    <Styles>
      {
        buttons.map((button, i) => (
          <div key={i} onClick={() => dispatch(serverAction(button))}>{button}</div>
        ))
      }
    </Styles>
  )
}