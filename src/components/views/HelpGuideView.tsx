import React from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  FileCheck2,
  FileSpreadsheet,
  Home,
  Key,
  Lock,
  Send,
  Shield,
  Users,
  Users2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HelpGuideViewProps {
  onClose?: () => void;
}

export const HelpGuideView: React.FC<HelpGuideViewProps> = ({ onClose }) => {
  const { switchUser } = useApp();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 text-red-800 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Hướng dẫn sử dụng phần mềm Bình xét Văn hóa
            </h2>
            <p className="text-xs text-slate-500">
              Quy trình chuẩn hóa nghiệp vụ bình xét Gia đình văn hóa, Thôn/Tổ văn hóa & Dòng họ văn hóa
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
          >
            Đóng hướng dẫn
          </button>
        )}
      </div>

      {/* Quick Test Accounts Bar */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
          <Key className="w-4 h-4 text-amber-700" />
          1. Tài khoản Demo sẵn có để kiểm tra ngay:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
            <span className="font-bold text-purple-900 block mb-1">👑 Quản trị viên (Admin)</span>
            <div className="text-slate-600 font-mono">admin / admin123</div>
            <button
              onClick={() => {
                switchUser('admin');
                onClose?.();
              }}
              className="mt-2 text-[11px] font-bold text-purple-700 hover:underline"
            >
              Chuyển sang Admin →
            </button>
          </div>

          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
            <span className="font-bold text-blue-900 block mb-1">🏛️ Cán bộ xã (Cấp duyệt)</span>
            <div className="text-slate-600 font-mono">xa / xa123</div>
            <button
              onClick={() => {
                switchUser('xa');
                onClose?.();
              }}
              className="mt-2 text-[11px] font-bold text-blue-700 hover:underline"
            >
              Chuyển sang Cán bộ Xã →
            </button>
          </div>

          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
            <span className="font-bold text-emerald-900 block mb-1">🏡 Tổ trưởng Tổ 1 (Cấp cơ sở)</span>
            <div className="text-slate-600 font-mono">to1 / to123</div>
            <button
              onClick={() => {
                switchUser('to1');
                onClose?.();
              }}
              className="mt-2 text-[11px] font-bold text-emerald-700 hover:underline"
            >
              Chuyển sang Tổ trưởng 1 →
            </button>
          </div>
        </div>
      </div>

      {/* Guide Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
        {/* Section 2: Quản lý danh mục */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Home className="w-4 h-4 text-red-600" />
            2. Quản lý hệ thống danh mục
          </h3>
          <ul className="space-y-2 list-disc pl-4 text-slate-600">
            <li>
              <strong>2.1 Quản lý Thôn/Tổ:</strong> Thêm mới, sửa, xóa thông tin thôn/tổ; hỗ trợ Import & Export file Excel (.xlsx).
            </li>
            <li>
              <strong>2.2 Quản lý Tộc họ:</strong> Nhập tên tộc họ, thuộc thôn/tổ, họ tên trưởng tộc, số hộ và ghi chú.
            </li>
            <li>
              <strong>2.3 Quản lý Hộ gia đình:</strong> Nhập chủ hộ, số nhân khẩu, địa chỉ, thuộc thôn/tổ, tộc họ (nếu có), số điện thoại và ghi chú.
            </li>
            <li>
              <strong>2.4 Quản lý Tiêu chí & Danh mục chuẩn (Mới):</strong> Cấu hình Bộ tiêu chí 4 tiêu chuẩn (NĐ 86/2023/NĐ-CP), Quy tắc điểm cộng khen thưởng, Quy tắc điểm trừ vi phạm, Khung danh hiệu thi đua và Phân loại hộ dân.
            </li>
            <li>
              <strong>2.5 Quản lý Người dùng:</strong> Chỉ Admin có quyền thêm, sửa thông tin, đổi vai trò (admin, cán bộ xã, tổ trưởng) và đơn vị phân công.
            </li>
          </ul>
        </div>

        {/* Section 3: Quản lý đợt xét */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-600" />
            3. Quản lý đợt xét & Thời hạn
          </h3>
          <ul className="space-y-2 list-disc pl-4 text-slate-600">
            <li>
              Tạo mới đợt xét với Tên đợt, Năm, Ngày bắt đầu, Ngày kết thúc, Trạng thái và Ghi chú.
            </li>
            <li>
              <strong>Quy định thời hạn:</strong> Nếu ngày hiện tại vượt quá ngày kết thúc của đợt xét, tổ/thôn <strong>không được tiếp tục chấm điểm</strong>.
            </li>
            <li>
              Xã/Admin vẫn có thể xem và quản lý dữ liệu lịch sử bình thường.
            </li>
          </ul>
        </div>

        {/* Section 4: Chấm điểm */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-red-600" />
            4. Chấm điểm theo đợt & Ngưỡng đạt
          </h3>
          <ul className="space-y-2 list-disc pl-4 text-slate-600">
            <li>
              Chọn đợt xét và đối tượng (Thôn/Tổ, Hộ gia đình, Tộc họ).
            </li>
            <li>
              Nhập điểm 4 tiêu chuẩn (30đ - 30đ - 30đ - 10đ), Điểm cộng và Điểm trừ.
            </li>
            <li>
              Hệ thống tự động tính Tổng điểm cuối cùng = (Tiêu chuẩn + Cộng - Trừ).
            </li>
            <li>
              <strong>Ngưỡng đạt chuẩn:</strong> Đối với Hộ gia đình, Thôn/Tổ, Tộc họ: đạt chuẩn khi từ <strong>90 điểm trở lên</strong>.
            </li>
          </ul>
        </div>

        {/* Section 5 & 6: Gửi & Duyệt */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-red-600" />
            5 & 6. Gửi dữ liệu & Duyệt chốt
          </h3>
          <ul className="space-y-2 list-disc pl-4 text-slate-600">
            <li>
              <strong>Gửi từ tổ lên xã:</strong> Tổ trưởng nhập xong chọn "Gửi dữ liệu lên xã". Sau khi gửi, tổ không được chỉnh sửa tiếp.
            </li>
            <li>
              <strong>Nếu tổ đã gửi:</strong> Cán bộ xã thẩm định, chấm lại (hoặc bấm chấm nhanh đạt) rồi <strong>Duyệt chốt</strong> để sao chép điểm cấp tổ sang cấp xã.
            </li>
            <li>
              <strong>Nếu tổ chưa gửi:</strong> Xã vẫn có thể chấm trực tiếp hoặc bấm chấm nhanh đạt thay cho tổ, sau đó Duyệt chốt bình thường.
            </li>
            <li>
              <strong>Sau khi đã chốt:</strong> Không ai (kể cả xã/phường) sửa được dữ liệu tổ đó nữa!
            </li>
          </ul>
        </div>
      </div>

      {/* Important Notes Banner (Section 9 & 10) */}
      <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-5 space-y-3">
        <h4 className="font-bold text-rose-950 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-700" />
          10. LƯU Ý QUAN TRỌNG VỀ TÍNH BẢO MẬT & KHÓA DỮ LIỆU
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-rose-900">
          <div className="bg-white/80 p-3 rounded-lg border border-rose-200">
            <strong>🔒 Cấp Tổ:</strong> Không sửa dữ liệu sau khi đã gửi lên xã. Khi đợt xét hết hạn, tổ không được chấm tiếp.
          </div>
          <div className="bg-white/80 p-3 rounded-lg border border-rose-200">
            <strong>⚖️ Cấp Xã / Admin:</strong> Có quyền chấm và duyệt chốt thay cho tổ ngay cả khi tổ chưa gửi. Một khi đã duyệt chốt, dữ liệu tổ đó bị khóa vĩnh viễn.
          </div>
        </div>
      </div>
    </div>
  );
};
