import { combineReducers } from 'redux';

const step = (state = 0, action) => {
  switch (action.type) {
    case 'STEP_NEXT':
      return state + 1;
    case 'STEP_RESET':
      return 0;
    default:
      return state;
  }
}

export default combineReducers({ step });
