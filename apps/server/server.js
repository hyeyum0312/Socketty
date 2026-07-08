// socketty WebSocket 에코 서버
// 실행: pnpm --filter @socketty/server dev

import { WebSocketServer } from "ws";

const PORT = 4001;

const wsServer = new WebSocketServer({ port: PORT });
console.log(`✅ WebSocket 서버 실행 중: ws://localhost:${PORT}`);

wsServer.on("connection", (socket) => {
  console.log("클라이언트 연결됨");

  socket.on("message", (data) => {
    // data는 Buffer → 문자열로 변환해 그대로 echo
    const message = data.toString();
    console.log("수신:", message);
    socket.send(message);
  });

  socket.on("close", () => console.log("클라이언트 연결 종료"));
});
