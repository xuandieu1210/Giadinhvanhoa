import { Commune } from '../types';

export interface AdministrativeTerms {
  isWard: boolean; // true nếu là Phường hoặc Thị trấn

  // Cấp xã / phường:
  communeLevel: string; // "Xã" | "Phường"
  communeLevelLower: string; // "xã" | "phường"
  communeGov: string; // "UBND Xã" | "UBND Phường"
  communeGovLower: string; // "UBND xã" | "UBND phường"
  communeOfficer: string; // "Cán bộ Xã" | "Cán bộ Phường"
  communeOfficerLower: string; // "cán bộ xã" | "cán bộ phường"
  communeCouncil: string; // "Hội đồng Xã" | "Hội đồng Phường"
  communeApproval: string; // "Cấp Xã" | "Cấp Phường"
  communeApprovalLower: string; // "cấp xã" | "cấp phường"

  // Cấp thôn / tổ dân phố:
  unitLabel: string; // "Thôn" | "Tổ dân phố"
  unitLabelLower: string; // "thôn" | "tổ dân phố"
  unitLabelShort: string; // "Thôn" | "Tổ DP"
  unitLabelShortLower: string; // "thôn" | "tổ DP"
  unitLabelPlural: string; // "các Thôn" | "các Tổ dân phố"
  unitLabelPluralLower: string; // "các thôn" | "các tổ dân phố"
  unitLeader: string; // "Trưởng thôn" | "Tổ trưởng"
  unitLeaderLower: string; // "trưởng thôn" | "tổ trưởng"
  unitCulturalTitle: string; // "Thôn Văn hóa" | "Tổ dân phố Văn hóa"
  unitCulturalTitleLower: string; // "thôn văn hóa" | "tổ dân phố văn hóa"
  unitMeeting: string; // "Họp nhân dân thôn" | "Họp tổ dân phố"
  unitReport: string; // "Báo cáo thành tích Thôn" | "Báo cáo thành tích Tổ dân phố"

  // Cụm kết hợp:
  communeAndUnit: string; // "Xã, Thôn" | "Phường, Tổ dân phố"
  unitAndCommune: string; // "Thôn và Xã" | "Tổ dân phố và Phường"
  householdAndUnit: string; // "Hộ & Thôn" | "Hộ & Tổ DP"
}

/**
 * Tự động phân định danh xưng hành chính (Xã, Thôn) vs (Phường, Tổ dân phố)
 * dựa vào tên hoặc loại hình của đơn vị hành chính cấp cơ sở.
 */
export function getAdministrativeTerms(
  commune?: Partial<Commune> | { name?: string; communeType?: string }
): AdministrativeTerms {
  const name = (commune?.name || '').trim();
  const type = commune?.communeType;

  const isWard =
    type === 'phuong' ||
    type === 'thi_tran' ||
    name.toLowerCase().startsWith('phường') ||
    name.toLowerCase().includes('phường') ||
    name.toLowerCase().startsWith('thị trấn') ||
    name.toLowerCase().includes('thị trấn');

  if (isWard) {
    return {
      isWard: true,
      communeLevel: 'Phường',
      communeLevelLower: 'phường',
      communeGov: 'UBND Phường',
      communeGovLower: 'UBND phường',
      communeOfficer: 'Cán bộ Phường',
      communeOfficerLower: 'cán bộ phường',
      communeCouncil: 'Hội đồng Phường',
      communeApproval: 'Cấp Phường',
      communeApprovalLower: 'cấp phường',

      unitLabel: 'Tổ dân phố',
      unitLabelLower: 'tổ dân phố',
      unitLabelShort: 'Tổ DP',
      unitLabelShortLower: 'tổ DP',
      unitLabelPlural: 'các Tổ dân phố',
      unitLabelPluralLower: 'các tổ dân phố',
      unitLeader: 'Tổ trưởng',
      unitLeaderLower: 'tổ trưởng',
      unitCulturalTitle: 'Tổ dân phố Văn hóa',
      unitCulturalTitleLower: 'tổ dân phố văn hóa',
      unitMeeting: 'Họp tổ dân phố',
      unitReport: 'Báo cáo thành tích Tổ dân phố',

      communeAndUnit: 'Phường, Tổ dân phố',
      unitAndCommune: 'Tổ dân phố và Phường',
      householdAndUnit: 'Hộ & Tổ DP',
    };
  }

  // Mặc định cho Xã
  return {
    isWard: false,
    communeLevel: 'Xã',
    communeLevelLower: 'xã',
    communeGov: 'UBND Xã',
    communeGovLower: 'UBND xã',
    communeOfficer: 'Cán bộ Xã',
    communeOfficerLower: 'cán bộ xã',
    communeCouncil: 'Hội đồng Xã',
    communeApproval: 'Cấp Xã',
    communeApprovalLower: 'cấp xã',

    unitLabel: 'Thôn',
    unitLabelLower: 'thôn',
    unitLabelShort: 'Thôn',
    unitLabelShortLower: 'thôn',
    unitLabelPlural: 'các Thôn',
    unitLabelPluralLower: 'các thôn',
    unitLeader: 'Trưởng thôn',
    unitLeaderLower: 'trưởng thôn',
    unitCulturalTitle: 'Thôn Văn hóa',
    unitCulturalTitleLower: 'thôn văn hóa',
    unitMeeting: 'Họp nhân dân thôn',
    unitReport: 'Báo cáo thành tích Thôn',

    communeAndUnit: 'Xã, Thôn',
    unitAndCommune: 'Thôn và Xã',
    householdAndUnit: 'Hộ & Thôn',
  };
}
