import Room from "@/components/Room";

// 서버 컴포넌트: HTML을 SSR로 렌더. 실시간 소켓은 Room(클라이언트 컴포넌트)이 담당.
export default function RoomPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-semibold">socketty — 1:1 채팅</h1>
      <Room />
    </main>
  );
}
