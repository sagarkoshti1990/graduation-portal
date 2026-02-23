import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { StatCardContainer, StatTitle, StatCount, StatSubLabel, StatsRowContainer } from './Styles';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';

interface StatCardProps {
  title: string; // Translation key for the stat title
  count: number | string; // Display value (percentage or count)
  subLabel: string; // Translation key for the stat subtitle
  color?: string;
  showCountBeforeSubLabel?: boolean; // If true, shows count before subLabel (e.g., "2,456 contacted")
  countValue?: string; // The actual count value to display in subtitle (e.g., "2,456")
  containerStyle?: StyleProp<ViewStyle>;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  count, 
  subLabel,
  color,
  showCountBeforeSubLabel = false,
  countValue,
  containerStyle,
}) => {
  const { t } = useLanguage();

  const resolveThemeColorToken = (value?: string) => {
    if (!value) return undefined;
    if (value.startsWith('$')) {
      const tokenKey = value.slice(1);
      return (theme.tokens.colors as any)?.[tokenKey] as string | undefined;
    }
    return value;
  };
  
  // Auto-detect if count is a percentage and apply green color
  const countStr = String(count);
  const isPercentage = countStr.includes('%');
  // If color is explicitly provided, use it; otherwise auto-detect percentage for green
  const explicitColor = resolveThemeColorToken(color);
  const finalColor =
    explicitColor !== undefined
      ? explicitColor
      : (isPercentage ? theme.tokens.colors.success600 : theme.tokens.colors.textForeground);
  
  // Determine what to show in subtitle
  // If showCountBeforeSubLabel is true and countValue is provided:
  // - If countValue looks like a full phrase (contains letters), show it directly
  // - Otherwise, prefix countValue before the translated subLabel (e.g. "2,456 contacted")
  const translatedSubLabel = t(subLabel);
  const subtitleText =
    showCountBeforeSubLabel && countValue
      ? /[A-Za-z]/.test(countValue)
        ? countValue
        : translatedSubLabel && translatedSubLabel !== countValue
          ? `${countValue} ${translatedSubLabel}`
          : countValue
      : translatedSubLabel;

  return (
    <StatCardContainer style={containerStyle}>
      <StatTitle>{t(title)}</StatTitle>
      <View>
         <StatCount style={{ color: finalColor }}>{count}</StatCount>
         <StatSubLabel>{subtitleText}</StatSubLabel>
      </View>
     
    </StatCardContainer>
  );
};

// Container component for the stats row
const StatsRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <StatsRowContainer>{children}</StatsRowContainer>;
};

export { StatsRow };
export default StatCard;