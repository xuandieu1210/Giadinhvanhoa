import React, { useRef } from 'react';
import {
  AlertTriangle,
  Download,
  Eye,
  File,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { EvidenceFile } from '../../types';

interface EvidenceFileManagerProps {
  files: EvidenceFile[];
  onChange: (files: EvidenceFile[]) => void;
  readOnly?: boolean;
  category?: 'vi_pham' | 'bao_cao_to' | 'quyet_dinh' | 'khac';
  title?: string;
  description?: string;
  allowTemplates?: boolean;
  templateType?: 'vi_pham' | 'bao_cao_to' | 'quyet_dinh';
}

export const EvidenceFileManager: React.FC<EvidenceFileManagerProps> = ({
  files = [],
  onChange,
  readOnly = false,
  category = 'vi_pham',
  title = 'Tài liệu minh chứng đính kèm',
  description = 'Đính kèm biên bản, tài liệu, báo cáo hoặc ảnh chụp thực tế',
  allowTemplates = true,
  templateType = 'vi_pham',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileType?: string, name?: string) => {
    const ext = name ? name.split('.').pop()?.toLowerCase() : '';
    if (fileType === 'pdf' || ext === 'pdf') {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    if (fileType === 'word' || ext === 'doc' || ext === 'docx') {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (fileType === 'excel' || ext === 'xls' || ext === 'xlsx') {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (fileType === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
      return <FileImage className="w-5 h-5 text-purple-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFilesList: EvidenceFile[] = [...files];

    Array.from(uploadedFiles).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: EvidenceFile['fileType'] = 'other';
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || file.type.includes('image')) type = 'image';
      else if (ext === 'pdf' || file.type.includes('pdf')) type = 'pdf';
      else if (['doc', 'docx'].includes(ext) || file.type.includes('word')) type = 'word';
      else if (['xls', 'xlsx'].includes(ext) || file.type.includes('sheet')) type = 'excel';

      const reader = new FileReader();
      reader.onload = () => {
        const item: EvidenceFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.round(file.size / 1024)} KB`,
          uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          uploadedBy: 'Người phụ trách',
          fileType: type,
          dataUrl: reader.result as string,
          category,
          description: description || 'Tài liệu tải lên',
        };
        newFilesList.push(item);
        onChange([...newFilesList]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTemplate = (sampleKey: string) => {
    let sampleFile: EvidenceFile;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (templateType === 'quyet_dinh') {
      sampleFile = {
        id: `file-sample-qd-${Date.now()}`,
        name: 'Quyet_dinh_UBND_Cong_nhan_GDVH_TDP_VH.pdf',
        size: '1.85 MB',
        uploadedAt: now,
        uploadedBy: 'Văn phòng UBND',
        fileType: 'pdf',
        category: 'quyet_dinh',
        description: 'Quyết định chính thức của UBND Xã/Phường ban hành sau khi chốt dữ liệu',
      };
    } else if (templateType === 'bao_cao_to') {
      if (sampleKey === 'bien_ban_to') {
        sampleFile = {
          id: `file-sample-bb-${Date.now()}`,
          name: 'Bien_ban_hop_nhan_dan_binh_xet_TDP.pdf',
          size: '1.24 MB',
          uploadedAt: now,
          uploadedBy: 'Trưởng Thôn/Tổ',
          fileType: 'pdf',
          category: 'bao_cao_to',
          description: 'Biên bản cuộc họp bình xét công khai tại địa bàn dân cư',
        };
      } else {
        sampleFile = {
          id: `file-sample-bc-${Date.now()}`,
          name: 'Bao_cao_thanh_tich_xay_dung_TDP_Van_Hoa.docx',
          size: '680 KB',
          uploadedAt: now,
          uploadedBy: 'Trưởng Thôn/Tổ',
          fileType: 'word',
          category: 'bao_cao_to',
          description: 'Báo cáo thành tích nếp sống văn minh và các chỉ tiêu văn hóa cơ sở',
        };
      }
    } else {
      if (sampleKey === 'hinh_anh') {
        sampleFile = {
          id: `file-sample-img-${Date.now()}`,
          name: 'Hinh_anh_hien_truong_vi_pham_moi_truong.jpg',
          size: '2.40 MB',
          uploadedAt: now,
          uploadedBy: 'Tổ công tác kiểm tra',
          fileType: 'image',
          category: 'vi_pham',
          description: 'Ảnh chụp hiện trường vi phạm vệ sinh môi trường, lấn chiếm',
        };
      } else {
        sampleFile = {
          id: `file-sample-vp-${Date.now()}`,
          name: 'Bien_ban_vi_pham_quy_uoc_to_dan_pho.pdf',
          size: '1.15 MB',
          uploadedAt: now,
          uploadedBy: 'Tổ trưởng dân phố',
          fileType: 'pdf',
          category: 'vi_pham',
          description: 'Biên bản ghi nhận vi phạm nếp sống văn minh và quy ước cộng đồng',
        };
      }
    }

    onChange([...files, sampleFile]);
  };

  const handleRemove = (fileId: string) => {
    if (readOnly) return;
    onChange(files.filter((f) => f.id !== fileId));
  };

  const handleDownload = (file: EvidenceFile) => {
    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create a virtual text blob for mock files
      const blob = new Blob(
        [
          `--- TÀI LIỆU MINH CHỨNG SỐ HÓA ---\n\nTên tài liệu: ${file.name}\nPhân loại: ${file.category}\nGhi chú: ${file.description || ''}\nThời gian: ${file.uploadedAt}\nNgười tải lên: ${file.uploadedBy || 'Cán bộ quản trị'}\n\n(Nội dung tài liệu đã được lưu trữ an toàn trên hệ thống Quản lý Bình xét Văn hóa)`,
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.endsWith('.pdf') ? file.name.replace('.pdf', '.txt') : `${file.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wider">
            <Paperclip className="w-3.5 h-3.5 text-red-600" />
            <span>{title}</span>
            <span className="text-xs font-semibold px-2 py-0.2 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              {files.length} tệp
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>

        {/* Action buttons */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Chọn tệp từ máy
            </button>

            {allowTemplates && (
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                {templateType === 'quyet_dinh' ? (
                  <button
                    type="button"
                    onClick={() => handleAddTemplate('quyet_dinh')}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded-md transition flex items-center gap-1"
                    title="Chèn mẫu Quyết định công nhận của UBND xã/phường"
                  >
                    <Plus className="w-3 h-3 text-red-600" />
                    Mẫu Quyết định UBND
                  </button>
                ) : templateType === 'bao_cao_to' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddTemplate('bao_cao')}
                      className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded-md transition flex items-center gap-1"
                      title="Chèn mẫu Báo cáo thành tích"
                    >
                      <Plus className="w-3 h-3 text-blue-600" />
                      Mẫu Báo cáo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTemplate('bien_ban_to')}
                      className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded-md transition flex items-center gap-1"
                      title="Chèn mẫu Biên bản họp bình xét"
                    >
                      <Plus className="w-3 h-3 text-amber-600" />
                      Mẫu Biên bản
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddTemplate('bien_ban')}
                      className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded-md transition flex items-center gap-1"
                      title="Chèn mẫu biên bản vi phạm quy ước"
                    >
                      <Plus className="w-3 h-3 text-red-600" />
                      Mẫu Biên bản VP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTemplate('hinh_anh')}
                      className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded-md transition flex items-center gap-1"
                      title="Chèn mẫu ảnh hiện trường vi phạm"
                    >
                      <Plus className="w-3 h-3 text-purple-600" />
                      Mẫu Ảnh vi phạm
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1.5">
            <Paperclip className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-600 font-medium">Chưa có tệp minh chứng nào được đính kèm</p>
          {!readOnly && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hỗ trợ tệp định dạng PDF, Word (DOC/DOCX), Excel, hình ảnh PNG/JPG...
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-xs transition gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-md shrink-0">
                  {getFileIcon(file.fileType, file.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 shrink-0 font-mono">
                      {file.size}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                    <span>Cập nhật: {file.uploadedAt}</span>
                    {file.uploadedBy && <span>• Bởi: {file.uploadedBy}</span>}
                    {file.description && (
                      <span className="text-slate-600 italic truncate">• {file.description}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition"
                  title="Tải về tệp này"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(file.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                    title="Xóa tệp minh chứng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
