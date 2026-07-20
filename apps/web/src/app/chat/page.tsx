import Chat from "@/components/Chat";

// 서버 컴포넌트: HTML을 SSR로 렌더. 실시간 소켓은 Chat(클라이언트 컴포넌트)이 담당.
export default function ChatPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-semibold">socketty — Socket.IO LLM 채팅</h1>
      <Chat />
    </main>
  );
}
