import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function IdelView() {
  return (
    <Button as={Link} to='/detect'>Start Detect (this button should be removed)</Button>
  )
}