import React, { useState } from 'react';
import { DataQualityIndicator, calculateDQIScore, getDQIRating } from '../types';
import { DQI_DESCRIPTIONS, getDQIColor, getDQIBgColor, getDQIRatingLabel } from '../utils/dqiUtils';
import { IconChevronDown, IconChevronUp } from './IconComponents';

interface DQISectionProps {
    dataQualityIndicator?: DataQualityIndicator;
    language: 'ko' | 'en';
    onUpdate: (indicator: DataQualityIndicator, rating: 'high' | 'medium' | 'low' | 'estimated') => void;
}

export const DQISection: React.FC<DQISectionProps> = ({ dataQualityIndicator, language, onUpdate }) => {
    const [showDQIPanel, setShowDQIPanel] = useState(false);

    const currentDQI = dataQualityIndicator || {
        technologicalRep: 3,
        temporalRep: 3,
        geographicalRep: 3,
        completeness: 3,
        reliability: 3,
    };

    const dqiScore = calculateDQIScore(currentDQI);
    const dqiRating = getDQIRating(dqiScore);

    const handleDQIUpdate = (dimension: keyof DataQualityIndicator, value: number) => {
        const newDQI: DataQualityIndicator = {
            ...currentDQI,
            [dimension]: value as 1 | 2 | 3 | 4 | 5,
        };
        const score = calculateDQIScore(newDQI);
        const rating = getDQIRating(score);
        onUpdate(newDQI, rating);
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-2">
            <button
                type="button"
                onClick={() => setShowDQIPanel(!showDQIPanel)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {language === 'ko' ? '📋 데이터 품질 지표 (DQI)' : '📋 Data Quality Indicator (DQI)'}
                    </span>
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${getDQIBgColor(dqiScore)}`}>
                        <span className={`text-sm font-bold ${getDQIColor(dqiScore)}`}>
                            {dqiScore.toFixed(2)}
                        </span>
                        <span className={`text-xs ${getDQIColor(dqiScore)}`}>
                            ({getDQIRatingLabel(dqiRating, language)})
                        </span>
                    </div>
                </div>
                {showDQIPanel ? <IconChevronUp className="w-4 h-4 text-gray-500" /> : <IconChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {showDQIPanel && (
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    {/* DQI Score Visualization */}
                    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${dqiScore <= 1.5 ? 'bg-emerald-500' :
                                        dqiScore <= 2.5 ? 'bg-blue-500' :
                                            dqiScore <= 3.5 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${(5 - dqiScore) / 4 * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                                <span>{language === 'ko' ? '매우 좋음' : 'Very Good'}</span>
                                <span>{language === 'ko' ? '매우 나쁨' : 'Very Poor'}</span>
                            </div>
                        </div>
                        <div className={`text-2xl font-bold ${getDQIColor(dqiScore)}`}>
                            {dqiScore.toFixed(2)}
                        </div>
                    </div>

                    {/* DQI Dimension Inputs */}
                    {([
                        { key: 'technologicalRep', label: language === 'ko' ? '기술적 대표성' : 'Technological Rep.' },
                        { key: 'temporalRep', label: language === 'ko' ? '시간적 대표성' : 'Temporal Rep.' },
                        { key: 'geographicalRep', label: language === 'ko' ? '지리적 대표성' : 'Geographical Rep.' },
                        { key: 'completeness', label: language === 'ko' ? '완결성' : 'Completeness' },
                        { key: 'reliability', label: language === 'ko' ? '신뢰성' : 'Reliability' },
                    ] as { key: keyof DataQualityIndicator; label: string }[]).map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
                                <span className="text-[10px] text-gray-500">
                                    {DQI_DESCRIPTIONS[key][currentDQI[key] as 1 | 2 | 3 | 4 | 5][language]}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        type="button"
                                        key={val}
                                        onClick={() => handleDQIUpdate(key, val)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${currentDQI[key] === val
                                            ? val <= 2 ? 'bg-emerald-500 text-white' :
                                                val <= 3 ? 'bg-yellow-500 text-white' :
                                                    'bg-red-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* DQI Legend */}
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-[10px] text-gray-500 dark:text-gray-400">
                        <p className="font-medium mb-1">{language === 'ko' ? '점수 기준:' : 'Score Guide:'}</p>
                        <p>1 = {language === 'ko' ? '매우 좋음' : 'Very Good'}, 5 = {language === 'ko' ? '매우 나쁨' : 'Very Poor'}</p>
                        <p className="mt-1">{language === 'ko' ? '가중 평균 점수가 낮을수록 데이터 품질이 높습니다.' : 'Lower weighted average = Higher quality data'}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
