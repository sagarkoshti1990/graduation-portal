import React, { useEffect, useMemo, useState } from 'react';
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
  ButtonSpinner,
  LucideIcon,
  Modal,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CheckIcon } from '@gluestack-ui/themed';
import { updateEntityDetails } from '../../../services/participantService';
import { User } from '@contexts/AuthContext';
import { STATUS } from '@constants/app.constant';

interface TargetingCriteriaCardProps {
  user: User | null;
  participant: User;
  setTargetingCriteria: (item: boolean | string) => void;
}

const hasAllOptionsSelected = (options: any, selectedValues: string[]) => {
  return options.every((option: any) => selectedValues.includes(option.value));
};

const TargetingCriteriaCard = ({
  user,
  participant,
  setTargetingCriteria
}: TargetingCriteriaCardProps) => {
  const { t } = useLanguage();

  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [buttonLoader,setButtonLoader] = useState<boolean|string>(false);

  const options = useMemo(() => [
    {
      label: t('participantDetail.header.targetingCriteriaCSGSRDGrant'),
      value: 'csgsrdgrant',
    },
    {
      label: t('participantDetail.header.targetingCriteriaAge'),
      value: 'age',
    },
  ],
  [t]);

  const handaleEetTargetingCriteria = (values: string[]) => {
    const status = hasAllOptionsSelected(options, values);

    if (status) {
      setTargetingCriteria(true);
    }
  };

  useEffect(() => {
    const targetingCriteria = participant?.metaInformation?.targetingCriteria || {};
    const values: string[] = [];

    for (const key in targetingCriteria) {
      if(targetingCriteria[key]) {
        values.push(key);
      }
    }

    setSelectedValues(values);
    handaleEetTargetingCriteria(values);
  }, [participant?.metaInformation?.targetingCriteria]);

  const handleCheckboxChange = (value: string) => {
    setSelectedValues((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }

      return [...prev, value];
    });
  };

  const handleNotEligible = async () => {
    const dataResult = await updateEntityDetails({
      userId: `${user?.id}`,
      entityId: participant?.entityId,
      entityUpdates: {
        status: STATUS.NOT_ELIGIBLE,
      },
    });

    if (dataResult.data) {
      setTargetingCriteria(STATUS.NOT_ELIGIBLE);
    }
  };

  const handleSubmit = async () => {
    const targetingCriteria = options.reduce(
      (acc, option) => {
        acc[option.value] = selectedValues.includes(option.value);
        return acc;
      },
      {} as Record<string, boolean>,
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
        handaleEetTargetingCriteria(selectedValues);
        setButtonLoader(false);
      }
    } catch (err) {
      console.error('Failed to update targeting criteria', err);
    }
  };

  const isAllSelected = useMemo(
    () => hasAllOptionsSelected(options, selectedValues),
    [options, selectedValues]
  );

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

        <HStack alignItems="center" space="md">
          <Button
            mt="$4"
            // @ts-ignore
            variant="outlineghost"
            onPress={() => {
              setShowConfirmModal(true);
              setButtonLoader('notEligible');
            }}
            // @ts-ignore
            isDisabled={buttonLoader}
          >
            {buttonLoader === 'notEligible' && (
              <ButtonSpinner />
            )}
            <ButtonText>{t('participantDetail.header.notEligible')}</ButtonText>
          </Button>

          <Button
            mt="$4"
            variant="solid"
            onPress={async () => {
              setButtonLoader('proceed');
              await handleSubmit();
            }}
            // @ts-ignore
            isDisabled={!isAllSelected || buttonLoader}
          >
            {buttonLoader === 'proceed' && (
              <ButtonSpinner />
            )}
            <ButtonText>{t('participantDetail.header.proceed')}</ButtonText>
          </Button>
        </HStack>
      </VStack>

      <Modal
        isOpen={!!showConfirmModal}
        onClose={()=>{
          setButtonLoader(false);
          setShowConfirmModal(false);
        }}
        headerTitle={`${t('participantDetail.header.confirmNotEligible')}`}
        headerAlignment="baseline"
        size="lg"
        confirmButtonText={t('participantDetail.header.notEligible')}
        onConfirm={() => handleNotEligible()}
        cancelButtonText={t('common.cancel')}
        onCancel={()=>{
          setButtonLoader(false);
          setShowConfirmModal(false);
        }}
      >
        <Text>{t('participantDetail.header.confirmNotEligibleSubtitle')}</Text>
      </Modal>
    </Box>
  );
};

export default TargetingCriteriaCard;