# Asset cho bay mô phỏng

Tải khi người chơi bấm "Bắt đầu" (cùng lúc với engine), không nằm trong HTML của trang nào. Model Kenney tính theo đơn vị của kit: cây cao khoảng 1,2–1,7 đơn vị, nhân 3 để được cây 4–5 m.

| Dùng cho | Asset |
|---|---|
| Mọi bài (cảnh sân tập) | `env/sky_noon_grass_1k.hdr` (bầu trời + ánh sáng), `env/grass/*` (mặt cỏ, lặp lại), cây `tree_default`, `tree_oak`, `tree_pineDefaultA`, `tree_pineRoundA`, `tree_detailed`, `tree_fat`; đá `rock_largeA`, `rock_tallA`, `stone_largeA`; bụi/hoa/cỏ `plant_bushDetailed`, `plant_bushLarge`, `flower_yellowA`, `flower_redA`, `grass_large`, `log`; hàng rào `fence_simple`; lều trạm điều khiển `tent` cạnh bãi cất cánh |
| Bài 1, Cất cánh và giữ độ cao | `flagRed` cạnh bãi cất cánh (mốc so độ cao, cờ cao ~3,75 m khi nhân 3) |
| Bài 2, Hạ cánh vào ô | `pylon` ở 4 góc ô hạ cánh vàng |
| Bài 3, Bay qua chuỗi vòng | `flagGreen` ở điểm xuất phát, `flagCheckers` sau vòng cuối; vòng vẫn dựng bằng code (gắn với chấm điểm) |
| Bài 4, Bay số 8 | `bannerTowerRed`, `bannerTowerGreen` thay hai cột trụ; `pylon` đánh dấu 8 cổng |

Drone, vòng, cổng và ô hạ cánh vẫn dựng bằng code: drone là hình ảnh thương hiệu, còn vòng/cổng/ô gắn với logic chấm điểm.
Nguồn và giấy phép: `CREDITS.md`.
