import React, { useEffect } from 'react';
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
import { updateEntityDetails } from '../../../services/participantService';
import { User } from '@contexts/AuthContext';

interface TargetingCriteriaCardProps {
  user: User|null;
  participant: User;
  setTargetingCriteria:(item:boolean) => void;
}
const hasAllOptionsSelected = (options:any,selectedValues: string[]) => {
  return options.every((option:any) => selectedValues.includes(option.value));
};
const TargetingCriteriaCard = ({
  user,
  participant,
  setTargetingCriteria
}: TargetingCriteriaCardProps) => {
  const { t } = useLanguage();

  const [selectedValues, setSelectedValues] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const options = [
    {
      label: t('participantDetail.header.targetingCriteriaCSGSRDGrant'),
      value: 'csgsrdgrant',
    },
    {
      label: t('participantDetail.header.targetingCriteriaAge'),
      value: 'age',
    },
  ];

  const handaleEetTargetingCriteria = (values:string[]) => {
    const status = hasAllOptionsSelected(options,values);
    if(status) {
      setTargetingCriteria(true);
    }
  }

  useEffect(()=>{
    // participant
    const targetingCriteria = participant?.metaInformation?.targetingCriteria || {}
    let values = [];
    for(let key in targetingCriteria) {
      if(targetingCriteria[key]){
        values.push(key)
      }
    }
    setSelectedValues(values)
    handaleEetTargetingCriteria(values)
  },[participant?.metaInformation?.targetingCriteria])

  const handleCheckboxChange = (value: string) => {
    setSelectedValues((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }

      return [...prev, value];
    });

    setError(null);
  };

  const handleSubmit = async () => {
    if (selectedValues.length === 0) {
      setError(t('common.selectAtLeastOneOption'));
      return;
    }

    const targetingCriteria = options.reduce(
      (acc, option) => {
        acc[option.value] = selectedValues.includes(option.value);
        return acc;
      },
      {} as Record<string, boolean>
    );

    try {
      const dataResult = await updateEntityDetails({
        userId: `${user?.id}`,
        entityId: participant?.entityId,
        entityUpdates: {
          metaInformation: {
            targetingCriteria,
          },
        },
      });

      if(dataResult.data) {
        handaleEetTargetingCriteria(selectedValues)
      }

      setError(null);
    } catch (err) {
      console.error('Failed to update targeting criteria', err);
    }
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
          <Text {...TYPOGRAPHY.label}>
            {t('participantDetail.header.targetingCriteria')}
          </Text>

          <Text {...TYPOGRAPHY.bodySmall} mt="$1">
            {t('participantDetail.header.targetingCriteriaDescription')}
          </Text>
        </VStack>
      </HStack>

      {/* Body */}
      <VStack pt="$2" space="lg">
        <Text {...TYPOGRAPHY.bodySmall} fontWeight="$medium">
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
                      fontWeight="$medium"
                    >
                      {item.label}
                    </Text>
                  </CheckboxLabel>
                </HStack>
              </Checkbox>
            );
          })}
        </VStack>

        {error && (
          <Text color="$error500" {...TYPOGRAPHY.bodySmall}>
            {error}
          </Text>
        )}

        <HStack alignItems="center">
          <Button
            mt="$4"
            variant="solid"
            onPress={handleSubmit}
          >
            <ButtonText>Proceed</ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default TargetingCriteriaCard;