import { createServer } from "node:http";
import { Server } from "socket.io";
import { EVENTS } from "@socketty/shared";

// 배포 시 호스트(Render 등)가 PORT를 주입한다. 로컬은 4003.
const PORT = process.env.PORT || 4003;
// 접속을 허용할 web 주소. 배포 시 Vercel 주소를 env로 넣는다. 로컬은 localhost:3000.
const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:3000";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: WEB_ORIGIN },
});
httpServer.listen(PORT, () => console.log(`room 서버 실행: ${PORT}`));
// 연결되면
io.on("connection", (socket) => {
  socket.emit("notice", "연결되었습니다.");

  // 사용자의 가입
  socket.on("join", (data) => {
    io.emit("join", data);
    io.emit("notice", `${data}님이 방에 들어왔습니다.`);
  });

  // 메세지 받으면
  socket.on("message", (data) => {
    io.emit("message", data);
  });
});
