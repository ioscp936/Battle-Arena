# Kế Hoạch Triển Khai: Sảnh Chờ, Nhiệm Vụ, Vòng Quay May Mắn & Nâng Cấp Chiến Đấu

Kế hoạch xây dựng trung tâm Sảnh Chờ (Lobby Hub) với Tiệm Vũ Khí & Giáp Trụ phân cấp bậc (Common, Rare, Epic, Legendary), Bảng Nhiệm Vụ tích lũy Vàng, Vòng Quay May Mắn lũy tiến theo lượt, cơ chế reset chỉ số rương giữa các bản đồ và nâng cấp hiệu ứng chiến đấu kịch tính cùng độ nguy hiểm của quái vật.

---

> [!IMPORTANT]
> **Các Quyết Định Đã Xác Nhận Từ Người Dùng (Phase 1):**
> 1. **Luồng Truy Cập Sảnh Chờ**: Người chơi sẽ vào Sảnh Chờ chính trước mỗi chuyến xuất chiến với đầy đủ Tiệm Vũ Khí, Giáp Trụ, Bảng Nhiệm Vụ, Vòng Quay May Mắn và Cổng Dịch Chuyển.
> 2. **Cơ Chế Vòng Quay May Mắn**: Quay bằng Vàng tích lũy, chi phí quay tăng dần theo từng lượt quay (ví dụ: 50 xu → 100 xu → 200 xu → 350 xu → 500 xu...) nhằm tạo độ hấp dẫn và cân bằng kinh tế.
> 3. **Lưu Trữ Vũ Khí & Giáp**: Mua và mở khóa vĩnh viễn tại Sảnh Chờ bằng Vàng, cho phép trang bị tự do trước khi bước vào bất kỳ bản đồ chiến dịch nào.
> 4. **Reset Chỉ Số Rương**: Toàn bộ chỉ số buff/trang bị nhặt tạm thời từ hòm báu trong chuyến đi sẽ được đặt lại (reset) về chỉ số gốc + đồ Sảnh Chờ khi người chơi đổi sang bản đồ mới.
> 5. **Độ Khó Của Quái**: Quái vật và Boss được tăng mạnh sát thương đòn đánh (~1.8x - 2.2x), đòn đánh báo trước nguy hiểm hơn, buộc người chơi phải né tránh, lướt và căn thời điểm chuẩn xác.

---

## 1. Tổng Quan & Trải Nghiệm Cốt Lõi

### Mục Tiêu Sản Phẩm
Biến trò chơi thành một vòng lặp Roguelite - ARPG hoàn chỉnh:
1. **Tại Sảnh Chờ (Lobby Hub)**: Nhận thưởng nhiệm vụ, quay Vòng Quay May Mắn, mở khóa và nâng cấp kho vũ khí/giáp trụ từ Common đến Legendary bằng Vàng.
2. **Trong Trận Đánh (Combat Expedition)**: Chiến đấu qua 20 wave với hiệu ứng kỹ năng mãn nhãn (vết chém phát sáng, tia sét nổ, rung chấn camera, tia lửa va chạm), đối đầu quái vật đánh đau và hiểm hóc.
3. **Thu Thập & Reset**: Nhặt trang bị tạm thời từ hòm báu để vượt qua 20 wave của bản đồ hiện tại. Khi hoàn thành hoặc chuyển bản đồ mới, chỉ số tạm thời sẽ reset về mốc trang bị vĩnh viễn của Sảnh Chờ, giữ vững tính thử thách cho từng vùng đất.

---

## 2. Trải Nghiệm Người Dùng & Thiết Kế Giao Diện

### A. Luồng Chuyển Đổi Trạng Thái
```
[ Màn Hình Chính (Title) ]
         │
         ▼
[ Sảnh Chờ Hoàng Gia (Lobby Hub) ] ◄────────────────────────┐
   ├── 1. Tiệm Vũ Khí & Giáp (Shop/Armory)                 │
   ├── 2. Bảng Nhiệm Vụ Thưởng Vàng (Quest Board)          │
   ├── 3. Vòng Quay May Mắn (Lucky Wheel)                  │
   ├── 4. Tủ Đồ Trang Phục (Wardrobe)                      │
   └── 5. Cổng Dịch Chuyển (Map Departure)                 │
         │ (Xuất chiến)                                     │
         ▼                                                  │
[ Đấu Trường 20 Wave (Combat Arena) ]                       │
   ├── Quái đánh đau, hiệu ứng đòn đánh rực lửa             │
   ├── Mở hòm báu nhận buff & đồ tạm thời                  │
   ├── Hạ Boss ải 5, 10, 15, 20                             │
   └── Qua Map Mới ──► [Reset Chỉ Số Rương] ───────────────┤
         │                                                  │
   [ Thất Bại / Rút Lui ] ──────────────────────────────────┘
```

### B. Phong Cách Thị Giác & Bố Cục Sảnh Chờ
- **Tone màu chủ đạo**: Nền đá hắc thạch vũ trụ (`#0b0f19`), ánh sáng kim loại dát vàng hoàng gia (`amber-400 / amber-500`), lửa ma pháp huyền thoại (`red-500 / purple-500 / emerald-400`).
- **Phân cấp màu sắc trang bị**:
  - **Common (Phổ Thông)**: Xám bạc thanh lịch (`#94a3b8`), giá 100 - 250 Vàng.
  - **Rare (Hiếm)**: Xanh lam tinh khiết (`#38bdf8`), giá 400 - 750 Vàng.
  - **Epic (Sử Thi)**: Tím hoàng gia rực rỡ (`#a855f7`), giá 1,000 - 1,800 Vàng.
  - **Legendary (Truyền Thuyết)**: Vàng kim thần thoại (`#f59e0b` / hào quang phát sáng), giá 2,500 - 5,000 Vàng.
- **Vòng Quay May Mắn (Lucky Wheel Modal)**:
  - Bánh xe 8 ô chia đều với hiệu ứng kim xoay vật lý, âm thanh tích tắc theo từng nấc và đèn LED viền chuyển động.
  - Các phần thưởng đa dạng: Túi Vàng nhỏ (80g), Rương Vàng lớn (300g), Đá Cường Hóa (+5 ATK vĩnh viễn), Giáp Hộ Mệnh (+20 Max HP), Vé Giảm Giá Shop, Vũ Khí Hiếm/Sử Thi ngẫu nhiên, và Ô Đặc Biệt Jackpot (1,000g).
  - Bảng giá lượt quay hiển thị rõ ràng: Lượt 1 (50g) → Lượt 2 (100g) → Lượt 3 (200g) → Lượt 4 (350g) → Lượt 5+ (500g).

### C. Bảng Nhiệm Vụ Thưởng Vàng (Quest System)
Gồm 8 nhiệm vụ mục tiêu rõ ràng, tự động theo dõi tiến độ theo thời gian thực và có nút "Nhận Thưởng" tức thì:
1. **Tân Binh Trảm Quái**: Tiêu diệt 30 quái vật bất kỳ (Thưởng: +150 Vàng).
2. **Kẻ Săn Ma Vương**: Hạ gục 2 Boss bất kỳ ở ải 5/10/15/20 (Thưởng: +250 Vàng).
3. **Đạo Tặc Kho Báu**: Mở 4 Hòm Rương Thần Khí (Thưởng: +120 Vàng).
4. **Vũ Điệu Lưỡi Gươm**: Đạt chuỗi Combo Rank S trở lên (Thưởng: +180 Vàng).
5. **Thần Tốc Né Đòn**: Thực hiện 15 cú Lướt né đòn thành công (Thưởng: +100 Vàng).
6. **Bậc Thầy Kỹ Năng**: Tung chiêu Cuối (Ultimate) 3 lần (Thưởng: +200 Vàng).
7. **Thợ Rèn Huyền Thoại**: Mở khóa 2 món vũ khí tại Sảnh Chờ (Thưởng: +300 Vàng).
8. **Chinh Phục Đại Ngàn**: Vượt qua ít nhất 10 wave tại Rừng Nguyên Sinh (Thưởng: +220 Vàng).

### D. Hiệu Ứng Hình Ảnh Kết Hợp Chiến Đấu (Combat VFX)
1. **Tia Lửa Va Chạm Đa Dạng (Impact Sparks)**:
   - Chiến Binh: Lưỡi chém xé gió rực lửa đỏ cam kèm tia lửa tóe rực.
   - Pháp Sư: Hỏa cầu phát nổ tỏa sóng xung kích lam ngọc và bụi ma pháp.
   - Xạ Thủ: Mũi tên xé gió để lại vệt sáng xanh lục neon và hiệu ứng xuyên phá.
   - Thích Khách: Cặp song đao chém chớp nhoáng màu tím tím bí ẩn.
   - Thánh Kỵ Sĩ: Vòng tròn ánh sáng thần thánh vàng rực bảo hộ.
2. **Hiệu Ứng Báo Đòn Đỏ Nguy Cấp**:
   - Khi quái chuẩn bị vung đòn chí mạng, vòng cảnh báo đỏ phát xung nhanh hơn và ký hiệu nguy hiểm chớp sáng.
   - Trúng đòn quái sẽ gây rung màn hình giật mạnh (heavy impact camera shake) và lóe viền đỏ cảnh báo máu thấp.

---

## 3. Kiến Trúc Kỹ Thuật & Luồng Dữ Liệu

### A. Sơ Đồ Hệ Thống (ASCII Architecture Diagram)
```
┌────────────────────────────────────────────────────────────────────────┐
│                              APP STATE                                 │
│  - currentView: 'TITLE' | 'LOBBY' | 'COMBAT'                          │
│  - playerCurrency: gold                                                │
│  - unlockedShopItems: Set<string>                                      │
│  - equippedLobbyGear: { weapon, armor, talisman }                      │
│  - questProgress: Record<string, { current, target, completed }>       │
│  - wheelSpinsToday: number                                             │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
         ┌─────────┴─────────┐             ┌─────────┴─────────┐
         ▼                   ▼             ▼                   ▼
┌──────────────────┐┌────────────────┐┌────────────────┐┌────────────────┐
│   LOBBY VIEW     ││   SHOP MODAL   ││  QUEST MODAL   ││  WHEEL MODAL   │
│ - 3D/2.5D Hub    ││ - Common/Rare/ ││ - 8 Bounties   ││ - Physics spin │
│ - Character Hero ││   Epic/Legend  ││ - Live counters││ - Scaled cost  │
│ - Portals & Tabs ││ - Permanent Buy││ - Claim Gold   ││ - Drop rewards │
└────────┬─────────┘└────────────────┘└────────────────┘└────────────────┘
         │ (Embark with Lobby baseline gear)
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        COMBAT ENGINE RUNTIME                           │
│  - Base Stats = 250 HP, 20 ATK + Lobby Equipped Gear                   │
│  - In-Run Buffs = Chest Loot (Weapon/Armor/Relics)                     │
│  - Monster Scaled Lethality (Damage 1.8x - 2.2x)                       │
│  - Advanced Combat VFX (Trails, Shockwaves, Dynamic Particles)         │
│  - On Stage Completion ──► Check Quests & Increment Counters           │
│  - On Map Transition ──► [RESET IN-RUN CHEST BUFFS TO LOBBY BASELINE]  │
└────────────────────────────────────────────────────────────────────────┘
```

### B. Cấu Trúc Dữ Liệu Mới (`src/game/types.ts` & `src/game/rules.ts`)
1. **`LobbyItem`**:
   - `id`: Mã trang bị (ví dụ: `wpn_legend_excalibur`, `arm_epic_dragon_scale`)
   - `name`: Tên tiếng Việt oai vệ
   - `type`: `'weapon' | 'armor' | 'talisman'`
   - `tier`: `'common' | 'rare' | 'epic' | 'legendary'`
   - `cost`: Giá Vàng mở khóa
   - `stats`: `{ hp: number, atk: number, def: number, critRate?: number }`
   - `description`: Mô tả truyền thuyết trang bị
   - `icon`: Biểu tượng hình ảnh đại diện
2. **`QuestDefinition`**:
   - `id`: Mã nhiệm vụ
   - `title`: Tên nhiệm vụ
   - `description`: Yêu cầu cụ thể
   - `target`: Chỉ tiêu cần hoàn thành
   - `rewardGold`: Số Vàng thưởng
   - `metric`: `'kills' | 'boss_kills' | 'chests_opened' | 'combo_rank' | 'dashes' | 'ultimates' | 'shop_unlocks' | 'wave_cleared'`
3. **Cơ Chế Reset Bản Đồ**:
   - Trong `CombatEngine`: tách biệt `permanentLobbyStats` và `runChestEquipment`.
   - Hàm `switchMap(newMap)` hoặc `nextStage` khi chuyển map sẽ đặt lại `runChestEquipment` về rỗng và tái lập chỉ số nhân vật về `permanentLobbyStats`.

### C. Cân Bằng Sát Thương Quái Vật (Lethal Threat Tuning)
- Máu cơ bản của Hero: **250 HP**, Sát thương đánh thường cơ bản: **20 ATK**.
- Sát thương quái thường (Swarm/Ranged/Brute): tăng từ 8-16 lên **16-32 sát thương/đòn** (khoảng 8-12% cây máu nhân vật mỗi đòn trúng).
- Sát thương đòn đánh dập mạnh của Brute / Boss: **45-75 sát thương** (chiếm 20-30% cây máu nhân vật nếu không né đòn telegraphed).
- Tốc độ đòn đánh và thời gian báo trước (telegraph) được tinh chỉnh để tạo cảm giác phản xạ thể thao điện tử, trừng phạt sơ suất nhưng thưởng công cho người chơi né khéo léo.

---

## 4. Kế Hoạch Kiểm Thử & Xác Minh

1. **Kiểm Tra Logic Với Unit Test**:
   - Kiểm tra mở khóa trang bị trong Sảnh Chờ và tính năng trang bị vĩnh viễn.
   - Kiểm tra công thức tăng giá Vòng Quay May Mắn theo lượt.
   - Kiểm tra sự kiện reset chỉ số rương khi chuyển đổi bản đồ (`switchMap`).
   - Kiểm tra hệ thống cập nhật tiến độ nhiệm vụ và nhận thưởng Vàng.
2. **Kiểm Tra Biên Dịch & Linting**:
   - Chạy đồng thời `compile_applet` và `lint_applet` đảm bảo 100% không có lỗi TypeScript hay cú pháp.
3. **Kiểm Thử Trực Quan Trình Duyệt**:
   - Xác nhận chuyển đổi từ Title Screen sang Sảnh Chờ mượt mà.
   - Kiểm tra mua vũ khí Legendary và thấy chỉ số tăng rõ ràng.
   - Thử quay Vòng Quay May Mắn và quan sát hoạt ảnh bánh xe xoay cùng giá tiền tăng theo lượt.
   - Vào trận đấu: kiểm tra quái đánh đau hơn, hiệu ứng chiến đấu rực rỡ và khi chuyển map mới các buff rương được reset chính xác.
