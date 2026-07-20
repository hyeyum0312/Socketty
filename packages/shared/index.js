// 서버(apps/server)와 클라이언트(apps/web)가 공유하는 Socket.IO 이벤트 이름.
// (plain JS로 둔 이유: 서버가 plain JS ESM이라 별도 빌드 없이 바로 import 가능)

export const EVENTS = {
  // ── 현재: mock AI 채팅 ──
  CHAT: "chat", // 클라 → 서버: 사용자가 보낸 메시지
  CHUNK: "chunk", // 서버 → 클라: 답변 글자 조각(스트리밍)
  DONE: "done", // 서버 → 클라: 답변 끝(종료 마커)
  ERROR: "error_message", // 서버 → 클라: 에러
  STOP: "chat:stop", // 클라 → 서버: 생성 중단 요청

  // ── 예정: 사람 ↔ 사람 채팅 (②단계에서 사용) ──
  MESSAGE_NEW: "message:new", // 서버 → 클라: 누군가 새 메시지를 보냄
  USER_JOINED: "user:joined", // 서버 → 클라: 유저 입장
  USER_LEFT: "user:left", // 서버 → 클라: 유저 퇴장
  TYPING_START: "typing:start", // 양방향: 입력 중 표시 시작
  TYPING_STOP: "typing:stop", // 양방향: 입력 중 표시 끝
};
