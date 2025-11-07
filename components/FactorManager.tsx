import React, { useState, useEffect } from 'react';
import { EditableRefrigerant, EditableCO2eFactorFuel, EmissionCategory } from '../types';
import { useTranslation } from '../LanguageContext';
import { SCOPE2_FACTORS_BY_REGION } from '../constants';
import { IconTrash, IconInfo } from './IconComponents';
import { TranslationKey } from '../translations';

// Form for adding a new source with a single CO2e factor (Used for all non-fugitive sources now)
const AddNewCO2eSourceForm: React.FC<{
    onAdd: (fuel: EditableCO2eFactorFuel) => void,
    onCancel: () => void,
}> = ({ onAdd, onCancel }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [unitsStr, setUnitsStr] = useState('');
    const [factors, setFactors] = useState<{ [key: string]: number }>({});

    const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const str = e.target.value;
        setUnitsStr(str);
        const units = str.split(',').map(u => u.trim()).filter(Boolean);
        const newFactors: { [key: string]: number } = {};
        units.forEach(unit => {
            newFactors[unit] = factors[unit] || 0;
        });
        setFactors(newFactors);
    };

    const handleFactorChange = (unit: string, value: string) => {
        setFactors(prev => ({ ...prev, [unit]: parseFloat(value) || 0 }));
    };
    
    const handleAdd = () => {
        const units = unitsStr.split(',').map(u => u.trim()).filter(Boolean);
        if (name && units.length > 0) {
            onAdd({ name, units, factors, isCustom: true });
        }
    };

    return (
        <div className="p-4 mt-4 border-t border-dashed dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
            <h4 className="font-semibold text-ghg-dark dark:text-gray-100 mb-2">{t('addNewSource')}</h4>
            <div className="space-y-3">
                <input type="text" placeholder={t('sourceName')} value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green" />
                <input type="text" placeholder={t('unitsCommaSeparated')} value={unitsStr} onChange={handleUnitsChange} className="w-full border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green" />
                
                {Object.keys(factors).map(unit => (
                    <div key={unit} className="p-2 border rounded dark:border-gray-600">
                         <label className="text-sm font-medium mb-2">{t('factorForUnit').replace('{unit}', unit)}</label>
                        <input type="number" step="any" value={factors[unit]} onChange={e => handleFactorChange(unit, e.target.value)} className="w-full border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm" />
                    </div>
                ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><IconInfo className="w-3 h-3"/>{t('customSourceNote')}</p>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                <button onClick={handleAdd} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('add')}</button>
            </div>
        </div>
    );
};

// Form for adding a new fugitive gas with a GWP
const AddNewFugitiveSourceForm: React.FC<{
    onAdd: (gas: EditableRefrigerant) => void,
    onCancel: () => void,
}> = ({ onAdd, onCancel }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [gwp, setGwp] = useState(0);

    const handleAdd = () => {
        if (name) {
            onAdd({ name, gwp, isCustom: true });
        }
    };
    
    return (
         <div className="p-4 mt-4 border-t border-dashed dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
            <h4 className="font-semibold text-ghg-dark dark:text-gray-100 mb-2">{t('addNewSource')}</h4>
            <div className="space-y-3">
                <input type="text" placeholder={t('sourceName')} value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green" />
                <div className="flex items-center gap-2">
                    <label className="text-sm w-1/3">{t('gwp')}</label>
                    <input type="number" step="any" value={gwp} onChange={e => setGwp(parseFloat(e.target.value) || 0)} className="w-2/3 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green" />
                </div>
            </div>
             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><IconInfo className="w-3 h-3"/>{t('customSourceNote')}</p>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                <button onClick={handleAdd} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('add')}</button>
            </div>
        </div>
    )
}

interface FactorManagerProps {
  stationaryFuels: EditableCO2eFactorFuel[];
  mobileFuels: EditableCO2eFactorFuel[];
  processMaterials: EditableCO2eFactorFuel[];
  fugitiveGases: EditableRefrigerant[];
  scope2EnergySources: EditableCO2eFactorFuel[];
  wasteSources: EditableCO2eFactorFuel[];
  businessTravelFactors: EditableCO2eFactorFuel[];
  employeeCommutingFactors: EditableCO2eFactorFuel[];
  scope3WasteFactors: EditableCO2eFactorFuel[];
  onStationaryChange: (fuels: EditableCO2eFactorFuel[]) => void;
  onMobileChange: (fuels: EditableCO2eFactorFuel[]) => void;
  onProcessChange: (fuels: EditableCO2eFactorFuel[]) => void;
  onFugitiveChange: (refrigerants: EditableRefrigerant[]) => void;
  onScope2Change: (fuels: EditableCO2eFactorFuel[]) => void;
  onWasteChange: (fuels: EditableCO2eFactorFuel[]) => void;
  onBusinessTravelChange: (fuels: EditableCO2eFactorFuel[]) => void;
  onEmployeeCommutingChange: (fuels: EditableCO2eFactorFuel[]) => void;
  onScope3WasteChange: (fuels: EditableCO2eFactorFuel[]) => void;
  enabledScope3Categories: EmissionCategory[];
}

type ActiveTab = 'Scope 1 - Stationary' | 'Scope 1 - Mobile' | 'Scope 1 - Process' | 'Scope 1 - Fugitive' | 'Scope 1 - Waste' | 'Scope 2' | 'Scope 3';

const scope3FactorCategories = [
    EmissionCategory.BusinessTravel,
    EmissionCategory.EmployeeCommuting,
    EmissionCategory.WasteGeneratedInOperations,
];

export const FactorManager: React.FC<FactorManagerProps> = ({
  stationaryFuels,
  mobileFuels,
  processMaterials,
  fugitiveGases,
  scope2EnergySources,
  wasteSources,
  businessTravelFactors,
  employeeCommutingFactors,
  scope3WasteFactors,
  onStationaryChange,
  onMobileChange,
  onProcessChange,
  onFugitiveChange,
  onScope2Change,
  onWasteChange,
  onBusinessTravelChange,
  onEmployeeCommutingChange,
  onScope3WasteChange,
  enabledScope3Categories,
}) => {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Scope 1 - Stationary');
  
  // State for existing items being edited
  const [editedStationary, setEditedStationary] = useState<EditableCO2eFactorFuel[]>([]);
  const [editedMobile, setEditedMobile] = useState<EditableCO2eFactorFuel[]>([]);
  const [editedProcess, setEditedProcess] = useState<EditableCO2eFactorFuel[]>([]);
  const [editedFugitive, setEditedFugitive] = useState<EditableRefrigerant[]>([]);
  const [editedWaste, setEditedWaste] = useState<EditableCO2eFactorFuel[]>([]);
  const [editedScope2, setEditedScope2] = useState<EditableCO2eFactorFuel[]>([]);
  const [editedBusinessTravel, setEditedBusinessTravel] = useState<EditableCO2eFactorFuel[]>([]);
  const [editedEmployeeCommuting, setEditedEmployeeCommuting] = useState<EditableCO2eFactorFuel[]>([]);
  const [editedScope3Waste, setEditedScope3Waste] = useState<EditableCO2eFactorFuel[]>([]);
  
  // State for newly added, unsaved items
  const [newlyAddedStationary, setNewlyAddedStationary] = useState<EditableCO2eFactorFuel[]>([]);
  const [newlyAddedMobile, setNewlyAddedMobile] = useState<EditableCO2eFactorFuel[]>([]);
  const [newlyAddedProcess, setNewlyAddedProcess] = useState<EditableCO2eFactorFuel[]>([]);
  const [newlyAddedFugitive, setNewlyAddedFugitive] = useState<EditableRefrigerant[]>([]);
  const [newlyAddedWaste, setNewlyAddedWaste] = useState<EditableCO2eFactorFuel[]>([]);
  const [newlyAddedBusinessTravel, setNewlyAddedBusinessTravel] = useState<EditableCO2eFactorFuel[]>([]);
  const [newlyAddedEmployeeCommuting, setNewlyAddedEmployeeCommuting] = useState<EditableCO2eFactorFuel[]>([]);
  const [newlyAddedScope3Waste, setNewlyAddedScope3Waste] = useState<EditableCO2eFactorFuel[]>([]);

  const [activeScope3Category, setActiveScope3Category] = useState<EmissionCategory>(scope3FactorCategories[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>('Custom');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set editable states
      setEditedStationary(JSON.parse(JSON.stringify(stationaryFuels)));
      setEditedMobile(JSON.parse(JSON.stringify(mobileFuels)));
      setEditedProcess(JSON.parse(JSON.stringify(processMaterials)));
      setEditedFugitive(JSON.parse(JSON.stringify(fugitiveGases)));
      setEditedWaste(JSON.parse(JSON.stringify(wasteSources)));
      const scope2Copy = JSON.parse(JSON.stringify(scope2EnergySources));
      setEditedScope2(scope2Copy);
      setEditedBusinessTravel(JSON.parse(JSON.stringify(businessTravelFactors)));
      setEditedEmployeeCommuting(JSON.parse(JSON.stringify(employeeCommutingFactors)));
      setEditedScope3Waste(JSON.parse(JSON.stringify(scope3WasteFactors)));

      
      // Clear temporary newly added states
      setNewlyAddedStationary([]);
      setNewlyAddedMobile([]);
      setNewlyAddedProcess([]);
      setNewlyAddedFugitive([]);
      setNewlyAddedWaste([]);
      setNewlyAddedBusinessTravel([]);
      setNewlyAddedEmployeeCommuting([]);
      setNewlyAddedScope3Waste([]);


      // Logic for Scope 2 region matching
      const electricitySource = scope2Copy.find((s: EditableCO2eFactorFuel) => s.name === 'Grid Electricity');
      if (electricitySource) {
        const currentFactors = electricitySource.factors;
        let matchedRegion = 'Custom';
        for (const [region, data] of Object.entries(SCOPE2_FACTORS_BY_REGION)) {
          if (JSON.stringify(data.factors) === JSON.stringify(currentFactors)) {
            matchedRegion = region;
            break;
          }
        }
        setSelectedRegion(matchedRegion);
      }
    }
  }, [isOpen, stationaryFuels, mobileFuels, processMaterials, fugitiveGases, scope2EnergySources, wasteSources, businessTravelFactors, employeeCommutingFactors, scope3WasteFactors]);

  const handleCO2eFactorChange = (itemIndex: number, unit: string, value: string, category: 'stationary' | 'mobile' | 'process' | 'scope2' | 'waste' | 'businessTravel' | 'employeeCommuting' | 'scope3Waste') => {
    const newValue = parseFloat(value) || 0;
    const updater = (p: EditableCO2eFactorFuel[]) => p.map((f, i) => i === itemIndex ? {...f, factors: {...f.factors, [unit]: newValue}} : f);
    
    switch(category) {
        case 'stationary': setEditedStationary(updater); break;
        case 'mobile': setEditedMobile(updater); break;
        case 'process': setEditedProcess(updater); break;
        case 'waste': setEditedWaste(updater); break;
        case 'businessTravel': setEditedBusinessTravel(updater); break;
        case 'employeeCommuting': setEditedEmployeeCommuting(updater); break;
        case 'scope3Waste': setEditedScope3Waste(updater); break;
        case 'scope2':
             setEditedScope2(p => p.map((f, i) => {
                if (i === itemIndex) {
                    if (f.name === 'Grid Electricity') setSelectedRegion('Custom');
                    return {...f, factors: {...f.factors, [unit]: newValue}};
                }
                return f;
            }));
            break;
    }
  };

  const handleGWPChange = (refIndex: number, value: string) => {
    const newValue = parseFloat(value) || 0;
    setEditedFugitive(p => p.map((r, i) => i === refIndex ? {...r, gwp: newValue} : r));
  };
  
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    if (region !== 'Custom' && SCOPE2_FACTORS_BY_REGION[region]) {
      const newFactors = SCOPE2_FACTORS_BY_REGION[region].factors;
      const electricityIndex = editedScope2.findIndex((s: EditableCO2eFactorFuel) => s.name === 'Grid Electricity');
      if (electricityIndex !== -1) {
        setEditedScope2(prev => prev.map((s, i) => i === electricityIndex ? {...s, factors: newFactors} : s));
      }
    }
  };

  const handleDelete = (nameToDelete: string, category: ActiveTab | EmissionCategory) => {
    if (window.confirm(t('confirmRemoveSource'))) {
        switch(category) {
            case 'Scope 1 - Stationary':
                setEditedStationary(prev => prev.filter(item => item.name !== nameToDelete));
                break;
            case 'Scope 1 - Mobile':
                setEditedMobile(prev => prev.filter(item => item.name !== nameToDelete));
                break;
            case 'Scope 1 - Process':
                setEditedProcess(prev => prev.filter(item => item.name !== nameToDelete));
                break;
            case 'Scope 1 - Fugitive':
                setEditedFugitive(prev => prev.filter(item => item.name !== nameToDelete));
                break;
            case 'Scope 1 - Waste':
                setEditedWaste(prev => prev.filter(item => item.name !== nameToDelete));
                break;
            case EmissionCategory.BusinessTravel:
                setEditedBusinessTravel(prev => prev.filter(item => item.name !== nameToDelete));
                break;
            case EmissionCategory.EmployeeCommuting:
                setEditedEmployeeCommuting(prev => prev.filter(item => item.name !== nameToDelete));
                break;
            case EmissionCategory.WasteGeneratedInOperations:
                setEditedScope3Waste(prev => prev.filter(item => item.name !== nameToDelete));
                break;
        }
    }
  }
  
  const handleDeleteNew = (index: number, category: ActiveTab | EmissionCategory) => {
    switch(category) {
        case 'Scope 1 - Stationary': setNewlyAddedStationary(p => p.filter((_, i) => i !== index)); break;
        case 'Scope 1 - Mobile': setNewlyAddedMobile(p => p.filter((_, i) => i !== index)); break;
        case 'Scope 1 - Process': setNewlyAddedProcess(p => p.filter((_, i) => i !== index)); break;
        case 'Scope 1 - Fugitive': setNewlyAddedFugitive(p => p.filter((_, i) => i !== index)); break;
        case 'Scope 1 - Waste': setNewlyAddedWaste(p => p.filter((_, i) => i !== index)); break;
        case EmissionCategory.BusinessTravel: setNewlyAddedBusinessTravel(p => p.filter((_, i) => i !== index)); break;
        case EmissionCategory.EmployeeCommuting: setNewlyAddedEmployeeCommuting(p => p.filter((_, i) => i !== index)); break;
        case EmissionCategory.WasteGeneratedInOperations: setNewlyAddedScope3Waste(p => p.filter((_, i) => i !== index)); break;
    }
  }

  const handleSaveChanges = () => {
    onStationaryChange([...editedStationary, ...newlyAddedStationary]);
    onMobileChange([...editedMobile, ...newlyAddedMobile]);
    onProcessChange([...editedProcess, ...newlyAddedProcess]);
    onFugitiveChange([...editedFugitive, ...newlyAddedFugitive]);
    onWasteChange([...editedWaste, ...newlyAddedWaste]);
    onScope2Change(editedScope2);
    onBusinessTravelChange([...editedBusinessTravel, ...newlyAddedBusinessTravel]);
    onEmployeeCommutingChange([...editedEmployeeCommuting, ...newlyAddedEmployeeCommuting]);
    onScope3WasteChange([...editedScope3Waste, ...newlyAddedScope3Waste]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setShowAddForm(false);
  };
  
  const tabClasses = (tabName: ActiveTab) => `px-3 py-2 text-sm font-medium rounded-md focus:outline-none whitespace-nowrap ${activeTab === tabName ? 'bg-ghg-green text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'}`;
  const regionData = selectedRegion !== 'Custom' ? SCOPE2_FACTORS_BY_REGION[selectedRegion] : null;

  const renderActiveTabContent = () => {
    const commonInputClass = "w-full border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm";
    const commonCellClass = "px-3 py-2 whitespace-nowrap text-sm";
    
    let activeCategoryForTable: ActiveTab | EmissionCategory = activeTab;
    if (activeTab === 'Scope 3') {
        activeCategoryForTable = activeScope3Category;
    }

    switch(activeCategoryForTable) {
        case 'Scope 1 - Stationary':
        case 'Scope 1 - Mobile':
        case 'Scope 1 - Process':
        case 'Scope 1 - Waste':
        case 'Scope 2':
        case EmissionCategory.BusinessTravel:
        case EmissionCategory.EmployeeCommuting:
        case EmissionCategory.WasteGeneratedInOperations:
            let co2eData: EditableCO2eFactorFuel[];
            let newlyAddedData: EditableCO2eFactorFuel[] = [];
            let category: 'stationary' | 'mobile' | 'process' | 'waste' | 'scope2' | 'businessTravel' | 'employeeCommuting' | 'scope3Waste';

            if (activeCategoryForTable === 'Scope 1 - Stationary') { co2eData = editedStationary; newlyAddedData = newlyAddedStationary; category = 'stationary'; }
            else if (activeCategoryForTable === 'Scope 1 - Mobile') { co2eData = editedMobile; newlyAddedData = newlyAddedMobile; category = 'mobile'; }
            else if (activeCategoryForTable === 'Scope 1 - Process') { co2eData = editedProcess; newlyAddedData = newlyAddedProcess; category = 'process'; }
            else if (activeCategoryForTable === 'Scope 1 - Waste') { co2eData = editedWaste; newlyAddedData = newlyAddedWaste; category = 'waste'; }
            else if (activeCategoryForTable === EmissionCategory.BusinessTravel) { co2eData = editedBusinessTravel; newlyAddedData = newlyAddedBusinessTravel; category = 'businessTravel'; }
            else if (activeCategoryForTable === EmissionCategory.EmployeeCommuting) { co2eData = editedEmployeeCommuting; newlyAddedData = newlyAddedEmployeeCommuting; category = 'employeeCommuting'; }
            else if (activeCategoryForTable === EmissionCategory.WasteGeneratedInOperations) { co2eData = editedScope3Waste; newlyAddedData = newlyAddedScope3Waste; category = 'scope3Waste'; }
            else { co2eData = editedScope2; category = 'scope2'; }

            const co2eHandler = (idx: number, unit: string, val: string) => handleCO2eFactorChange(idx, unit, val, category);
             return (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className={`${commonCellClass} text-left font-medium text-gray-500 dark:text-gray-300`}>{t('sourceName')}</th>
                            <th className={`${commonCellClass} text-left font-medium text-gray-500 dark:text-gray-300`}>{t('factorColumnHeader')}</th>
                            <th className={`${commonCellClass} text-left font-medium text-gray-500 dark:text-gray-300`}></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                        {co2eData.map((item, index) => Object.entries(item.factors).map(([unit, factor], unitIndex) => (
                             <tr key={`${item.name}-${unit}`}>
                                {unitIndex === 0 && <td rowSpan={Object.keys(item.factors).length} className={`${commonCellClass} font-medium align-top`}>{language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name}</td>}
                                <td className={commonCellClass}><div className="flex items-center gap-1">{t(unit as TranslationKey) || unit}:<input type="number" step="any" value={factor} onChange={e => co2eHandler(index, unit, e.target.value)} className={commonInputClass} /></div></td>
                                {unitIndex === 0 && <td rowSpan={Object.keys(item.factors).length} className={`${commonCellClass} text-center align-top`}>{item.isCustom && <button onClick={() => handleDelete(item.name, activeCategoryForTable)} className="text-red-500 hover:text-red-700"><IconTrash className="w-4 h-4" /></button>}</td>}
                            </tr>
                        )))}
                        {/* Render newly added, unsaved items */}
                        {newlyAddedData.map((item, index) => Object.entries(item.factors).map(([unit, factor], unitIndex) => (
                             <tr key={`new-${item.name}-${unit}`} className="bg-green-50 dark:bg-green-900/20">
                                {unitIndex === 0 && <td rowSpan={Object.keys(item.factors).length} className={`${commonCellClass} font-medium align-top`}>
                                    <div className="flex items-center gap-2">
                                        <span>{item.name}</span>
                                        <span className="text-xs font-semibold bg-ghg-accent text-white px-2 py-0.5 rounded-full">{t('newBadge')}</span>
                                    </div>
                                </td>}
                                <td className={commonCellClass}><div className="flex items-center gap-1">{unit}: {factor.toLocaleString()}</div></td>
                                {unitIndex === 0 && <td rowSpan={Object.keys(item.factors).length} className={`${commonCellClass} text-center align-top`}><button onClick={() => handleDeleteNew(index, activeCategoryForTable)} className="text-red-500 hover:text-red-700"><IconTrash className="w-4 h-4" /></button></td>}
                            </tr>
                        )))}
                    </tbody>
                </table>
            );

        case 'Scope 1 - Fugitive':
            return (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className={`${commonCellClass} text-left font-medium text-gray-500 dark:text-gray-300`}>{t('sourceName')}</th>
                            <th className={`${commonCellClass} text-left font-medium text-gray-500 dark:text-gray-300`}>{t('gwpColumnHeader')}</th>
                            <th className={`${commonCellClass} text-left font-medium text-gray-500 dark:text-gray-300`}></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                        {editedFugitive.map((item, index) => (
                             <tr key={item.name}>
                                <td className={`${commonCellClass} font-medium`}>{language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name}</td>
                                <td className={commonCellClass}><input type="number" step="any" value={item.gwp} onChange={e => handleGWPChange(index, e.target.value)} className={commonInputClass} /></td>
                                <td className={`${commonCellClass} text-center`}>{item.isCustom && <button onClick={() => handleDelete(item.name, activeCategoryForTable)} className="text-red-500 hover:text-red-700"><IconTrash className="w-4 h-4" /></button>}</td>
                            </tr>
                        ))}
                         {/* Render newly added, unsaved items */}
                        {newlyAddedFugitive.map((item, index) => (
                             <tr key={`new-${item.name}`} className="bg-green-50 dark:bg-green-900/20">
                                <td className={`${commonCellClass} font-medium`}>
                                    <div className="flex items-center gap-2">
                                        <span>{item.name}</span>
                                        <span className="text-xs font-semibold bg-ghg-accent text-white px-2 py-0.5 rounded-full">{t('newBadge')}</span>
                                    </div>
                                </td>
                                <td className={commonCellClass}>{item.gwp.toLocaleString()}</td>
                                <td className={`${commonCellClass} text-center`}><button onClick={() => handleDeleteNew(index, activeCategoryForTable)} className="text-red-500 hover:text-red-700"><IconTrash className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        default: return null;
    }
  }

  const renderAddForm = () => {
      if (!showAddForm) return null;
      let activeCategoryForForm: ActiveTab | EmissionCategory = activeTab;
      if (activeTab === 'Scope 3') {
          activeCategoryForForm = activeScope3Category;
      }
      switch(activeCategoryForForm) {
          case 'Scope 1 - Stationary':
          case 'Scope 1 - Mobile':
          case 'Scope 1 - Process':
          case 'Scope 1 - Waste':
          case EmissionCategory.BusinessTravel:
          case EmissionCategory.EmployeeCommuting:
          case EmissionCategory.WasteGeneratedInOperations:
               return <AddNewCO2eSourceForm onAdd={(fuel) => {
                  if (activeCategoryForForm === 'Scope 1 - Stationary') setNewlyAddedStationary(p => [...p, fuel]);
                  else if (activeCategoryForForm === 'Scope 1 - Mobile') setNewlyAddedMobile(p => [...p, fuel]);
                  else if (activeCategoryForForm === 'Scope 1 - Process') setNewlyAddedProcess(p => [...p, fuel]);
                  else if (activeCategoryForForm === 'Scope 1 - Waste') setNewlyAddedWaste(p => [...p, fuel]);
                  else if (activeCategoryForForm === EmissionCategory.BusinessTravel) setNewlyAddedBusinessTravel(p => [...p, fuel]);
                  else if (activeCategoryForForm === EmissionCategory.EmployeeCommuting) setNewlyAddedEmployeeCommuting(p => [...p, fuel]);
                  else setNewlyAddedScope3Waste(p => [...p, fuel]);
                  setShowAddForm(false);
              }} onCancel={() => setShowAddForm(false)} />;
          case 'Scope 1 - Fugitive':
              return <AddNewFugitiveSourceForm onAdd={(gas) => {
                  setNewlyAddedFugitive(p => [...p, gas]);
                  setShowAddForm(false);
              }} onCancel={() => setShowAddForm(false)} />;
          default: return null;
      }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-ghg-dark dark:text-gray-100">
        <span>{t('manageFactors')}</span>
        <svg className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t dark:border-gray-600">
          <div className="mb-4 border-b border-gray-200 dark:border-gray-500">
             <div className="flex space-x-2 pb-2 flex-wrap">
                <button className={tabClasses('Scope 1 - Stationary')} onClick={() => {setActiveTab('Scope 1 - Stationary'); setShowAddForm(false);}}>{t(EmissionCategory.StationaryCombustion)}</button>
                <button className={tabClasses('Scope 1 - Mobile')} onClick={() => {setActiveTab('Scope 1 - Mobile'); setShowAddForm(false);}}>{t(EmissionCategory.MobileCombustion)}</button>
                <button className={tabClasses('Scope 1 - Process')} onClick={() => {setActiveTab('Scope 1 - Process'); setShowAddForm(false);}}>{t(EmissionCategory.ProcessEmissions)}</button>
                <button className={tabClasses('Scope 1 - Fugitive')} onClick={() => {setActiveTab('Scope 1 - Fugitive'); setShowAddForm(false);}}>{t(EmissionCategory.FugitiveEmissions)}</button>
                <button className={tabClasses('Scope 1 - Waste')} onClick={() => {setActiveTab('Scope 1 - Waste'); setShowAddForm(false);}}>{t('Waste')}</button>
                <button className={tabClasses('Scope 2')} onClick={() => {setActiveTab('Scope 2'); setShowAddForm(false);}}>{t(EmissionCategory.PurchasedEnergy)}</button>
                <button className={tabClasses('Scope 3')} onClick={() => {setActiveTab('Scope 3'); setShowAddForm(false);}}>{t('scope3')}</button>
            </div>
          </div>
          
          {activeTab === 'Scope 2' && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end">
                    <div>
                        <label htmlFor="region-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('selectRegion')}</label>
                        <select id="region-select" value={selectedRegion} onChange={(e) => handleRegionChange(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-ghg-green focus:border-ghg-green sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-500">
                            <option value="Custom">{t('custom')}</option>
                            {Object.keys(SCOPE2_FACTORS_BY_REGION).map(region => <option key={region} value={region}>{t(SCOPE2_FACTORS_BY_REGION[region].translationKey as TranslationKey)}</option>)}
                        </select>
                    </div>
                    {regionData && (<div className="text-xs text-gray-600 dark:text-gray-400 md:text-sm"><span className="font-semibold">{t('source')}:</span> {regionData.source}<a href={regionData.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-ghg-green hover:underline">({t('viewSource')})</a></div>)}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('regionNote')}</p>
            </div>
          )}

          {activeTab === 'Scope 3' && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-600">
                <label htmlFor="scope3-category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('category')}</label>
                <select 
                    id="scope3-category-select" 
                    value={activeScope3Category} 
                    onChange={(e) => setActiveScope3Category(e.target.value as EmissionCategory)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-ghg-green focus:border-ghg-green sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-500"
                >
                    {scope3FactorCategories
                      .filter(cat => enabledScope3Categories.includes(cat))
                      .map(category => (
                        <option key={category} value={category}>{t(category)}</option>
                    ))}
                </select>
            </div>
          )}

          <div className="overflow-x-auto">
              {renderActiveTabContent()}
          </div>
        
          {!showAddForm && activeTab !== 'Scope 2' && (activeTab !== 'Scope 3' || scope3FactorCategories.filter(cat => enabledScope3Categories.includes(cat)).length > 0) ? (
                <div className="mt-4">
                    <button onClick={() => setShowAddForm(true)} className="w-full text-sm bg-ghg-light-green/20 text-ghg-dark dark:bg-ghg-light-green/30 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg hover:bg-ghg-light-green/40 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghg-green">
                        {t('addNewSource')}
                    </button>
                </div>
            ) : renderAddForm()
          }
          
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t dark:border-gray-600">
            <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghg-green dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
            <button onClick={handleSaveChanges} className="px-4 py-2 text-sm font-medium text-white bg-ghg-green border border-transparent rounded-md shadow-sm hover:bg-ghg-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghg-green">{t('saveChanges')}</button>
          </div>
        </div>
      )}
    </div>
  );
};
