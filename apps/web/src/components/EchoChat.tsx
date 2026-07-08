"use client";

import { useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:4001";
const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30분

export default function EchoChat() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 소켓 연결 (재연결에도 쓰려고 함수로 분리)
    function connect() {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;
      socket.onopen = () => setConnected(true);
      socket.onmessage = (event) => setMessages((prev) => [...prev, event.data]);
      socket.onclose = () => setConnected(false);
      // 실제 앱이면 여기서 "보던 항목 다시 subscribe" 필요.
      // 지금 에코 서버엔 구독 개념이 없어 생략.
    }

    connect();

    // 탭이 숨겨짐/다시 보임을 감지
    function handleVisibility() {
      if (document.hidden) {
        // 30분 뒤 소켓을 닫는 타이머 시작 → idleTimerRef.current 에 저장
        idleTimerRef.current = setTimeout(() => {
          socketRef.current?.close();
        }, IDLE_LIMIT_MS);
      } else {
        //걸려있는 타이머 취소
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }

        // 소켓이 닫힌 상태면 다시 connect
        if (socketRef.current?.readyState === WebSocket.CLOSED) {
          connect();
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    // cleanup: 리스너 + 타이머 + 소켓 정리
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      // 걸려있는 타이머가 있으면 clearTimeout
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      socketRef.current?.close();
    };
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
