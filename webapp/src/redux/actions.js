export const stepActions = {
  next: { type: 'STEP_NEXT' },
}

export const bannerActions = {
  set: (type, content) => ({ type: 'BANNER_SET', banner: { type, content } }),
  clear: { type: 'BANNER_CLEAR' }
}
