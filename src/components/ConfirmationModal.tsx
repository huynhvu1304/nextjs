 // src/components/ConfirmationModal.tsx
    import React from 'react';

    interface ConfirmationModalProps {
      isOpen: boolean;
      message: string;
      onConfirm: () => void;
      onCancel: () => void;
    }

    const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
      if (!isOpen) {
        return null; // Không hiển thị modal nếu isOpen là false
      }

      return (
        // Overlay nền mờ
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          {/* Container của Modal */}
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-sm mx-auto animate-fade-in-up transform scale-95 sm:scale-100 transition-all duration-300">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">Xác nhận hành động</h3>
            <p className="text-gray-700 mb-6 text-center text-sm sm:text-base">{message}</p>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all duration-200 shadow-sm text-sm sm:text-base"
              >
                Hủy
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-all duration-200 shadow-md text-sm sm:text-base"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      );
    };

    export default ConfirmationModal;