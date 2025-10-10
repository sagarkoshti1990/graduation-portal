import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRTL: false },
];

interface LanguageSelectorProps {
  compact?: boolean;
  showInDrawer?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  showInDrawer = false,
}) => {
  const { currentLanguage, changeLanguage, t, isRTL } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentLang =
    AVAILABLE_LANGUAGES.find(lang => lang.code === currentLanguage) ||
    AVAILABLE_LANGUAGES[0];

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  if (compact) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={toggleDropdown}
          style={{
            backgroundColor: '#F0F0F0',
            padding: '6px 12px',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            color: '#333333',
            marginRight: isRTL ? '0' : '12px',
            marginLeft: isRTL ? '12px' : '0',
          }}
          aria-label={t('settings.selectLanguage')}
        >
          🌐 {currentLang.code.toUpperCase()}
        </button>
        {dropdownOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
              }}
              onClick={() => setDropdownOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: isRTL ? 'auto' : '0',
                left: isRTL ? '0' : 'auto',
                marginTop: '8px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '100px',
              }}
            >
              {AVAILABLE_LANGUAGES.map(language => {
                const isSelected = language.code === currentLanguage;
                return (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      backgroundColor: isSelected ? '#E3F2FD' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: isRTL ? 'right' : 'left',
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #E0E0E0',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        (e.target as HTMLElement).style.backgroundColor =
                          '#F5F5F5';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        (e.target as HTMLElement).style.backgroundColor =
                          '#FFFFFF';
                      }
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#333333',
                        }}
                      >
                        {language.nativeName}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#666666',
                          marginTop: '2px',
                        }}
                      >
                        {language.name}
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: '20px', color: '#2196F3' }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  if (showInDrawer) {
    return (
      <button
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '14px 16px',
          borderRadius: '8px',
          marginBottom: '8px',
          backgroundColor: '#F3E5F5',
          border: '1px solid #9C27B0',
          cursor: 'pointer',
          width: '100%',
        }}
        aria-label={t('settings.selectLanguage')}
      >
        <span
          style={{
            fontSize: '20px',
            marginRight: isRTL ? '0' : '12px',
            marginLeft: isRTL ? '12px' : '0',
          }}
        >
          🌐
        </span>
        <span
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#7B1FA2',
            flex: 1,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {t('settings.language')}
        </span>
        <span style={{ fontSize: '14px', color: '#7B1FA2', opacity: 0.8 }}>
          {currentLang.nativeName}
        </span>
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          backgroundColor: '#FFFFFF',
          border: 'none',
          borderBottom: '1px solid #E0E0E0',
          cursor: 'pointer',
          width: '100%',
        }}
        aria-label={t('settings.selectLanguage')}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: '24px',
              marginRight: isRTL ? '0' : '16px',
              marginLeft: isRTL ? '16px' : '0',
            }}
          >
            🌐
          </span>
          <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
            <div
              style={{
                fontSize: '16px',
                color: '#333333',
                marginBottom: '4px',
              }}
            >
              {t('settings.language')}
            </div>
            <div style={{ fontSize: '14px', color: '#666666' }}>
              {currentLang.nativeName}
            </div>
          </div>
        </div>
        <span style={{ fontSize: '24px', color: '#CCCCCC' }}>›</span>
      </button>

      {dropdownOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999,
            }}
            onClick={() => setDropdownOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px',
              maxHeight: '70%',
              overflowY: 'auto',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid #E0E0E0',
                marginBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#333333',
                  margin: 0,
                }}
              >
                {t('settings.selectLanguage')}
              </h2>
              <button
                onClick={() => setDropdownOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666666',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            {AVAILABLE_LANGUAGES.map(language => {
              const isSelected = language.code === currentLanguage;
              return (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: isSelected ? '#E3F2FD' : '#F8F9FA',
                    border: isSelected ? '2px solid #2196F3' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      (e.target as HTMLElement).style.backgroundColor =
                        '#EEEEEE';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      (e.target as HTMLElement).style.backgroundColor =
                        '#F8F9FA';
                    }
                  }}
                >
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#333333',
                        marginBottom: '4px',
                      }}
                    >
                      {language.nativeName}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666666' }}>
                      {language.name}
                    </div>
                  </div>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: '24px',
                        color: '#2196F3',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
