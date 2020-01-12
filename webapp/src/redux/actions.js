import { HOST } from '../config';

export const stepActions = {
  next: { type: 'STEP_NEXT' },
  unlock: { type: 'STEP_UNLOCK' },
}

export const bannerActions = {
  set: (type, content) => ({ type: 'BANNER_SET', banner: { type, content } }),
  clear: { type: 'BANNER_CLEAR' }
}

export function serverAction(key) {
  return dispatch => {
    switch (key) {
      case 'RESET':
        window.location.pathname = '/';
        break;
      case 'NEXT_STEP':
        dispatch(stepActions.next);
        break;
      case 'CLEAR_BANNER':
        dispatch(bannerActions.clear);
        break;
      case 'PLACE_FACE':
        dispatch(bannerActions.set('primary', 'Please Make sure your face is visible and complete.'));
        break;
      case 'UNLOCK_CAR':
        dispatch(stepActions.unlock);
        break;
      case 'YOU_ARE_DRUNK':
        dispatch(bannerActions.set('failure', 'Sorry, you are drunk, you cannot drive today.'));
        window.setTimeout(() => dispatch(serverAction('RESET')), 5000);
        break;
      case 'RETRY_STEP':
        dispatch(bannerActions.set('warning', 'Sorry, please retry this step.'));
        window.setTimeout(() => dispatch(serverAction('RESET')), 3000);
        break;
      case 'START_RECORD':
        fetch(`http://${HOST}:8080/command`, {
          body: JSON.stringify({
            command: 'START_RECORD'
          }),
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST'
        })
        break;
      case 'END_RECORD':
        fetch(`http://${HOST}:8080/command`, {
          body: JSON.stringify({
            command: 'STOP_RECORD'
          }),
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST'
        })
        break;
      default:
        break;
    }
  }
}
