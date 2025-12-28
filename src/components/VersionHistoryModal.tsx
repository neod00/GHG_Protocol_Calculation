"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { getProjectVersions, restoreProjectVersion, getProjectVersionData } from '../app/actions/project';
import { EmissionSource, Facility } from '../types';
import { Portal } from './Portal';

interface ProjectVersion {
    id: string;
    versionNumber: number;
    versionName: string | null;
    createdAt: Date;
    createdBy: string | null;
}

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
    onRestore: (sources: EmissionSource[], facilities: Facility[]) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
    isOpen,
    onClose,
    projectId,
    onRestore,
}) => {
    const { t, language } = useTranslation();
    const [versions, setVersions] = useState<ProjectVersion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadVersions = useCallback(async () => {
        if (!projectId) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await getProjectVersions(projectId);
            if (result.success && result.data) {
                setVersions(result.data as ProjectVersion[]);
            } else {
                setError(result.error || 'Failed to load versions');
            }
        } catch (err) {
            setError('Failed to load versions');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (isOpen && projectId) {
            loadVersions();
        }
    }, [isOpen, projectId, loadVersions]);

    const handleRestore = async (versionId: string, versionNumber: number) => {
        const confirmMessage = language === 'ko'
            ? `버전 ${versionNumber}을(를) 복원하시겠습니까? 저장되지 않은 현재 변경 사항은 손실됩니다.`
            : `Are you sure you want to restore version ${versionNumber}? Current unsaved changes will be lost.`;

        if (!confirm(confirmMessage)) return;
        if (!projectId) return;

        setIsRestoring(versionId);

        try {
            // Get the version data
            const versionResult = await getProjectVersionData(versionId);
            if (!versionResult.success || !versionResult.data) {
                alert(language === 'ko' ? '버전 데이터를 불러올 수 없습니다.' : 'Failed to load version data.');
                return;
            }

            const snapshot = versionResult.data.dataSnapshot as unknown as { sources: EmissionSource[]; facilities: Facility[] };

            // Restore to database
            const restoreResult = await restoreProjectVersion(projectId, versionId);
            if (restoreResult.success) {
                // Update local state
                onRestore(snapshot.sources, snapshot.facilities);
                alert(language === 'ko' ? '버전이 복원되었습니다.' : 'Version restored successfully.');
                onClose();
            } else {
                alert(language === 'ko' ? '복원에 실패했습니다.' : 'Failed to restore version.');
            }
        } catch (err) {
            alert(language === 'ko' ? '복원 중 오류가 발생했습니다.' : 'An error occurred during restoration.');
        } finally {
            setIsRestoring(null);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
                    onClick={onClose}
                />

                {/* Modal Container */}
                <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-lg max-h-[80vh] overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl pointer-events-auto flex flex-col"
                        onClick={handleModalClick}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>🕐</span> {t('versionHistory')}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-teal-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        {language === 'ko' ? '버전 목록 로딩 중...' : 'Loading versions...'}
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <span className="text-4xl mb-4">❌</span>
                                    <p className="text-red-500">{error}</p>
                                    <button
                                        onClick={loadVersions}
                                        className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm"
                                    >
                                        {language === 'ko' ? '다시 시도' : 'Retry'}
                                    </button>
                                </div>
                            ) : versions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <span className="text-4xl mb-4">📭</span>
                                    <p className="text-slate-500 dark:text-slate-400">{t('noVersions')}</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 text-center">
                                        {language === 'ko'
                                            ? '"내 프로젝트 저장" 버튼을 클릭하면 버전이 생성됩니다.'
                                            : 'Click "Save My Project" to create a version.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {versions.map((version) => (
                                        <div
                                            key={version.id}
                                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                                                        {version.versionName || `${t('version')} ${version.versionNumber}`}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded-full">
                                                        v{version.versionNumber}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    {formatDate(version.createdAt)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRestore(version.id, version.versionNumber)}
                                                disabled={isRestoring !== null}
                                                className={`
                                                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                                ${isRestoring === version.id
                                                        ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-wait'
                                                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                                                    }
                                            `}
                                            >
                                                {isRestoring === version.id ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                        </svg>
                                                        {language === 'ko' ? '복원 중...' : 'Restoring...'}
                                                    </span>
                                                ) : (
                                                    <>🔄 {t('restoreVersion')}</>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {language === 'ko'
                                    ? '최근 10개 버전만 보관됩니다'
                                    : 'Only the last 10 versions are kept'
                                }
                            </p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                {language === 'ko' ? '닫기' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
