import React from 'react';
import styled from "styled-components";
import { useSelector } from 'react-redux';

const Styles = styled.div`
  position: fixed;
  z-index: 10;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem;
  height: auto;
  border: 3px solid #345;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
`;

export default function Banner() {
  const banner = useSelector(state => state.banner);

  console.log(banner)
  if (banner.type === 'none') {
    return null;
  }

  return (
    <Styles>
      <div className={banner.type}>
        {banner.content}
      </div>
    </Styles>
  )
}