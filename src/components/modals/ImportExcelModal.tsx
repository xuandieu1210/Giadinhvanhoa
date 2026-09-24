import React, { useState } from 'react';
import { AlertCircle, Check, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseExcelFile } from '../../utils/excel';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'unit' | 'clan' | 'household';
  onImportSuccess: (importedData: any[]) => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  type,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'unit':
        return 'Nhập dữ liệu Thôn / Tổ từ Excel';
      case 'clan':
        return 'Nhập dữ liệu Tộc họ từ Excel';
      case 'household':
        return 'Nhập dữ liệu Hộ gia đình từ Excel';
    }
  };

  const handleDownloadTemplate = () => {
    let headers: Record<string, string | number>[] = [];
    let filename = '';

    if (type === 'unit') {
      filename = 'Mau_nhap_Thon_To.xlsx';
      headers = [
        {
          'Mã Thôn/Tổ': 'TDP-04',
          'Tên Thôn/Tổ': 'Tổ dân phố 4 (Thôn Nam)',
          'Trưởng Thôn/Tổ': 'Nguyễn Văn A',
          'Số điện thoại': '0905.111.222',
          'Số hộ': 120,
          'Số nhân khẩu': 480,
          'Ghi chú': 'Khu dân cư nông thôn mới',
        },
      ];
    } else if (type === 'clan') {
      filename = 'Mau_nhap_Toc_ho.xlsx';
      headers = [
        {
          'Mã Tộc họ': 'TOC-HV',
          'Tên Tộc họ': 'Tộc Hoàng Văn',
          'Thuộc Thôn/Tổ': 'Tổ dân phố 1 (Thôn 1)',
          'Trưởng tộc': 'Hoàng Văn C',
          'Số điện thoại': '0912.333.444',
          'Số hộ trong tộc': 25,
          'Ghi chú': 'Dòng họ hiếu học',
        },
      ];
    } else {
      filename = 'Mau_nhap_Ho_gia_dinh.xlsx';
      headers = [
        {
          'Mã hộ': 'HGĐ-010',
          'Chủ hộ': 'Trần Văn Bình',
          'Giới tính': 'Nam',
          'Năm sinh': 1978,
          'Số nhân khẩu': 4,
          'Địa chỉ': 'Số 102 Đường Lê Duẩn',
          'Thôn/Tổ': 'Tổ dân phố 1 (Thôn 1)',
          'Tộc họ': 'Tộc Trần Đình',
          'Số điện thoại': '0905.678.910',
          'Ghi chú': 'Gia đình chấp hành tốt',
        },
      ];
    }

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_nhap');
    XLSX.writeFile(wb, filename);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const rows = await parseExcelFile(selectedFile);
      if (!rows || rows.length === 0) {
        setError('Tệp Excel rỗng hoặc không đúng định dạng!');
        setPreviewRows([]);
      } else {
        setPreviewRows(rows);
      }
    } catch (err: any) {
      setError(`Lỗi đọc tệp Excel: ${err.message || 'Tệp không hợp lệ'}`);
      setPreviewRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (previewRows.length === 0) return;

    let mappedData: any[] = [];

    if (type === 'unit') {
      mappedData = previewRows.map((r, i) => ({
        code: r['Mã Thôn/Tổ'] || r['Mã'] || `TDP-NEW-${i + 1}`,
        name: r['Tên Thôn/Tổ'] || r['Tên'] || `Thôn/Tổ ${i + 1}`,
        leaderName: r['Trưởng Thôn/Tổ'] || r['Trưởng thôn'] || 'Chưa cập nhật',
        leaderPhone: r['Số điện thoại'] || r['SĐT'] || '',
        totalHouseholds: Number(r['Số hộ']) || 0,
        totalPopulation: Number(r['Số nhân khẩu']) || 0,
        notes: r['Ghi chú'] || '',
      }));
    } else if (type === 'clan') {
      mappedData = previewRows.map((r, i) => ({
        code: r['Mã Tộc họ'] || r['Mã'] || `TOC-NEW-${i + 1}`,
        name: r['Tên Tộc họ'] || r['Tên'] || `Tộc họ ${i + 1}`,
        unitId: 'unit-1', // Default
        unitName: r['Thuộc Thôn/Tổ'] || r['Thôn/Tổ'] || 'Tổ dân phố 1 (Thôn 1)',
        patriarchName: r['Trưởng tộc'] || 'Chưa cập nhật',
        patriarchPhone: r['Số điện thoại'] || r['SĐT'] || '',
        totalHouseholds: Number(r['Số hộ trong tộc']) || Number(r['Số hộ']) || 0,
        notes: r['Ghi chú'] || '',
      }));
    } else {
      mappedData = previewRows.map((r, i) => ({
        code: r['Mã hộ'] || `HGĐ-NEW-${i + 1}`,
        headName: r['Chủ hộ'] || r['Họ và tên'] || `Hộ mới ${i + 1}`,
        gender: r['Giới tính'] === 'Nữ' ? 'Nữ' : 'Nam',
        birthYear: Number(r['Năm sinh']) || undefined,
        memberCount: Number(r['Số nhân khẩu']) || 4,
        address: r['Địa chỉ'] || 'Chưa cập nhật',
        unitId: 'unit-1',
        unitName: r['Thôn/Tổ'] || 'Tổ dân phố 1 (Thôn 1)',
        clanName: r['Tộc họ'] || undefined,
        phone: r['Số điện thoại'] || r['SĐT'] || '',
        notes: r['Ghi chú'] || '',
      }));
    }

    onImportSuccess(mappedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">{getTitle()}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Download sample */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">
                1. Tải mẫu Excel chuẩn
              </div>
              <div className="text-xs text-slate-500">
                Sử dụng mẫu này để nhập liệu chính xác các cột thông tin
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Tải file mẫu .xlsx
            </button>
          </div>

          {/* Step 2: Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              2. Chọn file Excel (.xlsx hoặc .xls) từ máy tính của bạn:
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-red-50/20 relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">
                  {file ? file.name : 'Kéo thả file vào đây hoặc bấm để duyệt file'}
                </span>
                <span className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng .xlsx, .xls</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview data */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Xem trước dữ liệu ({previewRows.length} dòng):
                </span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Tệp hợp lệ
                </span>
              </div>
              <div className="max-h-48 overflow-auto border border-slate-200 rounded-lg text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      {Object.keys(previewRows[0] || {}).map((key) => (
                        <th key={key} className="p-2 border-b border-slate-200 font-semibold whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {previewRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {Object.values(row).map((val: any, cidx) => (
                          <td key={cidx} className="p-2 whitespace-nowrap max-w-xs truncate">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 5 && (
                <div className="text-[11px] text-slate-400 italic">
                  Đang hiển thị trước 5 dòng đầu tiên...
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              disabled={previewRows.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              Xác nhận nhập {previewRows.length} bản ghi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
