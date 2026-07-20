// index.js의 타입 선언. TypeScript(apps/web)가 EVENTS의 리터럴 타입과
// 자동완성을 받을 수 있게 한다. 값 자체는 index.js에 있다.
export declare const EVENTS: {
  readonly CHAT: "chat";
  readonly CHUNK: "chunk";
  readonly DONE: "done";
  readonly ERROR: "error_message";
  readonly STOP: "chat:stop";
  readonly MESSAGE_NEW: "message:new";
  readonly USER_JOINED: "user:joined";
  readonly USER_LEFT: "user:left";
  readonly TYPING_START: "typing:start";
  readonly TYPING_STOP: "typing:stop";
};
