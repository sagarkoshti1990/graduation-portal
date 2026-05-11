import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
  Button,
  ButtonText,
  LucideIcon,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CheckIcon } from '@gluestack-ui/themed';
const TargetingCriteriaCard = () => {
  const { t } = useLanguage()
  const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

  const options = [
    {
      label: 'Participants is receiving CSG/SRD Grant',
      value: 'grant',
    },
    {
      label: 'Age of participant is between 18-50',
      value: 'age',
    },
  ];

  const handleCheckboxChange = (value: string) => {
    setSelectedValues((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }

      return [...prev, value];
    });
  };

  const handleSubmit = () => {
    console.log('Selected Values =>', selectedValues);

    /**
     * Example Output:
     * ['grant', 'age']
     */
  };

  return (
    <Box
      borderWidth={1}
      borderColor="$coolGray200"
      borderRadius={24}
      bg="$backgroundLight0"
      p="$5"
      w="100%"
    >
      {/* Header */}
      <HStack space="md" alignItems="flex-start" pb="$3">
        <Box mt="$1">
          <LucideIcon name="Building2" color="$primary500" />
        </Box>

        <VStack flex={1}>
          <Text
            {...TYPOGRAPHY.label}
          >
            {t('participantDetail.header.targetingCriteria')}
          </Text>

          <Text
            {...TYPOGRAPHY.bodySmall}
            mt="$1"
          >
            {t('participantDetail.header.targetingCriteriaDescription')}
          </Text>
        </VStack>
      </HStack>

      {/* Body */}
      <VStack pt="$2" space="lg">
        <Text
          {...TYPOGRAPHY.bodySmall}
          fontWeight='$medium'
        >
          {t('participantDetail.header.targetingCriteriaDescription')}
        </Text>

        <VStack space="md">
          {options.map((item) => {
            const isChecked = selectedValues.includes(item.value);

            return (
              <Checkbox
                key={item.value}
                value={item.value}
                isChecked={isChecked}
                onChange={() => handleCheckboxChange(item.value)}
              >
                <HStack alignItems="center" space="md">
                  <CheckboxIndicator borderRadius="$full">
                    <CheckboxIcon as={CheckIcon} color="$white" />
                  </CheckboxIndicator>
                  <CheckboxLabel>
                    <Text
                      {...TYPOGRAPHY.bodySmall}
                      fontWeight='$medium'
                    >
                      {item.label}
                    </Text>
                  </CheckboxLabel>
                </HStack>
              </Checkbox>
            );
          })}
        </VStack>
        <HStack alignItems='center'>
          {/* Proceed Button */}
          <Button
            mt="$4"
            variant="solid"
            onPress={handleSubmit}
          >
            <ButtonText>
              Proceed
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default TargetingCriteriaCard;