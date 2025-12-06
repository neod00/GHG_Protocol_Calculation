---
description: Internationalize Project
---

# Internationalization

To add translations for new UI elements:

1.  **Locate Translation Files:**
    -   `src/translations/index.ts`: The main entry point.
    -   `src/translations/[module].ts`: Specific translation files (e.g., `common.ts`, `main.ts`).

2.  **Add Keys:**
    -   Open the relevant module file (e.g., `src/translations/common.ts`).
    -   Add the new key-value pair to both the `en` (English) and `ko` (Korean) objects.
    -   Example:
        ```typescript
        export const en = {
          newKey: 'New English Text',
          // ...
        }
        export const ko = {
          newKey: '새로운 한국어 텍스트',
          // ...
        }
        ```

3.  **Update Components:**
    -   Import `useTranslation`:
        ```typescript
        import { useTranslation } from '../context/LanguageContext';
        ```
    -   Destructure `t`:
        ```typescript
        const { t } = useTranslation();
        ```
    -   Use the key in your JSX:
        ```typescript
        <p>{t('newKey')}</p>
        ```

4.  **Verify:**
    -   Switch languages in the UI to ensure the text updates correctly.
    -   If changes don't appear, restart the dev server (`npm run dev`) to clear caches.
