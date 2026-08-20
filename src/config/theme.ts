import { config as gluestackConfig } from '@gluestack-ui/config';

export const theme = {
  ...gluestackConfig,
  tokens: {
    ...gluestackConfig.tokens,
    colors: {
      ...gluestackConfig.tokens.colors,
      shadowColor: '#0000001a',
      primary50: '#ebeaef',
      primary500: '#8B2842',
      primary600: '#A53E54',
      primary700: '#6B1E31',
      primary100: '#fef2f2',
      primary300: '#8B28421A',
      info100: '#0ea5e9',
      warning500: '#fe9a00',
      purple500: '#9810fa',
      blue500: '#155dfc',
      accent100: '#fafbfc',
      accent200: '#f1f5f9',
      accent300: '#22c55e',
      accent400: '#9810fa',
      backgroundColor: '#fafbfc',
      backgroundPrimary: {
        light: '#ffffff',
        dark: '#1a1a1a',
      },
      foreground: '#0a0a0a',
      mutedForeground: '#717182',
      mutedBorder: '#e0e0e0',
      error: {
        light: '#dc2626',
        dark: '#f87171',
      },
      modalBorder: '#8B2842',
      modalBackground: '#FFFFFF',
      modalBackdrop: 'rgba(0, 0, 0, 0.5)',
      inputBorder: '#E5E7EB',
      inputFocusBorder: '#8B2842',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      textMuted: '#9CA3AF',
      iconBackground: 'rgba(139, 40, 66, 0.08)',
      backgroundLightGray100: '#e3e9ef',
      hoverBackground: '#F9FAFB',
      textMutedForeground: '#64748b',
      textForeground: '#2d2d2d',
      textForegroundColor: '#1e293b',
      bgSidebar: '#f8fafc',
      btnPrimary: '#8B2842',
      progressBarBackground: '#dbeafe',
      progressBarFillColor: '#2b7fff',
      success50: '#f0fdf4',
      success600: '#00a63e',
      error50: '#fef2f2',
      error100: '#ffe2e2',
      error200: '#ffc9c9',
      error300: '#ffa2a2',
      error600: '#dc2626',
      error700: '#c10007',
      error900: '#82181a',
      bgDestructive: '#ef4444',
      gray50: '#f9fafb',
      gray100: '#f6f3f4',
      gray300: '#d1d5dc',
      gray600: '#4b5563',
      gray700: '#364153',
      purple50: '#faf5ff',
      purple100: '#f3e8ff',
      purple300: '#dab2ff',
      purple600: '#9333ea',
      purple700: '#8200db',
      blue50: '#eff6ff',
      blue100: '#dbeafe',
      blue200: '#bfdbfe',
      blue300: '#8ec5ff',
      blue600: '#2563eb',
      blue700: '#1447e6',
      blue800: '#1e40af',
      success100: '#dcfce7',
      success300: '#7bf1a8',
      success700: '#008236',
      bgSecondary: '#f0f2f5',
      badgeColor: '#64748b',
      hoverBorder: '#C593A0',
      iconBgCyan: '#e0f7fa',
      iconCyan: '#00bcd4',
      badgeSuccessBg: '#e6ffe6',
      badgeSuccessText: '#00b300',
      badgeInfoBg: '#eaf3ff',
      badgeInfoText: '#0b67e6',
      taskCardBg: '#f8f9fa',
      taskCardBorder: '#e9ecef',
      onboardingUploadBtnBg: '#E6F0FF',
      onboardingUploadBtnBgHover: '#D0E4FF',
      onboardingUploadBtnText: '#0056B3',
      onboardingFormBtnBg: '#F2F2F2',
      onboardingFormBtnBgHover: '#E5E5E5',
      onboardingFormBtnText: '#374151',
      observationTaskBg: '#FFFBEB',
      observationTaskBorder: '#F59E0B',
      addedToPlanBg: '#DCFCE7',
      addedToPlanBorder: '#BBF7D0',
      optionalBadgeBg: '#DBEAFE',
      optionalBadgeText: '#1e40af',
      socialProtectionBg: '#FFF5F5',
      hoverPink: '#fef2f2',
      warningIconColor: '#ca8a04',
      infoIconColor: '#0284c7',
      stylesCardBg: '#F6F7FB',
      pillarSocialEmpowerment: '#9333ea',
      pillarLivelihoods: '#15803d',
      pillarFinancialInclusion: '#1d4ed8',
      pillarSocialProtection: '#f97316',
      borderColor: '#e2e8f0',
      'bgPrimary/5': '#F9F4F5',
      'bgPrimaryBorder/5': '#E9D5DA',
      'bgPrimary/10': '#8B28421A',
      'bgPrimary/30': '#f9fafb4d',
      previewBackground: '#E2E8F0',
      // Preview mode - accordion
      socialProtectionAccordionBg: '#fff1f2',
      // Preview mode - optional task card states
      optionalTaskYellowBg: '#fffbeb',
      optionalTaskYellowBorder: '#fde68a',
      optionalTaskGreenBg: '#f0fdf4',
      optionalTaskGreenBorder: '#bbf7d0',
      optionalTaskRedBg: '#ffe2e2',
      // Preview mode - tick button active state
      tickButtonActiveBg: '#16a34a',
      tableHeaderBg: '#f7f9fc',
      tooltipBg: '#45556c',
      evidenceRequiredBg: '#fff9db',
      evidenceRequiredBorder: '#ffd230',
      faintBlue: "#e8f0f9ff",
    },
    fonts: {
      ...((gluestackConfig.tokens as any).fonts || {}),
      body: 'Inter',
      heading: 'Inter',
      input: 'Inter',
      inputField: 'Inter',
      inputSlot: 'Inter',
      inputIcon: 'Inter',
      inputPlaceholder: 'Inter',
      inputPlaceholderTextColor: 'Inter',
    },
    sizes: {
      ...((gluestackConfig.tokens as any).sizes || {}),
      container: {
        0: '100%',
        sm: '540px',
        md: '720px',
        lg: '960px',
        xl: '1280px',
        '2xl': '1320px',
      },
    },
  },
  components: {
    ...gluestackConfig.components,
    Button: {
      ...gluestackConfig.components.Button,
      theme: {
        ...gluestackConfig.components.Button.theme,
        variants: {
          ...gluestackConfig.components.Button.theme.variants,
          variant: {
            ...gluestackConfig.components.Button.theme.variants.variant,
            ghost: {
              ...gluestackConfig.components.Button.theme.variants.variant.outline,
              borderWidth: 0,
              borderRadius: "$xl",
              gap: "$2",
              ":hover": {
                bg: "$primary100",
                _text: {
                  color: "$primary500 !important",
                },
                _icon: {
                  color: "$primary500 !important",
                },
              },
              _text: {
                color: "$textForeground",
              },
              _icon: {
                color: "$textForeground",
              },
            },
            outlineghost: {
              ...gluestackConfig.components.Button.theme.variants.variant.outline,
              borderWidth: 1,
              borderColor: "$borderColor",
              borderRadius: "$xl",
              gap: "$2",
              bg: "$accent100",
              ":hover": {
                bg: "$primary100",
                borderColor: "$borderColor",
                _text: {
                  color: "$primary500 !important",
                },
                _icon: {
                  color: "$primary500 !important",
                },
              },
              _text: {
                color: "$textForeground !important",
                fontWeight: "$medium !important",
                fontSize: "$sm !important",
              },
              _icon: {
                color: "$textForeground !important",
                fontWeight: "$medium !important",
              },
            },
            solid: {
              ...gluestackConfig.components.Button.theme.variants.variant.solid,
              borderRadius: "$xl",
              gap: "$2",
              _text: {
                fontWeight: "$medium !important",
                color: "$white !important",
                fontSize: "$sm !important",
              },
              _icon: {
                color: "$white !important",
              },
            },
            danger: {
              ...gluestackConfig.components.Button.theme.variants.variant.solid,
              borderRadius: "$xl",
              gap: "$2",
              bg: "$red600",
              ":hover": {
                bg: "$red700",
                borderColor: "$borderColor",
                _text: {
                  color: "$medium !important",
                },
                _icon: {
                  color: "$medium !important",
                },
              },
              _text: {
                color: "$white !important",
                fontWeight: "$medium !important",
                fontSize: "$sm !important",
              },
              _icon: {
                color: "$white !important",
                fontWeight: "$medium !important",
              },
            },
          },
        },
      },
    },
    Input: {
      ...gluestackConfig.components.Input,
      theme: {
        ...gluestackConfig.components.Input.theme,
        variants: {
          ...gluestackConfig.components.Input.theme.variants,
          variant: {
            ...gluestackConfig.components.Input.theme.variants.variant,
            outline: {
              ...gluestackConfig.components.Input.theme.variants.variant.outline,
              // existing styles
              [":invalid"]: {
                ...gluestackConfig.components.Input.theme.variants.variant.outline[":invalid"],
                _web: {
                  boxShadow: "0 0 0 1px $error700",
                  // boxShadow: '0 0 #8b284280, 0 0 #8b284280, 0 0 #8b284280, 0 0 #8b284280, 0 0 #8b284280;',
                },
                [":focus"] : {
                  ...gluestackConfig.components.Input.theme.variants.variant.outline[":invalid"][":focus"],
                  _web: {
                    // boxShadow: '0 0 0 1px color-mix(in oklab, $error700 100%, transparent)',
                    boxShadow: "0 0 0 1px $error700",
                    borderColor: '$error700 !important',
                  },
                  [":hover"] : {
                    ...gluestackConfig.components.Input.theme.variants.variant.outline[":invalid"][":focus"][":hover"],
                    _web: {
                      // boxShadow: '0 0 0 1px color-mix(in oklab, $error700 100%, transparent)',
                      boxShadow: "0 0 0 1px $error700",
                      borderColor: '$error700 !important',
                    },
                  }
                }
              },
              [":focus"]: {
                ...gluestackConfig.components.Input.theme.variants.variant.outline[":focus"],
                _web: {
                  // boxShadow: '0 0 0 1px color-mix(in oklab, $error700 100%, transparent)',
                  boxShadow: "0 0 0 1px $error700",
                  borderColor: '$error700 !important',
                },
              },
            },
          },
        },
      },
    },
    Textarea: {
      ...gluestackConfig.components.Textarea,
      theme: {
        ...gluestackConfig.components.Textarea.theme,
        variants: {
          ...gluestackConfig.components.Textarea.theme.variants,
          variant: {
            ...gluestackConfig.components.Textarea.theme.variants.variant,
            default: {
              ...gluestackConfig.components.Textarea.theme.variants.variant.default,
              // existing styles
              [":invalid"]: {
                ...gluestackConfig.components.Textarea.theme.variants.variant.default[":invalid"],
                _web: {
                  boxShadow: "0 0 0 1px $error700",
                  // boxShadow: '0 0 #8b284280, 0 0 #8b284280, 0 0 #8b284280, 0 0 #8b284280, 0 0 #8b284280;',
                },
                [":focus"] : {
                  ...gluestackConfig.components.Textarea.theme.variants.variant.default[":invalid"][":focus"],
                  _web: {
                    // boxShadow: '0 0 0 1px color-mix(in oklab, $error700 100%, transparent)',
                    boxShadow: "0 0 0 1px $error700",
                    borderColor: '$error700 !important',
                  },
                  [":hover"] : {
                    ...gluestackConfig.components.Textarea.theme.variants.variant.default[":invalid"][":focus"][":hover"],
                    _web: {
                      // boxShadow: '0 0 0 1px color-mix(in oklab, $error700 100%, transparent)',
                      boxShadow: "0 0 0 1px $error700",
                      borderColor: '$error700 !important',
                    },
                  }
                }
              },
              [":focus"]: {
                ...gluestackConfig.components.Textarea.theme.variants.variant.default[":focus"],
                _web: {
                  boxShadow: '0 0 0 1px color-mix(in oklab, $error700 100%, transparent)',
                  borderColor: '$error700 !important',
                },
              },
            },
          },
        },
      },
    },
  },
} as const;