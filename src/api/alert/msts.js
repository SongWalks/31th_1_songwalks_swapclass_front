// push.js(React 밖)와 React 컴포넌트를 이어주는 아주 가벼운 이벤트 버스
let listener = null;

export const setForegroundMessageListener = (fn) => {
  listener = fn;
};

export const emitForegroundMessage = (title, body) => {
  if (listener) listener(title, body);
};
