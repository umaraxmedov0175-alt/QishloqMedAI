"use client";

import React, { createContext, useContext, useState } from "react";
import {
  translations,
  type Language,
  type TranslationKey,
} from "./i18n-dictionary";

export { translations, type Language, type TranslationKey };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "uz",
  setLanguage: () => {},
  t: (key: TranslationKey) => translations.uz[key] || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qm_lang");
      if (saved === "uz" || saved === "en") {
        return saved;
      }
    }
    return "uz";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("qm_lang", lang);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.uz[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
