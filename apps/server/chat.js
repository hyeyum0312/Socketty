// Socket.IO 채팅 서버 (mock LLM 버전 — 무료, 키 불필요)
// 실행: pnpm --filter @socketty/server chat
//
// Claude 대신 "정해둔 답변을 글자 단위로 스트리밍"해서 LLM 스트리밍을 흉내낸다.
// Socket.IO 학습 목표(emit/on, 이벤트 이름, chunk 스트리밍, done 마커)는 진짜와 동일.
// 나중에 이 mock 부분만 실제 Claude(@anthropic-ai/sdk)나 Ollama로 교체하면 됨.
//
// native ws 서버와의 차이:
//   ws:  new WebSocketServer({ port });  wsServer.on("connection", ...)
//   io:  new Server(httpServer);         io.on("connection", ...)  + 이벤트에 "이름"이 있음

import { createServer } from "node:http";
import { Server } from "socket.io";
import { EVENTS } from "@socketty/shared";

const PORT = 4002;

const httpServer = createServer();
// web(3000)에서 다른 포트(4002)로 붙으므로 CORS 허용 필요
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000" },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 받은 메시지를 바탕으로 mock 답변 문장을 만든다 (진짜 AI 아님)
function mockReply(message) {
  return `안녕하세요! "${message}" 라고 하셨네요. 저는 mock 응답이라 진짜 AI는 아니지만, 스트리밍이 글자 단위로 잘 도착하는지 확인해보세요.`;
}

io.on("connection", (socket) => {
  console.log("클라이언트 연결됨:", socket.id);

  // 클라이언트가 CHAT 이벤트로 메시지를 보내면
  socket.on(EVENTS.CHAT, async (message) => {
    socket.data.stopped = false; // 새 요청 시작 → 중단 플래그 리셋

    try {
      const reply = mockReply(message);

      // 진짜 LLM 스트리밍처럼, 답변을 글자 단위로 쪼개 CHUNK 이벤트로 하나씩 전송
      for (const char of reply) {
        if (socket.data.stopped) break; // 중단 요청이 왔으면 루프 탈출
        socket.emit(EVENTS.CHUNK, char);
        await sleep(30); // 타이핑되는 느낌을 주려고 살짝 지연
      }

      // 다 보냈다는 종료 마커 (중단으로 끊겼어도 "끝"은 알림)
      socket.emit(EVENTS.DONE);
    } catch (err) {
      socket.emit(EVENTS.ERROR, err?.message ?? "알 수 없는 오류");
    }
  });

  // 클라이언트가 "그만" → 다음 루프 검사에서 멈춤
  // (실제 LLM이면 여기서 stream.abort()를 호출해 토큰 생성 자체를 취소)
  socket.on(EVENTS.STOP, () => {
    socket.data.stopped = true;
  });

  socket.on("disconnect", () => console.log("연결 종료:", socket.id));
});

httpServer.listen(PORT, () =>
  console.log(`✅ Socket.IO 채팅 서버(mock) 실행 중: http://localhost:${PORT}`)
);
