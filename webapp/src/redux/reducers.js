import { combineReducers } from 'redux';

const step = (state = 0, action) => {
  switch (action.type) {
    case 'STEP_NEXT':
      return state + 1;
    case 'STEP_RESET':
      return 0;
    case 'STEP_UNLOCK':
      return 3;
    default:
      return state;
  }
}

const banner = (state = { type: 'none' }, action) => {
  switch (action.type) {
    case 'BANNER_CLEAR':
      return { type: 'none' };
    case 'BANNER_SET':
      return { ...action.banner };
    default:
      return state;
  }
};

export default combineReducers({ step, banner });
