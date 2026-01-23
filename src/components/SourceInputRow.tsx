
import React from 'react';
import { EmissionSource, EmissionCategory, CalculationResult } from '../types';
import { DefaultRow } from './source_rows/DefaultRow';
import { Category1_2Row } from './source_rows/Category1_2Row';
import { Category3Row } from './source_rows/Category3Row';
import { Category4_9Row } from './source_rows/Category4_9Row';
import { Category5Row } from './source_rows/Category5Row';
import { Category6Row } from './source_rows/Category6Row';
import { Category7Row } from './source_rows/Category7Row';
import { Category8_13Row } from './source_rows/Category8_13Row';
import { Category10Row } from './source_rows/Category10Row';
import { Category11Row } from './source_rows/Category11Row';
import { Category12Row } from './source_rows/Category12Row';
import { Category14Row } from './source_rows/Category14Row';
import { Category15Row } from './source_rows/Category15Row';
import { SimpleScope3Row } from './source_rows/SimpleScope3Row';
import { Scope2Row } from './source_rows/Scope2Row';

// The props are unchanged and will be passed down to the specialized components.
interface SourceInputRowProps {
  source: EmissionSource;
  onUpdate: (updatedSource: Partial<EmissionSource>) => void;
  onRemove: () => void;
  onFuelTypeChange: (newFuelType: string) => void;
  fuels: any;
  facilities: any[]; // Kept as any[] to match the props passed down
  calculateEmissions: (source: EmissionSource) => CalculationResult;
  isAuditModeEnabled?: boolean;
  reportingYear: string;
}

export const SourceInputRow: React.FC<SourceInputRowProps> = (props) => {
  const { source } = props;

  switch (source.category) {
    case EmissionCategory.PurchasedGoodsAndServices:
    case EmissionCategory.CapitalGoods:
      return <Category1_2Row {...props} />;

    case EmissionCategory.FuelAndEnergyRelatedActivities:
      return <Category3Row {...props} />;

    case EmissionCategory.UpstreamTransportationAndDistribution:
    case EmissionCategory.DownstreamTransportationAndDistribution:
      return <Category4_9Row {...props} />;

    case EmissionCategory.WasteGeneratedInOperations:
      return <Category5Row {...props} />;

    case EmissionCategory.BusinessTravel:
      return <Category6Row {...props} />;

    case EmissionCategory.EmployeeCommuting:
      return <Category7Row {...props} />;

    case EmissionCategory.UpstreamLeasedAssets:
    case EmissionCategory.DownstreamLeasedAssets:
      return <Category8_13Row {...props} />;

    case EmissionCategory.ProcessingOfSoldProducts:
      return <Category10Row {...props} />;

    case EmissionCategory.UseOfSoldProducts:
      return <Category11Row {...props} />;

    case EmissionCategory.EndOfLifeTreatmentOfSoldProducts:
      return <Category12Row {...props} />;

    case EmissionCategory.Franchises:
      return <Category14Row {...props} />;

    case EmissionCategory.Investments:
      return <Category15Row {...props} />;

    case EmissionCategory.PurchasedEnergy:
      return <Scope2Row {...props} />;

    case EmissionCategory.StationaryCombustion:
    case EmissionCategory.MobileCombustion:
    case EmissionCategory.ProcessEmissions:
    case EmissionCategory.FugitiveEmissions:
    case EmissionCategory.Waste: // Scope 1 Waste
    default:
      return <DefaultRow {...props} />;
  }
};