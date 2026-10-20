import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  InputSlot,
  Pressable,
  ScrollView,
  LucideIcon,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import { getParticipantsList } from '../../../../services/participantService';

export interface PickedParticipant {
  userId: string;
  name: string;
  status?: string;
}

interface ParticipantPickerProps {
  value: PickedParticipant | null;
  onSelect: (participant: PickedParticipant) => void;
}

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 8;

const getStatusColors = (status?: string): { bg: string; text: string } => {
  const s = (status || '').toUpperCase();
  if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return { bg: '$blue100', text: '$blue700' };
  if (s === 'GRADUATED' || s === 'COMPLETED') return { bg: '$success100', text: '$success700' };
  return { bg: '$gray100', text: '$gray700' };
};

const ParticipantPicker: React.FC<ParticipantPickerProps> = ({ value, onSelect }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PickedParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (text: string) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const response = await getParticipantsList({
          userId: user.id,
          page: 1,
          limit: PAGE_SIZE,
          search: text || undefined,
        });
        const list: PickedParticipant[] = (response?.result?.data || []).map((p: any) => ({
          userId: p.userId,
          name: p.name,
          status: p.status,
        }));
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    if (!open) return undefined;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, open, search]);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && results.length === 0) search('');
  };

  const handleSelect = (participant: PickedParticipant) => {
    onSelect(participant);
    setOpen(false);
    setQuery('');
  };

  return (
    <VStack space="xs" width="100%" maxWidth={560}>
      <HStack space="sm" alignItems="center" flexWrap="wrap">
        <Text fontSize="$sm" color="$textMutedForeground">
          {t('lc.dashboard.outcomes.viewingDataFor')}
        </Text>

        <Box flex={1} minWidth={220} maxWidth={350}>
          <Pressable onPress={handleOpen}>
            <HStack
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$md"
              bg="$white"
              px="$3"
              py="$2.5"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text fontSize="$sm" color={value ? '$textForeground' : '$textMutedForeground'} numberOfLines={1}>
                {value ? `${value.name} (ID: ${value.userId})` : t('lc.dashboard.outcomes.selectParticipant')}
              </Text>
              <LucideIcon name="ChevronDown" size={16} color="$textMutedForeground" />
            </HStack>
          </Pressable>
        </Box>
      </HStack>

      {open ? (
        <Box borderWidth={1} borderColor="$borderColor" borderRadius="$md" bg="$white" overflow="hidden" maxWidth={350}>
          <Box p="$2" borderBottomWidth={1} borderColor="$borderColor">
            <Input size="sm">
              <InputSlot pl="$2">
                <LucideIcon name="Search" size={14} color="$textMutedForeground" />
              </InputSlot>
              <InputField
                placeholder={t('lc.dashboard.outcomes.searchParticipants')}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </Input>
          </Box>

          <ScrollView maxHeight={220}>
            {loading ? (
              <Box p="$3">
                <Text fontSize="$sm" color="$textMutedForeground">
                  {t('common.loading')}
                </Text>
              </Box>
            ) : results.length === 0 ? (
              <Box p="$3">
                <Text fontSize="$sm" color="$textMutedForeground">
                  {t('lc.dashboard.outcomes.noParticipantsFound')}
                </Text>
              </Box>
            ) : (
              results.map(participant => {
                const colors = getStatusColors(participant.status);
                return (
                  <Pressable key={participant.userId} onPress={() => handleSelect(participant)}>
                    <HStack
                      px="$3"
                      py="$2.5"
                      justifyContent="space-between"
                      alignItems="center"
                      borderBottomWidth={1}
                      borderColor="$borderLight100"
                    >
                      <VStack flex={1}>
                        <Text fontSize="$sm" color="$textForeground" numberOfLines={1}>
                          {participant.name}
                        </Text>
                        <Text fontSize="$xs" color="$textMutedForeground">
                          {`ID: ${participant.userId}`}
                        </Text>
                      </VStack>
                      {participant.status ? (
                        <Box bg={colors.bg} borderRadius="$full" px="$2" py="$0.5">
                          <Text fontSize={10} color={colors.text}>
                            {participant.status}
                          </Text>
                        </Box>
                      ) : null}
                    </HStack>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </Box>
      ) : null}
    </VStack>
  );
};

export default ParticipantPicker;
