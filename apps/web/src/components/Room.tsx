"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// 배포된 소켓 서버 주소를 env로 받고, 없으면 로컬 기본값.
const ROOM_URL = process.env.NEXT_PUBLIC_ROOM_URL || "http://localhost:4003";

// system: true 면 입장/퇴장 같은 안내 메시지 (가운데 회색으로 표시)
type Message = { user: string; text: string; system?: boolean };
type Input = { user: string; text: string };

export default function Room() {
  const [message, setMessage] = useState<Message[]>([]);
  const [input, setInput] = useState<Input>();
  const socketRef = useRef<Socket | null>(null);
  const [nickname, setNickname] = useState("");
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = io(ROOM_URL); // (1) 연결
    socketRef.current = socket;

    //메세지 수신 받으먄 setMessage에 배열로 담는다.
    socket.on("message", (data) => setMessage((prev) => [...prev, data]));
    // 입장/퇴장 등 서버 안내 → system 메시지로 쌓기
    socket.on("notice", (text) =>
      setMessage((prev) => [...prev, { user: "", text, system: true }])
    );

    return () => {
      socket.close();
    };
  }, []);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const sendHandler = () => {
    if (!input?.text) return;
    socketRef.current?.emit("message", input);
    setInput({ user: nickname, text: "" });
  };

  const nickNameHandler = () => {
    if (!nickname.trim()) return;
    socketRef.current?.emit("join", nickname);
    setOpen(true);
  };

  // ── 닉네임 입력 화면 ─────────────────────────────
  if (!open) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-black/10 bg-white/60 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">💬</span>
          <h2 className="text-lg font-semibold">채팅방 입장</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            사용할 닉네임을 정해주세요.
          </p>
        </div>

        <input
          autoFocus
          value={nickname}
          placeholder="닉네임을 입력하세요"
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return; // 한글 조합 중이면 통과
            if (e.key === "Enter") nickNameHandler();
          }}
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/15 dark:bg-black"
        />

        <button
          onClick={nickNameHandler}
          disabled={!nickname.trim()}
          className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          입장하기
        </button>
      </div>
    );
  }

  // ── 채팅 화면 ────────────────────────────────────
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {/* 환영 배너 */}
      <div className="rounded-xl bg-indigo-50 px-4 py-2.5 text-center text-sm text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
        안녕하세요 <b>{nickname}</b>님, 환영합니다 🎉
      </div>

      {/* 메시지 목록 */}
      <ul className="flex h-96 flex-col gap-2 overflow-y-auto rounded-2xl border border-black/10 p-3 dark:border-white/15">
        {message.length === 0 ? (
          <li className="m-auto text-sm text-zinc-400">
            메시지를 입력해 대화를 시작하세요.
          </li>
        ) : (
          message.map((item, idx) => {
            // 안내 메시지는 가운데 회색으로
            if (item.system) {
              return (
                <li key={idx} className="my-1 text-center text-xs text-zinc-400">
                  {item.text}
                </li>
              );
            }
            const mine = item.user === nickname;
            return (
              <li
                key={idx}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                {!mine && (
                  <span className="mb-0.5 px-1 text-xs text-zinc-400">
                    {item.user}
                  </span>
                )}
                <span
                  className={`max-w-[75%] break-words rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-indigo-500 text-white"
                      : "rounded-bl-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {item.text}
                </span>
              </li>
            );
          })
        )}
        <div ref={bottomRef} />
      </ul>

      {/* 입력창 */}
      <div className="flex gap-2">
        <input
          value={input?.text ?? ""}
          onChange={(e) => setInput({ user: nickname, text: e.target.value })}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return; // 한글 조합 중이면 통과
            if (e.key === "Enter") sendHandler();
          }}
          placeholder="메시지 입력..."
          className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/15 dark:bg-black"
        />
        <button
          onClick={sendHandler}
          disabled={!input?.text}
          className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          전송
        </button>
      </div>
    </div>
  );
}
