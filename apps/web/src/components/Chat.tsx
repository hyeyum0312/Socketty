"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { EVENTS } from "@socketty/shared";

const CHAT_URL = "http://localhost:4002";

type Message = { role: "user" | "assistant"; text: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(CHAT_URL); // (1) 연결
    socketRef.current = socket;

    // (2) 조각을 받아 "마지막 assistant 메시지"의 text 뒤에 이어붙임
    socket.on(EVENTS.CHUNK, (delta: string) => {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = { ...last, text: last.text + delta };
        return copy;
      });
    });

    socket.on(EVENTS.DONE, () => setStreaming(false)); // (3) 스트리밍 종료

    // (4) 에러를 assistant 메시지로 표시 (문자열이 아니라 Message 객체로)
    socket.on(EVENTS.ERROR, (msg: string) => {
      setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ ${msg}` }]);
      setStreaming(false);
    });

    // (5) cleanup — 언마운트 때 정리 (반드시 return 안에서!)
    return () => {
      socket.disconnect();
    };
  }, []);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (streaming || input.trim() === "") return;

    // TODO(6): 화면에 내 메시지 + 빈 assistant 메시지(스트리밍이 채워질 자리) 두 개를 messages에 추가
    setMessages((prev) => [...prev, { role: "user", text: input }, { role: "assistant", text: "" }]);

    // TODO(7): socketRef.current?.emit("chat", input) 로 서버에 전송
    //          (native의 socket.send(input) 과 비교 — socket.io는 이벤트 "이름"을 붙인다)
    socketRef.current?.emit(EVENTS.CHAT, input);
    setInput("");
    setStreaming(true);
  }

  function handleStop() {
    // TODO(8): 서버로 "중단" 신호를 보내고(emit) 스트리밍 상태를 끔
    //   힌트: socketRef.current?.emit(EVENTS.STOP);  그리고  setStreaming(false);
    //   (native의 socket.send처럼 데이터 없이 "이벤트만" 보내도 됨)
    socketRef.current?.emit(EVENTS.STOP);
    setStreaming(false);
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ul className="h-80 overflow-y-auto rounded-lg border border-black/10 p-3 text-sm dark:border-white/15">
        {messages.length === 0 ? (
          <li className="text-zinc-400">메시지를 입력해 대화를 시작하세요.</li>
        ) : (
          messages.map((m, i) => (
            <li key={i} className="mb-2">
              <span className="font-semibold">{m.role === "user" ? "나" : "AI"}: </span>
              <span className="whitespace-pre-wrap">{m.text}</span>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={handleSend} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="메시지 입력..." className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-black" />
        <button type={streaming ? "button" : "submit"} onClick={streaming ? handleStop : undefined} className="rounded-lg bg-foreground px-4 py-2 text-sm text-background">
          {streaming ? "중단" : "전송"}
        </button>
      </form>
    </div>
  );
}
