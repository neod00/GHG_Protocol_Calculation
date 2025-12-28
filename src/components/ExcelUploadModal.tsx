"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { parseExcelFile, downloadExcelTemplate, ImportValidationResult } from '../utils/excelImport';
import { Facility, EmissionSource, EmissionCategory } from '../types';
import { Portal } from './Portal';

interface ExcelUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    facilities: Facility[];
    onImport: (sources: EmissionSource[]) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
    isOpen,
    onClose,
    facilities,
    onImport,
}) => {
    const { t, language } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleClose = useCallback(() => {
        setValidationResult(null);
        setSelectedFile(null);
        setIsProcessing(false);
        onClose();
    }, [onClose]);

    const handleDownloadTemplate = (e: React.MouseEvent) => {
        e.stopPropagation();
        downloadExcelTemplate(facilities, language as 'en' | 'ko');
    };

    const processFile = async (file: File) => {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            setValidationResult({
                isValid: false,
                errors: [language === 'ko' ? '엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.' : 'Only Excel files (.xlsx, .xls) are supported.'],
                warnings: [],
                data: null,
            });
            return;
        }

        setSelectedFile(file);
        setIsProcessing(true);

        const result = await parseExcelFile(file, facilities, language as 'en' | 'ko');
        setValidationResult(result);
        setIsProcessing(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleImport = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (validationResult?.data?.sources) {
            onImport(validationResult.data.sources);
            handleClose();
        }
    };

    const handleResetFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setValidationResult(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleModalClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60"
                    onClick={handleClose}
                />

                {/* Modal Container */}
                <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl pointer-events-auto"
                        onClick={handleModalClick}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                📥 {language === 'ko' ? '엑셀 데이터 가져오기' : 'Import Excel Data'}
                            </h3>
                            <button
                                onClick={handleClose}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6">
                            {/* Template Download Section */}
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">📋</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                            {language === 'ko' ? '템플릿 다운로드' : 'Download Template'}
                                        </h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                            {language === 'ko'
                                                ? '먼저 템플릿을 다운로드하고, 데이터를 입력한 후 업로드하세요.'
                                                : 'Download the template first, fill in your data, then upload it.'
                                            }
                                        </p>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            <span className="mr-2">📥</span>
                                            {language === 'ko' ? '템플릿 다운로드' : 'Download Template'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* File Upload Section */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                                ${isDragging
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500'
                                    }
                                ${isProcessing ? 'pointer-events-none opacity-50' : ''}
                            `}
                            >
                                {isProcessing ? (
                                    <div className="flex flex-col items-center">
                                        <svg className="animate-spin h-10 w-10 text-teal-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            {language === 'ko' ? '파일 처리 중...' : 'Processing file...'}
                                        </p>
                                    </div>
                                ) : selectedFile && validationResult ? (
                                    <div className="flex flex-col items-center">
                                        <div className="text-4xl mb-3">📄</div>
                                        <p className="font-medium text-slate-900 dark:text-white">{selectedFile.name}</p>
                                        <button
                                            onClick={handleResetFile}
                                            className="mt-2 text-sm text-red-500 hover:text-red-600 underline"
                                        >
                                            {language === 'ko' ? '다른 파일 선택' : 'Choose another file'}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-3">📁</div>
                                        <p className="text-slate-600 dark:text-slate-400 mb-2">
                                            {language === 'ko'
                                                ? '파일을 여기에 드래그하거나 클릭하여 업로드'
                                                : 'Drag and drop your file here, or click to upload'
                                            }
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="excel-upload"
                                        />
                                        <label
                                            htmlFor="excel-upload"
                                            className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg cursor-pointer transition-colors"
                                        >
                                            {language === 'ko' ? '파일 선택' : 'Choose File'}
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                            {language === 'ko' ? '지원 형식: .xlsx, .xls' : 'Supported formats: .xlsx, .xls'}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Validation Results */}
                            {validationResult && (
                                <div className="mt-6 space-y-4">
                                    {/* Summary */}
                                    <div className={`p-4 rounded-lg ${validationResult.isValid
                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{validationResult.isValid ? '✅' : '❌'}</span>
                                            <span className={`font-medium ${validationResult.isValid
                                                ? 'text-green-800 dark:text-green-200'
                                                : 'text-red-800 dark:text-red-200'
                                                }`}>
                                                {validationResult.isValid
                                                    ? (language === 'ko'
                                                        ? `${validationResult.data?.sources.length || 0}개의 데이터가 준비되었습니다.`
                                                        : `${validationResult.data?.sources.length || 0} entries ready for import.`
                                                    )
                                                    : (language === 'ko' ? '유효성 검사 실패' : 'Validation failed')
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    {/* Errors */}
                                    {validationResult.errors.length > 0 && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-h-40 overflow-y-auto">
                                            <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                                                ❌ {language === 'ko' ? '오류' : 'Errors'} ({validationResult.errors.length})
                                            </h5>
                                            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                                {validationResult.errors.map((error, index) => (
                                                    <li key={index}>• {error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Warnings */}
                                    {validationResult.warnings.length > 0 && (
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 max-h-40 overflow-y-auto">
                                            <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                                                ⚠️ {language === 'ko' ? '경고' : 'Warnings'} ({validationResult.warnings.length})
                                            </h5>
                                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                                {validationResult.warnings.map((warning, index) => (
                                                    <li key={index}>• {warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Data Preview */}
                                    {validationResult.isValid && validationResult.data && validationResult.data.sources.length > 0 && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <h5 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                                                📊 {language === 'ko' ? '데이터 미리보기' : 'Data Preview'}
                                            </h5>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-left text-slate-500 dark:text-slate-400">
                                                            <th className="pb-2">{language === 'ko' ? '카테고리' : 'Category'}</th>
                                                            <th className="pb-2">{language === 'ko' ? '설명' : 'Description'}</th>
                                                            <th className="pb-2 text-right">{language === 'ko' ? '연간 합계' : 'Annual Total'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-slate-700 dark:text-slate-300">
                                                        {validationResult.data.sources.slice(0, 5).map((source, index) => (
                                                            <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                                                                <td className="py-2 truncate max-w-[150px]">{source.category}</td>
                                                                <td className="py-2 truncate max-w-[150px]">{source.description}</td>
                                                                <td className="py-2 text-right">
                                                                    {source.monthlyQuantities.reduce((sum, q) => sum + q, 0).toLocaleString()} {source.unit}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {validationResult.data.sources.length > 5 && (
                                                            <tr className="border-t border-slate-200 dark:border-slate-700">
                                                                <td colSpan={3} className="py-2 text-center text-slate-500">
                                                                    ... {language === 'ko' ? '외' : 'and'} {validationResult.data.sources.length - 5} {language === 'ko' ? '개 더' : 'more'}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                {language === 'ko' ? '취소' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!validationResult?.isValid || !validationResult?.data?.sources.length}
                                className={`
                                px-4 py-2 rounded-lg font-medium transition-colors
                                ${validationResult?.isValid && validationResult?.data?.sources.length
                                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                        : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                    }
                            `}
                            >
                                ✅ {language === 'ko' ? '데이터 가져오기' : 'Import Data'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
