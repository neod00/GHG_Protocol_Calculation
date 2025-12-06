import { en as enCategories, ko as koCategories } from './categories';
import { en as enCommon, ko as koCommon } from './common';
import { en as enFuels, ko as koFuels } from './fuels';
import { en as enMain, ko as koMain } from './main';
import { en as enReport, ko as koReport } from './report';
import { en as enUnits, ko as koUnits } from './units';
import { en as enWizard, ko as koWizard } from './wizard';

import { en as enSettings, ko as koSettings } from './settings';
import { en as enAuth, ko as koAuth } from './auth';
import { en as enLanding, ko as koLanding } from './landing';

const en = {
  ...enCategories,
  ...enCommon,
  ...enFuels,
  ...enMain,
  ...enReport,
  ...enUnits,
  ...enWizard,
  ...enSettings,
  ...enAuth,
  ...enLanding,
};

const ko = {
  ...koCategories,
  ...koCommon,
  ...koFuels,
  ...koMain,
  ...koReport,
  ...koUnits,
  ...koWizard,
  ...koSettings,
  ...koAuth,
  ...koLanding,
};

export type Language = 'en' | 'ko';
export type Translations = typeof en;
export type TranslationKey = keyof Translations;
export const translations: { [key in Language]: Translations } = { en, ko };
