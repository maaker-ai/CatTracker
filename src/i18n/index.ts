import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import zhHans from './locales/zh-Hans.json';
import zhHant from './locales/zh-Hant.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ru from './locales/ru.json';
import it from './locales/it.json';
import ar from './locales/ar.json';
import id from './locales/id.json';
import tr from './locales/tr.json';
import nl from './locales/nl.json';
import ptBR from './locales/pt-BR.json';
import pl from './locales/pl.json';
import sv from './locales/sv.json';
import no from './locales/no.json';
import da from './locales/da.json';
import th from './locales/th.json';

const resources = {
  en: { translation: en },
  'zh-Hans': { translation: zhHans },
  'zh-Hant': { translation: zhHant },
  ja: { translation: ja },
  ko: { translation: ko },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  ru: { translation: ru },
  it: { translation: it },
  ar: { translation: ar },
  id: { translation: id },
  tr: { translation: tr },
  nl: { translation: nl },
  'pt-BR': { translation: ptBR },
  pl: { translation: pl },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  th: { translation: th },
};

function getDeviceLanguage(): string {
  try {
    const locales = getLocales();
    if (locales.length > 0) {
      const { languageTag, languageCode } = locales[0];
      // Check for exact match first (e.g. zh-Hans, zh-Hant, pt-BR)
      if (languageTag in resources) return languageTag;
      // Check for language code with script (zh-Hans, zh-Hant)
      if (languageTag.startsWith('zh-Hans') || languageTag.startsWith('zh-CN')) return 'zh-Hans';
      if (languageTag.startsWith('zh-Hant') || languageTag.startsWith('zh-TW') || languageTag.startsWith('zh-HK')) return 'zh-Hant';
      // Portuguese: treat all pt-* (including pt-PT) as pt-BR for now (only Brazilian supported)
      if (languageTag.startsWith('pt')) return 'pt-BR';
      // Norwegian: Apple uses 'nb' (Bokmål) and 'nn' (Nynorsk); map both to our 'no' file
      if (languageCode === 'nb' || languageCode === 'nn' || languageCode === 'no') return 'no';
      // Check for base language code
      if (languageCode && languageCode in resources) return languageCode;
    }
  } catch {
    // Fallback silently
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
