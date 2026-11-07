import React from 'react';
import { Volume2, VolumeX, Shield, Swords, Sparkles, Map, Shirt, HelpCircle, User } from 'lucide-react';
import { HeroClass } from '../game/types';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenLobby?: () => void;
  onOpenCharacterSelect: () => void;
  onOpenMapSelect: () => void;
  onOpenOutfits: () => void;
  activeHeroClass: HeroClass;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenLobby,
  onOpenCharacterSelect,
  onOpenMapSelect,
  onOpenOutfits,
  activeHeroClass,
  isMuted,
  onToggleMute,
}) => {
  const [showGuide, setShowGuide] = React.useState(false);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-8 bg-[#07090e] overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-[#07090e] to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent pointer-events-none" />

      {/* Floating particles aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/5 w-72 h-72 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Top Bar Utilities */}
      <header className="relative z-10 w-full flex items-center justify-between max-w-5xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs tracking-wider text-amber-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PHIÊN BẢN CHIẾN TRẦN ĐẾ VƯƠNG</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm border border-slate-700 transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Hướng dẫn</span>
          </button>
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Hero Title & Crest */}
      <main className="relative z-10 flex flex-col items-center text-center my-auto max-w-3xl">
        {/* Crest Logo */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-red-700 p-1 shadow-2xl shadow-red-600/30 flex items-center justify-center rotate-45 border-2 border-amber-300">
            <div className="-rotate-45 flex items-center justify-center">
              <Swords className="w-10 h-10 text-slate-950" />
            </div>
          </div>
          <div className="absolute -inset-2 bg-amber-500/20 rounded-2xl blur-lg -z-10 animate-pulse" />
        </div>

        <h1 className="font-cinzel text-4xl sm:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          HUYỀN THOẠI TRẢM MA
        </h1>
        <p className="font-cinzel text-lg sm:text-xl text-red-400 tracking-widest mt-1 font-bold">
          ĐẤU TRƯỜNG THẦN VỰC · 5 HỆ SỨC MẠNH & 4 ĐẠI CẢNH GIỚI (20 ẢI / MAP)
        </p>

        <p className="text-slate-400 text-sm sm:text-base mt-4 max-w-xl leading-relaxed">
          Tự do chọn lựa 5 tướng đại chiến (Chiến Binh, Pháp Sư, Thích Khách, Xạ Thủ, Thánh Kỵ Sĩ), chinh phục 4 cảnh giới (Rừng, Sa Mạc, Hang Động, Đáy Biển) với 20 ải khốc liệt, chạm trán Boss hung bạo mỗi 5 ải và thu thập thần khí từ hòm báu!
        </p>

        {/* Selected Hero Quick Badge */}
        <div className="mt-5 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: activeHeroClass.visuals.primaryColor }}
          >
            🛡️
          </div>
          <div className="text-left text-xs">
            <span className="text-slate-400">Tướng đang chọn: </span>
            <strong className="text-amber-300 font-cinzel">{activeHeroClass.name}</strong>
            <span className="text-slate-500 ml-1.5">({activeHeroClass.role})</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-7 w-full justify-center">
          {onOpenLobby && (
            <button
              onClick={onOpenLobby}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-cinzel font-black text-base tracking-wider shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5 fill-slate-950" />
              <span>SẢNH CHỜ & CỬA HÀNG</span>
            </button>
          )}

          <button
            data-start="true"
            onClick={onStartGame}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-cinzel font-black text-base tracking-wider shadow-lg shadow-red-600/40 hover:shadow-red-500/60 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Swords className="w-5 h-5" />
            <span>XUẤT CHIẾN NGAY</span>
          </button>

          <button
            onClick={onOpenCharacterSelect}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-500/40 font-medium text-sm sm:text-base transition flex items-center justify-center gap-2 hover:border-sky-400 cursor-pointer shadow-md"
          >
            <User className="w-4 h-4 text-sky-400" />
            <span>Chọn Tướng & Sức Mạnh</span>
          </button>

          <button
            onClick={onOpenMapSelect}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-medium text-sm sm:text-base transition flex items-center justify-center gap-2 hover:border-amber-400 cursor-pointer"
          >
            <Map className="w-4 h-4 text-amber-400" />
            <span>Bản Đồ & Đấu Trường</span>
          </button>

          <button
            onClick={onOpenOutfits}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-purple-300 border border-purple-500/40 font-medium text-sm sm:text-base transition flex items-center justify-center gap-2 hover:border-purple-400 cursor-pointer"
          >
            <Shirt className="w-4 h-4 text-purple-400" />
            <span>Tủ Đồ Trang Phục</span>
          </button>
        </div>
      </main>

      {/* Footer Info & Control Hint */}
      <footer className="relative z-10 w-full flex flex-col items-center gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 bg-slate-900/60 px-4 py-2 rounded-lg border border-slate-800">
          <span><strong className="text-amber-400">WASD / Phím Mũi Tên:</strong> Di chuyển</span>
          <span><strong className="text-amber-400">J / Chuột Trái:</strong> Đánh Cơ Bản</span>
          <span><strong className="text-amber-400">Space / K:</strong> Lướt / Blink / Mở Rương</span>
          <span><strong className="text-amber-400">L, I, U:</strong> Kỹ Năng Hệ & Chiêu Cuối</span>
        </div>
        <div>Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">Enter</kbd> hoặc <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">Space</kbd> để bắt đầu</div>
      </footer>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 text-slate-200">
            <h3 className="font-cinzel text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Cẩm Nang Chiến Binh
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <p>• <strong>5 Lớp Nhân Vật Độc Quyền:</strong> Chọn Chiến Binh (cận chiến chém lửa), Pháp Sư (bắn hỏa cầu tầm xa, teleport, bão tuyết), Thích Khách (song đoản kiếm siêu tốc, phóng phi tiêu), Xạ Thủ (bắn tên xuyên thấu) hoặc Thánh Kỵ Sĩ (đỡ đòn, hồi máu).</p>
              <p>• <strong>4 Cảnh Giới & 20 Ải Mỗi Bản Đồ:</strong> Rừng Nguyên Sinh, Sa Mạc Cổ Đại, Hang Động U Tối và Thủy Cung Đáy Biển. Cứ sau mỗi 5 ải (ải 5, 10, 15, 20) sẽ xuất hiện Boss sử thi khổng lồ với các hình thái biến hóa (Rồng Thần, Xác Ướp, Quỷ Thần, Thủy Quái...).</p>
              <p>• <strong>Hòm Rương Thần Khí:</strong> Tiêu diệt sạch quái trong ải hoặc diệt boss sẽ xuất hiện Hòm Rương Rực Lửa. Hãy tiến lại gần và bấm Space để mở nhận vũ khí, giáp, nhẫn huyền thoại!</p>
              <p>• <strong>Hệ Thống Combo:</strong> Tấn công liên tục không bị ngắt quãng để kích hoạt chuỗi combo từ D lên SSS, nhận thêm tới +60% sát thương đòn đánh.</p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer"
            >
              Đã Rõ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
