import * as XLSX from 'xlsx';
import { Clan, EvaluationPeriod, EvaluationScoreItem, Household, Unit, UnitPeriodProgress } from '../types';

export const exportUnitsToExcel = (units: Unit[], filename = 'Danh_sach_Thon_To.xlsx') => {
  const data = units.map((u, idx) => ({
    'STT': idx + 1,
    'Mã Thôn/Tổ': u.code,
    'Tên Thôn/Tổ': u.name,
    'Trưởng Thôn/Tổ': u.leaderName,
    'Số điện thoại': u.leaderPhone,
    'Số hộ': u.totalHouseholds,
    'Số nhân khẩu': u.totalPopulation,
    'Ghi chú': u.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Thon_To');
  XLSX.writeFile(workbook, filename);
};

export const exportClansToExcel = (clans: Clan[], filename = 'Danh_sach_Toc_ho.xlsx') => {
  const data = clans.map((c, idx) => {
    let statusStr = 'Chưa công nhận';
    if (c.culturalStatus === 'dat_chuan') statusStr = 'Đã công nhận Dòng họ văn hóa';
    else if (c.culturalStatus === 'dang_tham_tra') statusStr = 'Đang thẩm tra hồ sơ';

    return {
      'STT': idx + 1,
      'Mã Tộc họ': c.code,
      'Tên Tộc họ': c.name,
      'Thuộc Thôn/Tổ': c.unitName,
      'Trưởng tộc': c.patriarchName,
      'Số điện thoại': c.patriarchPhone || '',
      'Số hộ trong tộc': c.totalHouseholds,
      'Trạng thái công nhận': statusStr,
      'Năm công nhận': c.recognitionYear || '',
      'Số Quyết định công nhận': c.decisionNumber || '',
      'Ghi chú': c.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Toc_ho');
  XLSX.writeFile(workbook, filename);
};

export const exportHouseholdsToExcel = (households: Household[], filename = 'Danh_sach_Ho_gia_dinh.xlsx') => {
  const data = households.map((h, idx) => ({
    'STT': idx + 1,
    'Mã hộ': h.code,
    'Chủ hộ': h.headName,
    'Giới tính': h.gender,
    'Năm sinh': h.birthYear || '',
    'Số nhân khẩu': h.memberCount,
    'Địa chỉ': h.address,
    'Thôn/Tổ': h.unitName,
    'Tộc họ': h.clanName || 'Không thuộc tộc họ',
    'Số điện thoại': h.phone || '',
    'Ghi chú': h.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ho_gia_dinh');
  XLSX.writeFile(workbook, filename);
};

export const exportReportToExcel = (
  period: EvaluationPeriod,
  units: Unit[],
  progressList: UnitPeriodProgress[],
  scores: EvaluationScoreItem[],
  households: Household[],
  clans: Clan[],
  filename?: string
) => {
  const finalFilename = filename || `Bao_cao_Binh_xet_Van_hoa_${period.year}.xlsx`;
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Tổng hợp tiến độ nộp của Thôn/Tổ
  const progressData = units.map((u, idx) => {
    const prog = progressList.find(p => p.unitId === u.id && p.periodId === period.id);
    let statusText = 'Chưa gửi';
    if (prog?.status === 'da_chot') statusText = 'Đã chốt duyệt';
    else if (prog?.status === 'da_gui') statusText = 'Đã gửi (Chờ duyệt)';

    const unitScore = scores.find(s => s.periodId === period.id && s.targetType === 'unit' && s.targetId === u.id);
    const unitHouseholds = households.filter(h => h.unitId === u.id);
    const qualifiedHouseholds = unitHouseholds.filter(h => {
      const sc = scores.find(s => s.periodId === period.id && s.targetType === 'household' && s.targetId === h.id);
      return sc && sc.isQualified;
    }).length;

    return {
      'STT': idx + 1,
      'Mã Đơn vị': u.code,
      'Tên Thôn/Tổ': u.name,
      'Trưởng đơn vị': u.leaderName,
      'Trạng thái nộp': statusText,
      'Thời gian nộp': prog?.submittedAt || 'Chưa nộp',
      'Người nộp': prog?.submittedBy || '',
      'Thời gian duyệt chốt': prog?.approvedAt || 'Chưa chốt',
      'Người duyệt': prog?.approvedBy || '',
      'Tổng số hộ': unitHouseholds.length,
      'Hộ đạt chuẩn văn hóa': qualifiedHouseholds,
      'Tỷ lệ hộ đạt (%)': unitHouseholds.length > 0 ? ((qualifiedHouseholds / unitHouseholds.length) * 100).toFixed(1) + '%' : '0%',
      'Điểm tự chấm Thôn/Tổ': unitScore ? unitScore.finalScore : 'Chưa chấm',
      'Thôn/Tổ Đạt chuẩn': unitScore ? (unitScore.isQualified ? 'ĐẠT' : 'CHƯA ĐẠT') : 'Chưa xét',
    };
  });
  const ws1 = XLSX.utils.json_to_sheet(progressData);
  XLSX.utils.book_append_sheet(workbook, ws1, 'Tien_do_Thon_To');

  // Sheet 2: Danh sách chi tiết Hộ gia đình được chấm
  const periodHouseholds = households.map((h, idx) => {
    const sc = scores.find(s => s.periodId === period.id && s.targetType === 'household' && s.targetId === h.id);
    return {
      'STT': idx + 1,
      'Mã hộ': h.code,
      'Chủ hộ': h.headName,
      'Thôn/Tổ': h.unitName,
      'Tộc họ': h.clanName || '',
      'Địa chỉ': h.address,
      'TC1: Chấp hành chủ trương (30đ)': sc ? sc.criteriaScores.standard1 : '',
      'TC2: Phát triển KT (30đ)': sc ? sc.criteriaScores.standard2 : '',
      'TC3: Nếp sống VH (30đ)': sc ? sc.criteriaScores.standard3 : '',
      'TC4: Môi trường & ANTT (10đ)': sc ? sc.criteriaScores.standard4 : '',
      'Điểm cộng': sc ? sc.bonusPoints : '',
      'Điểm trừ': sc ? sc.penaltyPoints : '',
      'Tổng điểm cuối': sc ? sc.finalScore : 'Chưa chấm',
      'Kết quả bình xét': sc ? (sc.isQualified ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT') : 'Chưa chấm',
      'GĐVH Tiêu biểu': sc?.isExemplary ? 'TIÊU BIỂU ★' : 'Không',
      'Có vi phạm': sc?.hasViolation ? 'CÓ VI PHẠM' : 'Không',
      'Chi tiết vi phạm': sc?.violationDetails || '',
      'Số tệp minh chứng': sc?.evidenceFiles?.length || 0,
      'Cấp đánh giá': sc ? (sc.evaluatedByLevel === 'xa' ? 'Xã thẩm định/chốt' : 'Tổ tự chấm') : '',
      'Ghi chú': sc?.comments || '',
    };
  });
  const ws2 = XLSX.utils.json_to_sheet(periodHouseholds);
  XLSX.utils.book_append_sheet(workbook, ws2, 'Diem_Ho_gia_dinh');

  // Sheet 3: Danh sách Gia đình Văn hóa Tiêu biểu
  const exemplaryList = households
    .filter((h) => {
      const sc = scores.find(s => s.periodId === period.id && s.targetType === 'household' && s.targetId === h.id);
      return sc?.isExemplary;
    })
    .map((h, idx) => {
      const sc = scores.find(s => s.periodId === period.id && s.targetType === 'household' && s.targetId === h.id);
      return {
        'STT': idx + 1,
        'Mã hộ': h.code,
        'Chủ hộ': h.headName,
        'Thôn/Tổ': h.unitName,
        'Địa chỉ': h.address,
        'Tổng điểm': sc ? sc.finalScore : 0,
        'Danh hiệu': 'GIA ĐÌNH VĂN HÓA TIÊU BIỂU ★',
        'Đề nghị': 'UBND khen thưởng',
        'Ghi chú': sc?.comments || '',
      };
    });
  if (exemplaryList.length > 0) {
    const wsEx = XLSX.utils.json_to_sheet(exemplaryList);
    XLSX.utils.book_append_sheet(workbook, wsEx, 'Gia_dinh_Tieu_bieu');
  }

  // Sheet 4: Danh sách Hộ chưa đạt / Có vi phạm & Minh chứng
  const violationList = households
    .filter((h) => {
      const sc = scores.find(s => s.periodId === period.id && s.targetType === 'household' && s.targetId === h.id);
      return sc && (!sc.isQualified || sc.hasViolation || (sc.evidenceFiles && sc.evidenceFiles.length > 0));
    })
    .map((h, idx) => {
      const sc = scores.find(s => s.periodId === period.id && s.targetType === 'household' && s.targetId === h.id);
      return {
        'STT': idx + 1,
        'Mã hộ': h.code,
        'Chủ hộ': h.headName,
        'Thôn/Tổ': h.unitName,
        'Địa chỉ': h.address,
        'Tổng điểm': sc ? sc.finalScore : 0,
        'Tình trạng': sc?.isQualified ? 'Đạt chuẩn (Có vi phạm trừ điểm)' : 'CHƯA ĐẠT CHUẨN (<90đ)',
        'Chi tiết vi phạm': sc?.violationDetails || sc?.comments || 'Vi phạm nếp sống văn hóa / quy ước',
        'Số tệp minh chứng': sc?.evidenceFiles?.length || 0,
        'Tên tệp đính kèm': sc?.evidenceFiles?.map(f => f.name).join('; ') || '',
      };
    });
  if (violationList.length > 0) {
    const wsVio = XLSX.utils.json_to_sheet(violationList);
    XLSX.utils.book_append_sheet(workbook, wsVio, 'Ho_chua_dat_vi_pham');
  }

  // Sheet 5: Danh sách Tộc họ & Danh hiệu Văn hóa (do Xã/Phường công nhận)
  const clanData = clans.map((c, idx) => {
    let statusStr = 'Chưa công nhận';
    if (c.culturalStatus === 'dat_chuan') statusStr = 'ĐÃ CÔNG NHẬN DÒNG HỌ VH';
    else if (c.culturalStatus === 'dang_tham_tra') statusStr = 'Đang thẩm tra hồ sơ';

    return {
      'STT': idx + 1,
      'Mã Tộc': c.code,
      'Tên Tộc họ': c.name,
      'Thôn/Tổ': c.unitName,
      'Trưởng tộc': c.patriarchName,
      'Số hộ trong tộc': c.totalHouseholds,
      'Danh hiệu Văn hóa': statusStr,
      'Năm công nhận': c.recognitionYear || '',
      'Số QĐ công nhận': c.decisionNumber || '',
      'Ghi chú': c.notes || '',
    };
  });
  const ws3 = XLSX.utils.json_to_sheet(clanData);
  XLSX.utils.book_append_sheet(workbook, ws3, 'Danh_hieu_Toc_ho');

  XLSX.writeFile(workbook, finalFilename);
};

export const exportSubmissionStatusToExcel = (
  period: EvaluationPeriod,
  units: Unit[],
  progressList: UnitPeriodProgress[],
  filename?: string
) => {
  const finalFilename = filename || `Danh_sach_tien_do_gui_Dot_${period.year}.xlsx`;
  const data = units.map((u, idx) => {
    const prog = progressList.find(p => p.unitId === u.id && p.periodId === period.id);
    let statusText = 'Chưa gửi';
    if (prog?.status === 'da_chot') statusText = 'Đã chốt duyệt';
    else if (prog?.status === 'da_gui') statusText = 'Đã gửi (Chờ xã duyệt)';

    return {
      'STT': idx + 1,
      'Mã Thôn/Tổ': u.code,
      'Tên Thôn/Tổ': u.name,
      'Trưởng Thôn/Tổ': u.leaderName,
      'Số điện thoại': u.leaderPhone,
      'Trạng thái': statusText,
      'Thời điểm gửi': prog?.submittedAt || 'Chưa gửi',
      'Người gửi': prog?.submittedBy || '',
      'Thời điểm chốt': prog?.approvedAt || 'Chưa chốt',
      'Người duyệt chốt': prog?.approvedBy || '',
      'Ghi chú': prog?.notes || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tien_do_gui');
  XLSX.writeFile(wb, finalFilename);
};

// Parser helpers for uploaded Excel files
export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
