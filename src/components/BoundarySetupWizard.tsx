import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BoundaryApproach, Facility, EmissionCategory } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { IconX, IconInfo, IconPencil, IconCheck } from './IconComponents';
import { FACILITY_TYPES_BY_SCOPE, ALL_SCOPE3_CATEGORIES } from '../constants/index';

interface Scope3Settings {
  isEnabled: boolean;
  enabledCategories: EmissionCategory[];
}

interface FacilityRowProps {
  facility: Facility;
  isEditing: boolean;
  boundaryApproach: BoundaryApproach;
  isRemoveDisabled: boolean;
  editingName: string;
  editingEquity: number | '';
  editingGroup: string;
  onStartEditing: (facility: Facility) => void;
  onRemove: (id: string) => void;
  onNameChange: (name: string) => void;
  onEquityChange: (equity: number | '') => void;
  onGroupChange: (group: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const FacilityRow: React.FC<FacilityRowProps> = React.memo(({
  facility,
  isEditing,
  boundaryApproach,
  isRemoveDisabled,
  editingName,
  editingEquity,
  editingGroup,
  onStartEditing,
  onRemove,
  onNameChange,
  onEquityChange,
  onGroupChange,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const displayName = facility.isCorporate ? t('corporateLevelFacility') : facility.name;

  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors">
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editingName}
              onChange={e => onNameChange(e.target.value)}
              className="flex-grow rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100 text-sm p-2"
            />
            {boundaryApproach === 'equity' && (
              <input
                type="number"
                value={editingEquity}
                onChange={e => onEquityChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-20 rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100 text-sm p-2"
                placeholder="%"
                min="0"
                max="100"
              />
            )}
          </div>
          <input
            type="text"
            placeholder={t('businessSitePlaceholder')}
            value={editingGroup}
            onChange={e => onGroupChange(e.target.value)}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100 text-sm p-2"
          />
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" aria-label="Cancel"><IconX className="w-5 h-5" /></button>
            <button onClick={onSave} className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors" aria-label="Save"><IconCheck className="w-5 h-5" /></button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{displayName} {boundaryApproach === 'equity' && !facility.isCorporate ? `(${t('equityShare')}: ${facility.equityShare}%)` : ''}</span>
            {facility.group && <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{facility.group}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onStartEditing(facility)} className="text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Edit" disabled={facility.isCorporate}>
              <IconPencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemove(facility.id)}
              className="text-slate-400 hover:text-rose-500 disabled:text-slate-300 disabled:cursor-not-allowed dark:disabled:text-slate-600 transition-colors"
              disabled={isRemoveDisabled || facility.isCorporate}
              aria-label={t('removeSourceAria')}
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});


interface BoundarySetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: {
    companyName: string;
    reportingYear: string;
    facilities: Facility[];
    boundaryApproach: BoundaryApproach;
    scope3Settings: Scope3Settings;
  }) => void;
  initialData: {
    companyName: string;
    reportingYear: string;
    facilities: Facility[];
    boundaryApproach: BoundaryApproach;
    scope3Settings: Scope3Settings;
  };
  isCancellable?: boolean;
  initialStep?: number;
}

type AnswerKey = 'q1' | 'q2' | 'q3';

export const BoundarySetupWizard: React.FC<BoundarySetupWizardProps> = ({ isOpen, onClose, onSave, initialData, isCancellable = true, initialStep = 0 }) => {
  const { t, language } = useTranslation();
  const [step, setStep] = useState(initialStep);

  // Form data state
  const [companyName, setCompanyName] = useState(initialData.companyName);
  const [reportingYear, setReportingYear] = useState(initialData.reportingYear);
  const [facilities, setFacilities] = useState<Facility[]>(initialData.facilities);
  const [boundaryApproach, setBoundaryApproach] = useState<BoundaryApproach>(initialData.boundaryApproach);
  const [scope3Settings, setScope3Settings] = useState<Scope3Settings>(initialData.scope3Settings);

  // Questionnaire state
  const [answers, setAnswers] = useState<Partial<Record<AnswerKey, string>>>({});
  const [recommendedApproach, setRecommendedApproach] = useState<BoundaryApproach | null>(null);

  // Facility input state
  const [newFacilityGroup, setNewFacilityGroup] = useState('');
  const [newFacilityType, setNewFacilityType] = useState(FACILITY_TYPES_BY_SCOPE['Scope 1'][0].name);
  const [newFacilityIdentifier, setNewFacilityIdentifier] = useState('');
  const [newFacilityEquity, setNewFacilityEquity] = useState<number | ''>('');

  // Facility editing state
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [editingFacilityName, setEditingFacilityName] = useState('');
  const [editingFacilityEquity, setEditingFacilityEquity] = useState<number | ''>('');
  const [editingFacilityGroup, setEditingFacilityGroup] = useState('');


  useEffect(() => {
    // Determine recommended approach based on Q1 answer
    const q1Answer = answers.q1;
    let recommendation: BoundaryApproach = 'operational'; // Default
    if (q1Answer === 'A') recommendation = 'operational';
    if (q1Answer === 'B') recommendation = 'financial';
    if (q1Answer === 'C') recommendation = 'equity';
    setRecommendedApproach(recommendation);
    if (step === 3) { // Only auto-select if user is on the consolidation step and makes a change
      setBoundaryApproach(recommendation);
    }
  }, [answers.q1, step]);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep)
      // Sync internal state with props when opening
      setCompanyName(initialData.companyName);
      setReportingYear(initialData.reportingYear);
      setFacilities(initialData.facilities);
      setBoundaryApproach(initialData.boundaryApproach);
      setScope3Settings(initialData.scope3Settings);
    }
  }, [isOpen, initialStep, initialData])

  const handleStartEditing = useCallback((facility: Facility) => {
    setEditingFacilityId(facility.id);
    setEditingFacilityName(facility.name);
    setEditingFacilityEquity(facility.equityShare);
    setEditingFacilityGroup(facility.group || '');
  }, []);

  const handleCancelEditing = useCallback(() => {
    setEditingFacilityId(null);
  }, []);

  const handleSaveEditing = useCallback(() => {
    if (!editingFacilityId || !editingFacilityName.trim()) return;

    setFacilities(facilities => facilities.map(f => {
      if (f.id === editingFacilityId) {
        return {
          ...f,
          name: editingFacilityName.trim(),
          group: editingFacilityGroup.trim() || undefined,
          equityShare: typeof editingFacilityEquity === 'number' ? Math.max(0, Math.min(100, editingFacilityEquity)) : f.equityShare,
        };
      }
      return f;
    }));
    setEditingFacilityId(null);
  }, [editingFacilityId, editingFacilityName, editingFacilityEquity, editingFacilityGroup]);


  const handleSetAnswer = useCallback((question: AnswerKey, answer: string) => {
    setAnswers(prev => ({ ...prev, [question]: answer }));
  }, []);


  const handleAddFacility = useCallback(() => {
    if (newFacilityIdentifier.trim()) {
      const newFacility: Facility = {
        id: `facility-${Date.now()}`,
        name: newFacilityIdentifier.trim(),
        group: newFacilityGroup.trim() || undefined,
        equityShare: typeof newFacilityEquity === 'number' && newFacilityEquity >= 0 && newFacilityEquity <= 100 ? newFacilityEquity : 100,
      };
      setFacilities(facilities => [...facilities, newFacility]);
      setNewFacilityIdentifier('');
      setNewFacilityEquity('');
      setNewFacilityGroup('');
    }
  }, [newFacilityIdentifier, newFacilityGroup, newFacilityEquity]);


  const handleRemoveFacility = useCallback((id: string) => {
    setFacilities(facilities => facilities.filter(f => f.id !== id));
  }, []);

  const handleScope3CategoryToggle = useCallback((category: EmissionCategory) => {
    setScope3Settings(prev => {
      const enabledCategories = prev.enabledCategories.includes(category)
        ? prev.enabledCategories.filter(c => c !== category)
        : [...prev.enabledCategories, category];
      return { ...prev, enabledCategories };
    })
  }, []);

  const handleSave = useCallback(() => {
    onSave({ companyName, reportingYear, facilities, boundaryApproach, scope3Settings });
    onClose();
  }, [onSave, companyName, reportingYear, facilities, boundaryApproach, scope3Settings, onClose]);

  const groupedFacilities = useMemo(() => {
    const groups: { [key: string]: Facility[] } = {};
    const ungrouped: Facility[] = [];

    facilities.forEach(f => {
      if (f.isCorporate) return; // Don't show corporate facility in the user-editable list
      const groupKey = f.group || '';
      if (groupKey) {
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(f);
      } else {
        ungrouped.push(f);
      }
    });

    return { groups, ungrouped };
  }, [facilities]);


  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <IconInfo className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{t('wizardWelcomeTitle')}</h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">{t('wizardWelcomeText')}</p>
          </div>
        );
      case 1: // Company Info
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('companyInfo')}</h3>
            <div className="space-y-5">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('companyName')}</label>
                <input type="text" id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:text-white p-2.5" />
              </div>
              <div>
                <label htmlFor="reportingYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('reportingYear')}</label>
                <input type="text" id="reportingYear" value={reportingYear} onChange={e => setReportingYear(e.target.value)} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:text-white p-2.5" />
              </div>
            </div>
          </div>
        );
      case 2: // Questionnaire
        const qCardClasses = (answer: string, question: AnswerKey) =>
          `p-4 border rounded-xl cursor-pointer transition-all duration-200 ${answers[question] === answer
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500'
            : 'border-slate-200 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-slate-600 bg-white dark:bg-slate-800'}`;

        return (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('wizardQuestionnaireTitle')}</h3>
            <div className="space-y-8">
              {/* Question 1 */}
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 mb-3">{t('q1Title')}</p>
                <div className="space-y-3">
                  <div className={qCardClasses('A', 'q1')} onClick={() => handleSetAnswer('q1', 'A')}>
                    <p className="font-semibold text-slate-900 dark:text-white">{t('q1OptionA')}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t('q1OptionADesc')}</p>
                  </div>
                  <div className={qCardClasses('B', 'q1')} onClick={() => handleSetAnswer('q1', 'B')}>
                    <p className="font-semibold text-slate-900 dark:text-white">{t('q1OptionB')}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t('q1OptionBDesc')}</p>
                  </div>
                  <div className={qCardClasses('C', 'q1')} onClick={() => handleSetAnswer('q1', 'C')}>
                    <p className="font-semibold text-slate-900 dark:text-white">{t('q1OptionC')}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t('q1OptionCDesc')}</p>
                  </div>
                </div>
              </div>
              {/* Question 2 */}
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 mb-3">{t('q2Title')}</p>
                <div className="flex gap-3">
                  <button onClick={() => handleSetAnswer('q2', 'yes')} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${answers.q2 === 'yes' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>{t('q2OptionYes')}</button>
                  <button onClick={() => handleSetAnswer('q2', 'no')} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${answers.q2 === 'no' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>{t('q2OptionNo')}</button>
                </div>
                {answers.q2 === 'yes' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 dark:bg-amber-900/20 dark:border-amber-700/50 dark:text-amber-200 flex items-start gap-3">
                    <IconInfo className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">{t('q2GuidanceTitle')}</p>
                      <p className="text-sm mt-1">{t('q2GuidanceText')}</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Question 3 */}
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 mb-3">{t('q3Title')}</p>
                <div className="flex gap-3">
                  <button onClick={() => handleSetAnswer('q3', 'yes')} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${answers.q3 === 'yes' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>{t('q3OptionYes')}</button>
                  <button onClick={() => handleSetAnswer('q3', 'no')} className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${answers.q3 === 'no' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>{t('q3OptionNo')}</button>
                </div>
                {answers.q3 === 'yes' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-900/20 dark:border-blue-700/50 dark:text-blue-200 flex items-start gap-3">
                    <IconInfo className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">{t('q3GuidanceTitle')}</p>
                      <p className="text-sm mt-1">{t('q3GuidanceText')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 3: // Consolidation & Facilities
        const approachCardClasses = (approach: BoundaryApproach) =>
          `p-4 border rounded-xl cursor-pointer transition-all duration-200 relative ${boundaryApproach === approach
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500'
            : 'border-slate-200 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-slate-600 bg-white dark:bg-slate-800'}`;

        return (
          <div className="space-y-8">
            {/* Consolidation Approach */}
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('consolidationApproach')}</h3>
              <p
                className="mt-3 text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800"
                dangerouslySetInnerHTML={{ __html: t('step3Intro') }}
              />
              {recommendedApproach && <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{t('recommendationText')} <span className="font-bold text-emerald-600 dark:text-emerald-400">{t(recommendedApproach === 'equity' ? 'equityControlDescription' : `${recommendedApproach}Control`)}</span>.</p>}
              <div className="mt-4 space-y-3">
                {(['operational', 'financial', 'equity'] as BoundaryApproach[]).map(approach => {
                  const titleKey = approach === 'equity' ? 'equityShare' : `${approach}Control`;
                  const descriptionKey = approach === 'equity' ? 'equityControlDescription' : `${approach}ControlDescription`;
                  return (
                    <div key={approach} className={approachCardClasses(approach)} onClick={() => setBoundaryApproach(approach)}>
                      {recommendedApproach === approach && <span className="absolute top-3 right-3 text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded-full shadow-sm">{t('recommendedBadge')}</span>}
                      <p className="font-semibold text-slate-900 dark:text-white">{t(titleKey)}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t(descriptionKey)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Facilities */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('facilities')}</h3>
              <div className="mt-4 space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(groupedFacilities.groups).length === 0 && groupedFacilities.ungrouped.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('noSources')}</p>
                  </div>
                )}

                {Object.entries(groupedFacilities.groups).map(([group, facilitiesInGroup]) => (
                  <div key={group}>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">{group}</h4>
                    <div className="space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                      {(facilitiesInGroup as Facility[]).map(f => (
                        <FacilityRow
                          key={f.id}
                          facility={f}
                          isEditing={editingFacilityId === f.id}
                          boundaryApproach={boundaryApproach}
                          isRemoveDisabled={facilities.filter(fac => !fac.isCorporate).length <= 1}
                          editingName={editingFacilityName}
                          editingEquity={editingFacilityEquity}
                          editingGroup={editingFacilityGroup}
                          onStartEditing={handleStartEditing}
                          onRemove={handleRemoveFacility}
                          onNameChange={setEditingFacilityName}
                          onEquityChange={setEditingFacilityEquity}
                          onGroupChange={setEditingFacilityGroup}
                          onSave={handleSaveEditing}
                          onCancel={handleCancelEditing}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {groupedFacilities.ungrouped.length > 0 && (
                  <div>
                    {Object.keys(groupedFacilities.groups).length > 0 && <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('ungroupedFacilities')}</h4>}
                    <div className="space-y-2">
                      {groupedFacilities.ungrouped.map(f => (
                        <FacilityRow
                          key={f.id}
                          facility={f}
                          isEditing={editingFacilityId === f.id}
                          boundaryApproach={boundaryApproach}
                          isRemoveDisabled={facilities.filter(fac => !fac.isCorporate).length <= 1}
                          editingName={editingFacilityName}
                          editingEquity={editingFacilityEquity}
                          editingGroup={editingFacilityGroup}
                          onStartEditing={handleStartEditing}
                          onRemove={handleRemoveFacility}
                          onNameChange={setEditingFacilityName}
                          onEquityChange={setEditingFacilityEquity}
                          onGroupChange={setEditingFacilityGroup}
                          onSave={handleSaveEditing}
                          onCancel={handleCancelEditing}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">{t('addFacility')}</h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="facility-group" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('businessSiteOptional')}</label>
                    <input type="text" id="facility-group" placeholder={t('businessSitePlaceholder')} value={newFacilityGroup} onChange={e => setNewFacilityGroup(e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm p-2" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="facility-identifier" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('facilityIdentifier')}</label>
                      <input type="text" id="facility-identifier" placeholder={t('facilityIdentifierPlaceholder')} value={newFacilityIdentifier} onChange={e => setNewFacilityIdentifier(e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm p-2" />
                    </div>
                    <div>
                      <label htmlFor="equity-share" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('equityShareOptional')}</label>
                      <input id="equity-share" type="number" placeholder="e.g., 80" value={newFacilityEquity} onChange={e => setNewFacilityEquity(e.target.value === '' ? '' : parseFloat(e.target.value))} className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm p-2 ${boundaryApproach !== 'equity' && 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60'}`} disabled={boundaryApproach !== 'equity'} min="0" max="100" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={handleAddFacility} className="bg-emerald-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">{t('addFacility')}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 4: // Scope 3 Setup
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('scope3SetupTitle')}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('scope3SetupDescription')}</p>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scope3Settings.isEnabled}
                  onChange={e => setScope3Settings(prev => ({ ...prev, isEnabled: e.target.checked }))}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                />
                <span className="font-medium text-slate-900 dark:text-white">{t('enableScope3Reporting')}</span>
              </label>
            </div>
            {scope3Settings.isEnabled && (
              <div className="animate-fade-in">
                <p className="font-medium text-slate-800 dark:text-slate-200 mb-3">{t('selectApplicableCategories')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {ALL_SCOPE3_CATEGORIES.map(category => (
                    <label key={category} className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${scope3Settings.enabledCategories.includes(category) ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-emerald-300'}`}>
                      <input
                        type="checkbox"
                        checked={scope3Settings.enabledCategories.includes(category)}
                        onChange={() => handleScope3CategoryToggle(category)}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{t(category)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      default: return null;
    }
  };

  const maxSteps = 4;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={isCancellable ? onClose : undefined}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col transition-all duration-300 border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('boundarySetupTitle')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t(`step${step}`)}</p>
          </div>
          {isCancellable && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"><IconX className="w-5 h-5" /></button>
          )}
        </div>
        <div className="p-6 md:p-8 flex-grow overflow-y-auto custom-scrollbar">
          {renderStepContent()}
        </div>
        <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 rounded-b-2xl backdrop-blur-sm">
          <div>
            {step > 0 && <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 transition-colors">{t('back')}</button>}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{`Step ${step + 1} of ${maxSteps + 1}`}</span>
            {step < maxSteps && <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all">{step === 0 ? t('getStarted') : t('next')}</button>}
            {step === maxSteps && <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all">{t('finish')}</button>}
          </div>
        </div>
      </div>
    </div>
  );
};