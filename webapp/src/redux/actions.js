export const stepActions = {
  next: { type: 'STEP_NEXT' },
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
        break;
      case 'YOU_ARE_DRUNK':
        dispatch(bannerActions.set('failure', 'Sorry, you are drunk, you cannot drive today.'));
        window.setTimeout(() => dispatch(serverAction('RESET')), 5000);
        break;
      case 'RETRY_STEP':
        dispatch(bannerActions.set('warning', 'Sorry, please retry this step.'));
        window.setTimeout(() => dispatch(serverAction('RESET')), 3000);
        break;
      default:
        break;
    }
  }
}
