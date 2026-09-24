export type UserRole = 'admin' | 'can_bo_xa' | 'to_truong';

export interface Commune {
  id: string;
  code: string;
  name: string; // VD: Xã Hòa Khương, Xã Hòa Tiến, Phường Thạch Thang
  district: string; // Huyện Hòa Vang, Quận Hải Châu...
  province: string; // TP. Đà Nẵng...
  phone?: string;
  email?: string;
  leaderName?: string; // Chủ tịch / PCT UBND
  notes?: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  communeId?: string; // Thuộc xã/phường nào
  communeName?: string;
  unitId?: string; // id của thôn/tổ nếu là tổ trưởng, hoặc 'xa'
  unitName?: string;
  phone?: string;
  email?: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  size?: string;
  uploadedAt: string;
  uploadedBy?: string;
  fileType: 'image' | 'pdf' | 'word' | 'excel' | 'other';
  dataUrl?: string; // base64 Data URL for real preview / download
  category?: 'vi_pham' | 'khong_dat' | 'quyet_dinh' | 'bao_cao_to' | 'khac';
  description?: string;
}

export interface Unit {
  id: string;
  communeId: string; // Thuộc xã/phường nào
  communeName?: string;
  code: string;
  name: string; // VD: Tổ dân phố 1, Thôn 1
  leaderName: string; // Trưởng thôn/tổ
  leaderPhone: string;
  totalHouseholds: number;
  totalPopulation: number;
  notes?: string;
  reportFiles?: EvidenceFile[]; // Hồ sơ báo cáo thành tích của Thôn/Tổ
}

export type ClanCulturalStatus = 'chua_cong_nhan' | 'dang_ky' | 'dang_tham_tra' | 'dat_chuan' | 'tieu_bieu';

export interface Clan {
  id: string;
  communeId: string; // Thuộc xã/phường nào
  communeName?: string;
  code: string;
  name: string; // VD: Tộc Nguyễn Văn, Tộc Lê Đình
  unitId: string; // Thuộc thôn/tổ nào
  unitName: string;
  patriarchName: string; // Trưởng tộc
  patriarchPhone?: string;
  totalHouseholds: number;
  notes?: string;

  // Dữ liệu văn hóa do UBND Xã/Phường trực tiếp nhập & ghi nhận (Không cần chấm điểm)
  culturalStatus: ClanCulturalStatus; // Trạng thái công nhận
  recognitionYear?: number; // Năm công nhận
  decisionNumber?: string; // Số Quyết định UBND xã (VD: 88/QĐ-UBND)
  decisionDate?: string; // Ngày ký ban hành quyết định
  achievements?: string; // Thành tích nổi bật (Khuyến học, an ninh trật tự, dòng họ gương mẫu...)
  communeNotes?: string; // Đánh giá, ghi chú của Hội đồng xã
}

export interface Household {
  id: string;
  communeId: string; // Thuộc xã/phường nào
  communeName?: string;
  code: string;
  headName: string; // Chủ hộ
  gender: 'Nam' | 'Nữ';
  birthYear?: number;
  memberCount: number; // Số nhân khẩu
  address: string;
  unitId: string; // Thuộc thôn/tổ
  unitName: string;
  residentialCluster?: string; // Cụm dân cư (ví dụ: Cụm 1, Cụm 2, Cụm 3, Cụm trung tâm...)
  clanId?: string; // Tùy chọn (không bắt buộc)
  clanName?: string;
  phone?: string;
  notes?: string;
}

export interface EvaluationPeriod {
  id: string;
  communeId: string; // Xã/phường tự tạo và sở hữu đợt xét này
  communeName?: string;
  name: string; // VD: Đợt bình xét danh hiệu Văn hóa năm 2026
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'upcoming' | 'closed';
  notes?: string;

  // Quyết định công nhận của UBND Xã/Phường sau khi chốt dữ liệu
  decisionFile?: EvidenceFile;
  decisionNumber?: string; // Số QĐ (VD: "215/QĐ-UBND")
  decisionDate?: string; // Ngày ký ban hành
  decisionSigner?: string; // Người ký (Chủ tịch / PCT UBND Xã)
  isFinalized?: boolean; // Đã chốt toàn xã & ban hành QĐ
}

export type UnitSubmissionStatus = 'chua_gui' | 'da_gui' | 'da_chot' | 'tra_lai';

export interface UnitPeriodProgress {
  unitId: string;
  periodId: string;
  status: UnitSubmissionStatus;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  returnedAt?: string;
  returnedBy?: string;
  returnReason?: string; // Lý do xã trả hồ sơ để tổ chấm lại
  reportFiles?: EvidenceFile[]; // Các file báo cáo liên quan của Thôn / Tổ dân phố (Báo cáo thành tích, Biên bản họp...)
  notes?: string;
}

export interface EvaluationScoreItem {
  id: string;
  periodId: string;
  targetType: 'household' | 'unit' | 'clan';
  targetId: string;
  targetName: string;
  unitId: string;
  unitName: string;
  
  // Điểm các tiêu chuẩn chính
  criteriaScores: {
    standard1: number; // Gương mẫu chấp hành chủ trương, pháp luật (max 30)
    standard2: number; // Phát triển kinh tế, nỗ lực làm giàu (max 30)
    standard3: number; // Nếp sống văn hóa, gia đình hòa thuận (max 30)
    standard4: number; // Môi trường, cảnh quan, an ninh trật tự (max 10)
  };
  bonusPoints: number; // Điểm cộng (VD: Thành tích xuất sắc, khen thưởng)
  penaltyPoints: number; // Điểm trừ (VD: Vi phạm quy ước, vi phạm hành chính)
  
  totalStandardScore: number; // Sum of standards (max 100)
  finalScore: number; // totalStandardScore + bonusPoints - penaltyPoints (tối đa 100, min 0)
  isQualified: boolean; // >= 90 điểm

  // Gia đình văn hóa tiêu biểu & Minh chứng vi phạm / không đạt
  isExemplary?: boolean; // Gia đình văn hóa tiêu biểu
  hasViolation?: boolean; // Có vi phạm (điểm trừ, vi phạm quy ước, pháp luật)
  violationDetails?: string; // Chi tiết vi phạm / nguyên nhân không đạt
  evidenceFiles?: EvidenceFile[]; // Tệp minh chứng không đạt, biên bản xử phạt, hình ảnh vi phạm
  returnStatus?: 'none' | 'returned_for_revision'; // Cấp xã trả hồ sơ hộ này để tổ chấm lại
  returnReason?: string; // Lý do trả hồ sơ riêng cho hộ

  evaluatedByLevel: 'to' | 'xa'; // Điểm này do Tổ chấm hay do Xã chấm/chốt
  comments?: string;
  updatedAt: string;
}

// ===== CÁC DANH MỤC HỆ THỐNG (MASTER DATA CATALOGS) =====

// 1. Danh mục Tiêu chí / Tiêu chuẩn thành phần
export interface CriterionItem {
  id: string;
  standardKey: 'standard1' | 'standard2' | 'standard3' | 'standard4';
  code: string; // VD: TC1.1, TC2.1
  name: string; // Tên tiêu chí
  maxPoints: number; // Điểm tối đa
  targetType: 'all' | 'household' | 'unit' | 'clan';
  description: string;
  order: number;
}

// 2. Danh mục Điểm cộng / Khen thưởng
export interface BonusCategory {
  id: string;
  code: string; // VD: DC-01
  title: string;
  points: number; // VD: 1, 2, 3
  applicableTarget: 'all' | 'household' | 'unit' | 'clan';
  categoryGroup: string; // 'Chính sách xã hội', 'Thành tích đột xuất', 'Hiến đất / Xã hội hóa', 'Khuyến học'...
  description: string;
}

// 3. Danh mục Điểm trừ / Vi phạm
export interface PenaltyCategory {
  id: string;
  code: string; // VD: DT-01
  title: string;
  points: number; // Điểm trừ (dương số, VD: 2, 5, 10)
  applicableTarget: 'all' | 'household' | 'unit' | 'clan';
  categoryGroup: string; // 'Trật tự an toàn giao thông', 'Môi trường & Vệ sinh', 'Quy ước thôn tổ', 'Trật tự xã hội'
  severity: 'Nhẹ' | 'Nghiêm trọng' | 'Rất nghiêm trọng';
  description: string;
}

// 4. Danh mục Danh hiệu Văn hóa & Thi đua
export interface TitleCategory {
  id: string;
  code: string;
  name: string;
  targetType: 'household' | 'unit' | 'clan';
  minScore: number; // Điểm sàn (VD: 90)
  quotaPercent?: number; // Tỷ lệ tối đa bình xét (VD: 20% cho danh hiệu tiêu biểu)
  isExemplary: boolean; // Danh hiệu tiêu biểu hay đạt chuẩn thông thường
  legalDoc: string; // Nghị định 86/2023/NĐ-CP
  description: string;
}

// 5. Danh mục Phân loại Hộ gia đình
export interface HouseholdTypeCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
}
