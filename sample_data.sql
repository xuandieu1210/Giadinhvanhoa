-- ========================================================
-- SAMPLE SQL DATA IMPORT FILE FOR POSTGRESQL
-- Hệ thống Quản lý Bình xét Danh hiệu Văn hóa (Xã / Phường / Thị trấn)
-- ========================================================

-- 1. Xã / Phường (Communes)
INSERT INTO communes (id, name, code, commune_type, active_period_id, created_at) VALUES
('c1', 'Xã Tân Dân', 'TDAN', 'xa', 'p1', NOW()),
('c2', 'Phường Lê Lợi', 'LLOI', 'phuong', 'p2', NOW());

-- 2. Đơn vị trực thuộc / Thôn / Tổ dân phố (Units)
INSERT INTO units (id, commune_id, name, code, leader_name, leader_phone, address) VALUES
('u1', 'c1', 'Thôn 1 - Tân Dân', 'T1', 'Nguyễn Văn A', '0912345678', 'Thôn 1, Xã Tân Dân'),
('u2', 'c1', 'Thôn 2 - Tân Dân', 'T2', 'Trần Văn B', '0987654321', 'Thôn 2, Xã Tân Dân'),
('u3', 'c2', 'Tổ dân phố 1', 'TDP1', 'Lê Thị C', '0901122334', 'Phố Lê Lợi, Phường Lê Lợi');

-- 3. Dòng họ văn hóa (Clans)
INSERT INTO clans (id, commune_id, name, chief_name, phone, address, member_count, cultural_status, recognition_year, decision_number, decision_date, achievements, commune_notes) VALUES
('clan1', 'c1', 'Dòng họ Nguyễn Văn', 'Nguyễn Văn Hùng', '0911222333', 'Thôn 1, Xã Tân Dân', 45, 'recognized', 2025, '12/QĐ-UBND', '2025-12-15', 'Gia đình văn hóa tiêu biểu, tích cực xây dựng nông thôn mới.', 'Dòng họ xuất sắc tiêu biểu nhiều năm liền.'),
('clan2', 'c1', 'Dòng họ Lê Đình', 'Lê Đình Khương', '0933444555', 'Thôn 2, Xã Tân Dân', 30, 'pending', NULL, NULL, NULL, 'Chấp hành tốt chủ trương chính sách.', 'Đang hoàn thiện hồ sơ xét duyệt.');

-- 4. Đợt bình xét (Periods)
INSERT INTO periods (id, commune_id, name, year, start_date, end_date, is_locked, is_published, decision_number, decision_date, decision_signer) VALUES
('p1', 'c1', 'Bình xét Văn hóa năm 2026 - Xã Tân Dân', 2026, '2026-01-01', '2026-12-31', false, false, NULL, NULL, NULL),
('p2', 'c2', 'Bình xét Văn hóa năm 2026 - Phường Lê Lợi', 2026, '2026-01-01', '2026-12-31', false, false, NULL, NULL, NULL);

-- 5. Hộ gia đình (Households)
INSERT INTO households (id, commune_id, unit_id, clan_id, code, head_name, member_count, address, is_party_member_family, party_member_count, notes, is_exemplary) VALUES
('h1', 'c1', 'u1', 'clan1', 'TD-01-001', 'Nguyễn Văn Hùng', 4, 'Số 12, Thôn 1', true, 2, 'Gia đình đảng viên mẫu mực', true),
('h2', 'c1', 'u1', 'clan1', 'TD-01-002', 'Nguyễn Thị Hoa', 3, 'Số 15, Thôn 1', false, 0, 'Kinh doanh giỏi', false),
('h3', 'c1', 'u2', 'clan2', 'TD-02-001', 'Lê Đình Nam', 5, 'Số 8, Thôn 2', true, 1, 'Hộ nông dân sản xuất giỏi', true);

-- 6. Điểm số đánh giá & Bình xét (Scores)
INSERT INTO scores (
    id, period_id, target_type, target_id, target_name, unit_id, unit_name, 
    criteria_scores, bonus_points, penalty_points, comments, 
    total_standard_score, final_score, is_qualified, is_exemplary, 
    has_violation, violation_details, evaluated_by_level
) VALUES
(
    's1', 'p1', 'household', 'h1', 'Nguyễn Văn Hùng', 'u1', 'Thôn 1 - Tân Dân',
    '{"standard1": 25, "standard2": 25, "standard3": 25, "standard4": 25}'::jsonb,
    5.0, 0.0, 'Đạt xuất sắc tất cả các tiêu chuẩn',
    100.0, 105.0, true, true, false, NULL, 'xa'
),
(
    's2', 'p1', 'household', 'h2', 'Nguyễn Thị Hoa', 'u1', 'Thôn 1 - Tân Dân',
    '{"standard1": 22, "standard2": 23, "standard3": 24, "standard4": 23}'::jsonb,
    0.0, 0.0, 'Đạt tiêu chuẩn gia đình văn hóa',
    92.0, 92.0, true, false, false, NULL, 'to'
);
