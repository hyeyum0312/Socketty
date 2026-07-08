"use client";

import { useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:4001";

export default function EchoChat() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  // 페이지가 브라우저에 뜬 뒤(하이드레이션 후) 1번 실행 → 소켓 연결
  useEffect(() => {
    const socket = new WebSocket(WS_URL); // (1) 연결 생성
    socketRef.current = socket;

    socket.onopen = () => setConnected(true); // (2) 연결되면 초록불
    socket.onmessage = (event) => {
      // (3) 서버가 보낸 메시지를 로그에 추가
      setMessages((prev) => [...prev, event.data]);
    };
    socket.onclose = () => setConnected(false); // (4) 끊기면 상태 off

    return () => socket.close(); // (5) 컴포넌트 사라질 때 정리
  }, []);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const socket = socketRef.current;
    // (6) 연결됐고 입력이 있을 때만 전송
    if (!socket || socket.readyState !== WebSocket.OPEN || input.trim() === "") {
      return;
    }
    socket.send(input);
    setInput("");
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {/* ① 연결 상태 */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${connected ? "bg-green-500" : "bg-zinc-400"}`} />
        <span>{connected ? "연결됨" : "연결 안 됨"}</span>
      </div>

      {/* ② 메시지 로그 */}
      <ul className="h-64 overflow-y-auto rounded-lg border border-black/10 p-3 text-sm dark:border-white/15">{messages.length === 0 ? <li className="text-zinc-400">아직 메시지가 없습니다.</li> : messages.map((msg, i) => <li key={i}>{msg}</li>)}</ul>

      {/* ③ 입력창 */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="메시지 입력..." className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-black" />
        <button type="submit" className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-40" disabled={!connected}>
          전송
        </button>
      </form>
    </div>
  );
}
