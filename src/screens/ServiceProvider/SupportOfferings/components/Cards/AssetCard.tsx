import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  LucideIcon,
  Badge,
  BadgeText,
  useAlert,
} from '@ui';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import type { ProvinceEntity, SiteEntity } from '@app-types/Users';
import { getAssets } from '../../../../../services/SupportOfferingsServices/supportOfferingsService';
import type { AssetItem } from '../../../../../constants/SUPPORT_OFFERINGS_MOCK';
import styles from '../../styles';

// ---------- Card ----------

interface CardProps {
  item: AssetItem;
}

const Card: React.FC<CardProps> = ({ item }) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const navigation = useNavigation();

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return { bg: '$blue50', border: 'transparent', text: '$blue600', icon: 'Clock' };
      case 'Accepted':
        return { bg: '$success50', border: 'transparent', text: '$success600', icon: 'CheckCircle' };
      case 'Pending':
        return { bg: '$warning50', border: 'transparent', text: '$warning600', icon: 'Clock' };
      case 'Rejected':
      default:
        return { bg: '$error50', border: 'transparent', text: '$error600', icon: 'XCircle' };
    }
  };

  const statusColors = getStatusColors(item.status);

  return (
    <Box {...styles.cardContainer}>
      <HStack {...styles.cardHeaderHStack}>
        {/* Left Side: Info */}
        <VStack {...styles.cardLeftVStack}>
          {/* Row 1: Title + Badge */}
          <HStack {...styles.titleRowHStack}>
            <Text {...styles.cardTitleText}>
              {item.title}
            </Text>
            <Badge {...styles.badgeContainer(statusColors.bg)}>
              <HStack {...styles.badgeContentHStack}>
                <LucideIcon name={statusColors.icon} {...styles.badgeIconProps(statusColors.text)} />
                <BadgeText {...styles.badgeText(statusColors.text)}>
                  {item.status}
                </BadgeText>
              </HStack>
            </Badge>
          </HStack>

          {/* Row 2: Description */}
          {item.description ? (
            <Text {...styles.cardDescriptionText}>
              {item.description}
            </Text>
          ) : null}

          {/* Row 3: Metadata */}
          <HStack {...styles.metaRowHStack}>
            <HStack {...styles.metaItemHStack}>
              <LucideIcon name="Layers" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaText}>
                {item.type}
              </Text>
            </HStack>

            <HStack {...styles.metaItemHStack}>
              <LucideIcon name="Briefcase" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaText}>
                {t('supportProvider.supportOfferings.cards.sector', { sector: item.sector })}
              </Text>
            </HStack>

            <HStack {...styles.metaItemHStack}>
              <LucideIcon name="Coins" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaText}>
                {t('supportProvider.supportOfferings.cards.value', { value: item.value })}
              </Text>
            </HStack>

            <HStack {...styles.metaItemHStack}>
              <LucideIcon name="MapPin" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaText}>
                {t('supportProvider.supportOfferings.cards.locationLabel', { location: item.location })}
              </Text>
            </HStack>

            <HStack {...styles.metaItemHStack}>
              <LucideIcon name="Users" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaText}>
                {item.requests}
              </Text>
            </HStack>
          </HStack>
        </VStack>

        {/* Right Side: Action Buttons stacked vertically */}
        <VStack {...styles.cardRightActionStack}>
          <Pressable
            {...styles.viewRequestsBtn}
            onPress={() => {
              try {
                (navigation as any).navigate('requests');
              } catch (e) {
                showAlert('info', t('supportProvider.supportOfferings.cards.alerts.navigatingRequests'));
              }
            }}
          >
            <Text {...styles.cardBtnSecondaryText}>
              {t('supportProvider.supportOfferings.cards.viewRequests')}
            </Text>
          </Pressable>

          <Pressable
            {...styles.copyOfferingBtn}
            onPress={() => showAlert('success', t('supportProvider.supportOfferings.cards.alerts.offeringCopied'))}
          >
            <HStack {...styles.pressableInnerHStack}>
              <LucideIcon name="Copy" {...styles.cardCopyIconProps} />
              <Text {...styles.cardBtnPrimaryText}>
                {t('supportProvider.supportOfferings.cards.copyOffering')}
              </Text>
            </HStack>
          </Pressable>
        </VStack>
      </HStack>
    </Box>
  );
};

// ---------- ListCard ----------

interface AssetCardProps {
  searchQuery?: string;
  statusFilter?: string;
  provinceFilter?: string;
  siteFilter?: string;
  provincesList?: ProvinceEntity[];
  sitesList?: SiteEntity[];
}

export default function AssetCard({
  searchQuery,
  statusFilter,
  provinceFilter,
  siteFilter,
  provincesList = [],
  sitesList = [],
}: AssetCardProps): React.ReactElement {
  const [assets, setAssets] = useState<AssetItem[]>([]);

  useEffect(() => {
    getAssets({
      searchQuery,
      statusFilter,
      provinceFilter,
      siteFilter,
      provincesList,
      sitesList,
    }).then(setAssets);
  }, [searchQuery, statusFilter, provinceFilter, siteFilter, provincesList, sitesList]);

  return (
    <VStack {...styles.listContainer}>
      {assets.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </VStack>
  );
}
