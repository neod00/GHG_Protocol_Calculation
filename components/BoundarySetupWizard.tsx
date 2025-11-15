import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BoundaryApproach, Facility, EmissionCategory } from '../types';
import { useTranslation } from '../LanguageContext';
import { IconX, IconInfo, IconPencil, IconCheck } from './IconComponents';
import { FACILITY_TYPES_BY_SCOPE, ALL_SCOPE3_CATEGORIES } from '../constants';

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
    
    return (
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
            {isEditing ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editingName}
                            onChange={e => onNameChange(e.target.value)}
                            className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-ghg-green focus:ring-ghg-green bg-white text-gray-900 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 text-sm p-1"
                        />
                        {boundaryApproach === 'equity' && (
                            <input
                                type="number"
                                value={editingEquity}
                                onChange={e => onEquityChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-ghg-green focus:ring-ghg-green bg-white text-gray-900 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 text-sm p-1"
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
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-ghg-green focus:ring-ghg-green bg-white text-gray-900 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 text-sm p-1"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 p-1" aria-label="Cancel"><IconX className="w-5 h-5" /></button>
                        <button onClick={onSave} className="text-green-600 hover:text-green-800 p-1" aria-label="Save"><IconCheck className="w-5 h-5" /></button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-sm">{facility.name} {boundaryApproach === 'equity' ? `(${t('equityShare')}: ${facility.equityShare}%)` : ''}</span>
                        {facility.group && <span className="block text-xs text-gray-500 dark:text-gray-400">{facility.group}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onStartEditing(facility)} className="text-gray-500 hover:text-ghg-green dark:text-gray-400 dark:hover:text-ghg-light-green" aria-label="Edit"><IconPencil className="w-4 h-4" /></button>
                        <button
                            onClick={() => onRemove(facility.id)}
                            className="text-gray-400 hover:text-red-500 disabled:text-gray-300 disabled:cursor-not-allowed dark:disabled:text-gray-600"
                            disabled={isRemoveDisabled}
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
    if(step === 3) { // Only auto-select if user is on the consolidation step and makes a change
        setBoundaryApproach(recommendation);
    }
  }, [answers.q1, step]);

  useEffect(() => {
      if(isOpen) {
        setStep(initialStep)
      }
  }, [isOpen, initialStep])

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
    if (newFacilityIdentifier.trim() && newFacilityType) {
      const allFacilityTypes = Object.values(FACILITY_TYPES_BY_SCOPE).flat();
      const selectedTypeObj = allFacilityTypes.find(f => f.name === newFacilityType);
      const translatedType = selectedTypeObj ? t(selectedTypeObj.translationKey) : newFacilityType;

      const newFacility: Facility = {
        id: `facility-${Date.now()}`,
        name: `${newFacilityIdentifier.trim()}`,
        group: newFacilityGroup.trim() || undefined,
        equityShare: typeof newFacilityEquity === 'number' && newFacilityEquity >= 0 && newFacilityEquity <= 100 ? newFacilityEquity : 100,
      };
      setFacilities(facilities => [...facilities, newFacility]);
      setNewFacilityIdentifier('');
      setNewFacilityEquity('');
      setNewFacilityGroup('');
      setNewFacilityType(FACILITY_TYPES_BY_SCOPE['Scope 1'][0].name);
    }
  }, [newFacilityIdentifier, newFacilityType, newFacilityGroup, newFacilityEquity, t]);


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
            <div className="text-center">
                <h2 className="text-2xl font-bold text-ghg-dark dark:text-gray-100">{t('wizardWelcomeTitle')}</h2>
                <p className="mt-4 text-gray-600 dark:text-gray-300">{t('wizardWelcomeText')}</p>
            </div>
        );
      case 1: // Company Info
        return (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('companyInfo')}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('companyName')}</label>
                <input type="text" id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ghg-green focus:ring-ghg-green bg-white text-gray-900 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100" />
              </div>
              <div>
                <label htmlFor="reportingYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('reportingYear')}</label>
                <input type="text" id="reportingYear" value={reportingYear} onChange={e => setReportingYear(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ghg-green focus:ring-ghg-green bg-white text-gray-900 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100" />
              </div>
            </div>
          </div>
        );
      case 2: // Questionnaire
        const qCardClasses = (answer: string, question: AnswerKey) =>
          `p-4 border rounded-lg cursor-pointer transition-all ${
            answers[question] === answer
            ? 'border-ghg-green bg-green-50 dark:bg-green-900/50 ring-2 ring-ghg-green' 
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}`;
        
        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('wizardQuestionnaireTitle')}</h3>
                <div className="mt-6 space-y-8">
                    {/* Question 1 */}
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{t('q1Title')}</p>
                        <div className="mt-2 space-y-3">
                            <div className={qCardClasses('A', 'q1')} onClick={() => handleSetAnswer('q1', 'A')}>
                                <p className="font-semibold text-ghg-dark dark:text-gray-100">{t('q1OptionA')}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{t('q1OptionADesc')}</p>
                            </div>
                            <div className={qCardClasses('B', 'q1')} onClick={() => handleSetAnswer('q1', 'B')}>
                                <p className="font-semibold text-ghg-dark dark:text-gray-100">{t('q1OptionB')}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{t('q1OptionBDesc')}</p>
                            </div>
                            <div className={qCardClasses('C', 'q1')} onClick={() => handleSetAnswer('q1', 'C')}>
                                <p className="font-semibold text-ghg-dark dark:text-gray-100">{t('q1OptionC')}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{t('q1OptionCDesc')}</p>
                            </div>
                        </div>
                    </div>
                    {/* Question 2 */}
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{t('q2Title')}</p>
                        <div className="mt-2 flex space-x-4">
                            <button onClick={() => handleSetAnswer('q2', 'yes')} className={`px-4 py-2 rounded-md ${answers.q2 === 'yes' ? 'bg-ghg-green text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t('q2OptionYes')}</button>
                            <button onClick={() => handleSetAnswer('q2', 'no')} className={`px-4 py-2 rounded-md ${answers.q2 === 'no' ? 'bg-ghg-green text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t('q2OptionNo')}</button>
                        </div>
                        {answers.q2 === 'yes' && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-200 flex items-start gap-3">
                                <IconInfo className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{t('q2GuidanceTitle')}</p>
                                    <p className="text-sm">{t('q2GuidanceText')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Question 3 */}
                     <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{t('q3Title')}</p>
                        <div className="mt-2 flex space-x-4">
                            <button onClick={() => handleSetAnswer('q3', 'yes')} className={`px-4 py-2 rounded-md ${answers.q3 === 'yes' ? 'bg-ghg-green text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t('q3OptionYes')}</button>
                            <button onClick={() => handleSetAnswer('q3', 'no')} className={`px-4 py-2 rounded-md ${answers.q3 === 'no' ? 'bg-ghg-green text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t('q3OptionNo')}</button>
                        </div>
                        {answers.q3 === 'yes' && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200 flex items-start gap-3">
                                <IconInfo className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{t('q3GuidanceTitle')}</p>
                                    <p className="text-sm">{t('q3GuidanceText')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
      case 3: // Consolidation & Facilities
        const approachCardClasses = (approach: BoundaryApproach) => 
          `p-4 border rounded-lg cursor-pointer transition-all relative ${
            boundaryApproach === approach 
            ? 'border-ghg-green bg-green-50 dark:bg-green-900/50 ring-2 ring-ghg-green' 
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}`;
            
        const scopeGroupLabels: {[key: string]: string} = {
            'Scope 1': t('scope1Direct'),
            'Scope 2': t('scope2Indirect'),
            'Scope 3': t('scope3OtherIndirect'),
        };

        return (
          <div>
            {/* Consolidation Approach */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('consolidationApproach')}</h3>
               <p 
                className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md border border-blue-200 dark:border-blue-700/50"
                dangerouslySetInnerHTML={{ __html: t('step3Intro') }}
              />
              {recommendedApproach && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{t('recommendationText')} <span className="font-bold">{t(recommendedApproach === 'equity' ? 'equityControlDescription' : `${recommendedApproach}Control`)}</span>.</p>}
              <div className="mt-4 space-y-3">
                  {(['operational', 'financial', 'equity'] as BoundaryApproach[]).map(approach => {
                        const titleKey = approach === 'equity' ? 'equityShare' : `${approach}Control`;
                        const descriptionKey = approach === 'equity' ? 'equityControlDescription' : `${approach}ControlDescription`;
                       return (
                           <div key={approach} className={approachCardClasses(approach)} onClick={() => setBoundaryApproach(approach)}>
                               {recommendedApproach === approach && <span className="absolute top-2 right-2 text-xs font-semibold bg-ghg-accent text-white px-2 py-0.5 rounded-full">{t('recommendedBadge')}</span>}
                               <p className="font-semibold text-ghg-dark dark:text-gray-100">{t(titleKey)}</p>
                               <p className="text-sm text-gray-600 dark:text-gray-300">{t(descriptionKey)}</p>
                           </div>
                       );
                  })}
              </div>
            </div>

            {/* Facilities */}
            <div className="mt-8 pt-6 border-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('facilities')}</h3>
              <div className="mt-4 space-y-4 max-h-48 overflow-y-auto pr-2">
                  {Object.keys(groupedFacilities.groups).length === 0 && groupedFacilities.ungrouped.length === 0 && (
                      <p className="text-sm text-center text-gray-500 py-4">{t('noSources')}</p>
                  )}

                  {Object.entries(groupedFacilities.groups).map(([group, facilitiesInGroup]) => (
                      <div key={group}>
                          <h4 className="text-md font-semibold text-ghg-dark dark:text-gray-200 mb-2">{group}</h4>
                          <div className="space-y-2 pl-4 border-l-2 dark:border-gray-600">
                              {(facilitiesInGroup as Facility[]).map(f => (
                                  <FacilityRow
                                    key={f.id}
                                    facility={f}
                                    isEditing={editingFacilityId === f.id}
                                    boundaryApproach={boundaryApproach}
                                    isRemoveDisabled={facilities.length <= 1}
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
                          <h4 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('ungroupedFacilities')}</h4>
                           <div className="space-y-2">
                              {groupedFacilities.ungrouped.map(f => (
                                  <FacilityRow
                                    key={f.id}
                                    facility={f}
                                    isEditing={editingFacilityId === f.id}
                                    boundaryApproach={boundaryApproach}
                                    isRemoveDisabled={facilities.length <= 1}
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
              <div className="mt-4 p-3 border-t dark:border-gray-600">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">{t('addFacility')}</h4>
                   <div className="space-y-2 mt-2">
                       <div>
                            <label htmlFor="facility-group" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('businessSiteOptional')}</label>
                            <input type="text" id="facility-group" placeholder={t('businessSitePlaceholder')} value={newFacilityGroup} onChange={e => setNewFacilityGroup(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-ghg-green focus:ring-ghg-green bg-white text-gray-900 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 text-sm p-2"/>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="facility-identifier" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('facilityIdentifier')}</label>
                            <input type="text" id="facility-identifier" placeholder={t('facilityIdentifierPlaceholder')} value={newFacilityIdentifier} onChange={e => setNewFacilityIdentifier(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-ghg-green focus:ring-ghg-green bg-white text-gray-900 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 text-sm p-2"/>
                          </div>
                          <div>
                            <label htmlFor="equity-share" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('equityShareOptional')}</label>
                            <input id="equity-share" type="number" placeholder="e.g., 80" value={newFacilityEquity} onChange={e => setNewFacilityEquity(e.target.value === '' ? '' : parseFloat(e.target.value))} className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-ghg-green focus:ring-ghg-green bg-white text-gray-900 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 text-sm p-2 ${boundaryApproach !== 'equity' && 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'}`} disabled={boundaryApproach !== 'equity'} min="0" max="100"/>
                          </div>
                       </div>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                              <div>
                                <button onClick={handleAddFacility} className="bg-ghg-light-green text-white px-4 py-2 text-sm rounded-md hover:bg-ghg-green w-full h-9">{t('addFacility')}</button>
                              </div>
                        </div>
                    </div>
              </div>
            </div>
          </div>
        );
      case 4: // Scope 3 Setup
        return (
            <div>
                 <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('scope3SetupTitle')}</h3>
                 <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('scope3SetupDescription')}</p>
                 <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={scope3Settings.isEnabled}
                            onChange={e => setScope3Settings(prev => ({...prev, isEnabled: e.target.checked}))}
                            className="h-5 w-5 rounded text-ghg-green focus:ring-ghg-green"
                        />
                        <span className="font-medium text-gray-800 dark:text-gray-200">{t('enableScope3Reporting')}</span>
                    </label>
                 </div>
                 {scope3Settings.isEnabled && (
                     <div className="mt-6">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{t('selectApplicableCategories')}</p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-h-60 overflow-y-auto pr-2">
                            {ALL_SCOPE3_CATEGORIES.map(category => (
                                <label key={category} className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={scope3Settings.enabledCategories.includes(category)}
                                        onChange={() => handleScope3CategoryToggle(category)}
                                        className="h-4 w-4 rounded text-ghg-green focus:ring-ghg-green"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{t(category)}</span>
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={isCancellable ? onClose : undefined}>
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b dark:border-gray-600 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-ghg-dark dark:text-gray-100">{t('boundarySetupTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t(`step${step}`)}</p>
            </div>
            {isCancellable && (
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><IconX className="w-5 h-5" /></button>
            )}
        </div>
        <div className="p-6 md:p-8 flex-grow overflow-y-auto">
            {renderStepContent()}
        </div>
        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-600 rounded-b-lg">
            <div>
                {step > 0 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500">{t('back')}</button>}
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{`Step ${step + 1} of ${maxSteps + 1}`}</span>
                {step < maxSteps && <button onClick={() => setStep(step + 1)} className="px-4 py-2 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{step === 0 ? t('getStarted') : t('next')}</button>}
                {step === maxSteps && <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-ghg-accent rounded-md shadow-sm hover:bg-ghg-dark">{t('finish')}</button>}
            </div>
        </div>
      </div>
    </div>
  );
};