import React from 'react';
import { Box, HStack, VStack, Text, Badge, BadgeText, Button, ButtonText, Loader } from '@ui';
import { ColumnDef } from '@app-types/components';
import { ReviewRequestsStyles as styles } from './Styles';
import type {
  ChangeRequestRecord,
  ChangeRequestStatus,
} from '../../services/changeRequestsService';

/**
 * Status badge color mapping for changeRequests documents.
 */
const getStatusColors = (status?: ChangeRequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return { bg: '$success100', text: '$success700', border: '$success300' };
    case 'REJECTED':
      return { bg: '$error100', text: '$error600', border: '$error300' };
    case 'PENDING':
    default:
      return { bg: '$warning100', text: '$warning700', border: '$warning300' };
  }
};

const StatusBadge: React.FC<{ status?: ChangeRequestStatus; label: string }> = ({ status, label }) => {
  const colors = getStatusColors(status);
  return (
    <Badge {...styles.statusBadgeBox} bg={colors.bg} borderColor={colors.border}>
      <BadgeText {...styles.statusBadgeText} color={colors.text}>
        {label}
      </BadgeText>
    </Badge>
  );
};

const TypeBadge: React.FC<{ label: string }> = ({ label }) => (
  <Box {...styles.typeBadgeBox}>
    <Text {...styles.typeBadgeText}>{label}</Text>
  </Box>
);

export interface GetReviewRequestsColumnsParams {
  t: (key: string, fallback?: string) => string;
  showActions: boolean;
  decidingId: string | null;
  onApprove: (row: ChangeRequestRecord) => void;
  onReject: (row: ChangeRequestRecord) => void;
}

/**
 * Builds the ColumnDef list for the Review Requests DataTable.
 * `showActions` should only be true for the Pending tab.
 */
export const getReviewRequestsColumns = ({
  t,
  showActions,
  decidingId,
  onApprove,
  onReject,
}: GetReviewRequestsColumnsParams): ColumnDef<ChangeRequestRecord>[] => {
  const columns: ColumnDef<ChangeRequestRecord>[] = [
     {
      key: 'requestorName',
      label: 'admin.reviewRequests.table.requestor',
      flex: 1,
      align: 'left',
      mobileConfig: { showColumn: true, showLabel: true, leftRank: 3 },
      render: (row: ChangeRequestRecord) => (
        <Text {...styles.cellMutedText}>{row.requestorName || '-'}</Text>
      ),
    },
    {
      key: 'action',
      label: 'admin.reviewRequests.table.type',
      flex: 1,
      align: 'left',
      mobileConfig: { showColumn: true, showLabel: true, leftRank: 2 },
      render: (row: ChangeRequestRecord) => (
        <TypeBadge
          label={
            row.action === 'USER_PROJECT_TEMPLATE_CHANGE'
              ? t('admin.reviewRequests.filters.pathwaySwitch', 'Pathway Switch')
              : t('admin.reviewRequests.filters.dropoutRequest', 'Dropout Request')
          }
        />
      ),
    },
    {
      key: 'changeSummary',
      label: 'admin.reviewRequests.table.change',
      flex: 1.6,
      align: 'left',
      mobileConfig: { showColumn: true, showLabel: true, fullWidthRank: 1 },
      render: (row: ChangeRequestRecord) => {
        const summary = row.changeSummary;
        if (summary && row.action === 'USER_PROJECT_TEMPLATE_CHANGE') {
          return (

            <VStack space="xs">
                <Text {...styles.changeFromToText}>
                  {t('admin.reviewRequests.table.change.from', 'From')}: {summary.fromChange?.oldRootCat}, {summary.fromChange?.oldLivelihoodCat}
                </Text>
                <Text {...styles.changeFromToText}>
                  {t('admin.reviewRequests.table.change.to', 'To')}: {summary.toChange?.newRootCat}, {summary.toChange?.newLivelihoodCat}
                </Text>
                <Text {...styles.changeFromToText}>
                  {t('admin.reviewRequests.table.change.withSubcat', 'with subcategory')}: {summary.keywords? summary.keywords.join(', '): '-' }
                </Text>
            </VStack>
          );
        }
        return <Text {...styles.cellMutedText}>-</Text>;
      },
    },
    {
      key: 'entityName',
      label: 'admin.reviewRequests.table.participant',
      flex: 1.4,
      align: 'left',
      mobileConfig: { showColumn: true, showLabel: true, leftRank: 1 },
      render: (row: ChangeRequestRecord) => (
        <Text {...styles.cellText}>{row.entityName || '-'}</Text>
      ),
    },
    {
      key: 'province',
      label: 'admin.reviewRequests.table.province',
      flex: 0.9,
      align: 'left',
      mobileConfig: { showColumn: true, showLabel: true, rightRank: 1 },
      render: (row: ChangeRequestRecord) => (
        <Text {...styles.cellMutedText}>{row.province || '-'}</Text>
      ),
    },
    {
      key: 'site',
      label: 'admin.reviewRequests.table.site',
      flex: 0.9,
      align: 'left',
      mobileConfig: { showColumn: true, showLabel: true, rightRank: 2 },
      render: (row: ChangeRequestRecord) => (
        <Text {...styles.cellMutedText}>{row.site || '-'}</Text>
      ),
    },
    {
      key: 'createdAt',
      label: 'admin.reviewRequests.table.submitted',
      flex: 1,
      align: 'left',
      mobileConfig: { showColumn: true, showLabel: true, rightRank: 3 },
      render: (row: ChangeRequestRecord) => (
        <Text {...styles.cellMutedText}>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </Text>
      ),
    },
  ];

  if (showActions) {
    columns.push({
      key: 'actions',
      label: 'admin.reviewRequests.table.actions',
      flex: 1.2,
      align: 'left',
      mobileConfig: { showColumn: true, showLabel: false, fullWidthRank: 3 },
      render: (row: ChangeRequestRecord) => {
        const isDeciding = decidingId === row._id;
        return (
          <HStack {...styles.actionsRow}>
            <Button
              {...styles.approveButton}
              isDisabled={isDeciding}
              onPress={() => onApprove(row)}
            >
              {isDeciding ? (
                <Loader size="small" color="$white" />
              ) : (
                <ButtonText {...styles.approveButtonText}>
                  {t('admin.reviewRequests.actions.approve', 'Approve')}
                </ButtonText>
              )}
            </Button>
            <Button
              {...styles.rejectButton}
              isDisabled={isDeciding}
              onPress={() => onReject(row)}
            >
              <ButtonText {...styles.rejectButtonText}>
                {t('admin.reviewRequests.actions.reject', 'Reject')}
              </ButtonText>
            </Button>
          </HStack>
        );
      },
    });
  }

  return columns;
};
