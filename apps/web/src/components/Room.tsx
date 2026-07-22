"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// 배포된 소켓 서버 주소를 env로 받고, 없으면 로컬 기본값.
const ROOM_URL = process.env.NEXT_PUBLIC_ROOM_URL || "http://localhost:4003";

type Message = { user: string; text: string };
type Input = { user: string; text: string };

export default function Room() {
  const [message, setMessage] = useState<Message[]>([]);
  const [input, setInput] = useState<Input>();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(ROOM_URL); // (1) 연결
    socketRef.current = socket;

    //메세지 수신 받으먄 setMessage에 배열로 담는다.
    socket.on("message", (data) => setMessage((prev) => [...prev, data]));

    return () => {
      socket.close();
    };
  }, []);

  const sendHandler = () => {
    socketRef.current?.emit("message", input);
    setInput({ user: "hyeyeon", text: "" });
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ul className="h-80 overflow-y-auto rounded-lg border border-black/10 p-3 text-sm dark:border-white/15">
        {message.length === 0 ? (
          <li className="text-zinc-400">메시지를 입력해 대화를 시작하세요.</li>
        ) : (
          message.map((item, idx) => (
            <li key={idx}>
              {item.user} - {item.text}
            </li>
          ))
        )}
      </ul>

      <input
        value={input?.text ?? ""}
        onChange={(e) => {
          setInput({ user: "hyeyeon", text: e.target.value });
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return; // 한글 조합 중이면 통과
          if (e.key === "Enter") sendHandler();
        }}
        placeholder="메시지 입력..."
        className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
      />
    </div>
  );
}
