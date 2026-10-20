/**
 * Review Requests Screen
 *
 * Tenant-admin-only screen for reviewing and deciding on `changeRequests`
 * documents (pathway switch / dropout requests) submitted by Coaches.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VStack, HStack, Box, Text, useAlert, Modal } from '@ui';
import TitleHeader from '@components/TitleHeader';
import NotFound from '@components/NotFound';
import FilterButton from '@components/Filter';
import { TabButton } from '@components/Tabs';
import DataTable from '@components/DataTable';
import { useLanguage } from '@contexts/LanguageContext';
import { useIsTenantAdmin } from '@contexts/AuthContext';
import { useParticipantFilterOptions } from '@constants/ASSIGN_USERS_FILTERS';
import { getReviewRequestsColumns } from './ReviewRequestsTableConfig';
import { ReviewRequestsStyles as styles } from './Styles';
import {
  listChangeRequests,
  decideChangeRequest,
  ChangeRequestAction,
  ChangeRequestRecord,
  ChangeRequestStatus,
} from '../../services/changeRequestsService';

type TabKey = ChangeRequestStatus;

const DEFAULT_ACTION: ChangeRequestAction = 'USER_PROJECT_TEMPLATE_CHANGE';
const DEFAULT_PAGE_SIZE = 10;

// Pathway Switch is listed first (and has no placeholder set on this filter
// item) so FilterButton's "auto-select first item" behavior makes it the
// default selection, per the approved requirement.
const TYPE_FILTER_DATA = [
  { labelKey: 'admin.reviewRequests.filters.pathwaySwitch', value: 'USER_PROJECT_TEMPLATE_CHANGE' },
  { labelKey: 'admin.reviewRequests.filters.dropoutRequest', value: 'PROGRAM_USER_DROPPING_OUT' },
];
const showClearButton = false;
const ReviewRequestsScreen = (): React.JSX.Element => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const isTenantAdmin = useIsTenantAdmin();

  const [activeTab, setActiveTab] = useState<TabKey>('PENDING');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [rows, setRows] = useState<ChangeRequestRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmState, setConfirmState] = useState<{
    row: ChangeRequestRecord;
    decision: 'APPROVED' | 'REJECTED';
  } | null>(null);

  // Province/Site filter options + fetch, reused from AssignUsers' pattern.
  const { filters: provinceSiteFilters } = useParticipantFilterOptions(
    filterValues.filterByProvince,
    isTenantAdmin,
  );

  const filterOptions = useMemo(
    () => [
      {
        nameKey: 'admin.reviewRequests.filters.type',
        attr: 'action',
        type: 'select' as const,
        data: TYPE_FILTER_DATA,
      },
    ],
    [],
  );

  // FilterButton only reports a value once the user actually touches a
  // field, so the visually pre-selected "Pathway Switch" / "All Provinces" /
  // "All Sites" defaults must be resolved here before calling the API.
  const effectiveAction = useMemo(() => {
    const raw = filterValues.action ?? DEFAULT_ACTION;
    return raw === 'all' ? undefined : (raw as ChangeRequestAction);
  }, [filterValues.action]);

  const effectiveProvince = useMemo(() => {
    const raw = filterValues.filterByProvince;
    return raw && raw !== 'all-provinces' ? raw : undefined;
  }, [filterValues.filterByProvince]);

  const effectiveSite = useMemo(() => {
    const raw = filterValues.site;
    return raw && raw !== 'all-sites' ? raw : undefined;
  }, [filterValues.site]);

  // Reset to page 1 whenever the tab or any filter changes.
  useEffect(() => {
    setPage(1);
  }, [activeTab, effectiveAction, effectiveProvince, effectiveSite]);

  const fetchRequests = useCallback(async () => {
    if (!isTenantAdmin) return;
    setIsLoading(true);
    try {
      const response = await listChangeRequests({
        programId: process.env.GLOBAL_LC_PROGRAM_ID as string,
        status: activeTab,
        action: effectiveAction,
        province: effectiveProvince,
        site: effectiveSite,
        pageNo: page,
        pageSize,
      });
      setRows(response.data || []);
      setTotal(response.count || 0);
    } catch (error: any) {
      showAlert('error', error?.message || t('common.somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
    // showAlert/t are intentionally omitted: neither hook memoizes its
    // return value, so including them here would make fetchRequests (and
    // the effect below) re-run on every render instead of only when an
    // actual fetch parameter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTenantAdmin, activeTab, effectiveAction, effectiveProvince, effectiveSite, page, pageSize]);

  // refreshKey is bumped after a successful approve/reject to refetch the
  // current page without changing any other dependency.
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, refreshKey]);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilterValues(newFilters);
  }, []);

  // Approve/Reject buttons only open the confirmation dialog; the actual
  // decision API call is deferred to handleConfirmDecision, fired only
  // when the user presses "Yes, Continue".
  const handleApprove = useCallback(
    (row: ChangeRequestRecord) => setConfirmState({ row, decision: 'APPROVED' }),
    [],
  );
  const handleReject = useCallback(
    (row: ChangeRequestRecord) => setConfirmState({ row, decision: 'REJECTED' }),
    [],
  );
  const handleCancelDecision = useCallback(() => setConfirmState(null), []);

  const handleConfirmDecision = useCallback(async () => {
    if (!confirmState) return;
    const { row, decision } = confirmState;
    setDecidingId(row._id);
    try {
      await decideChangeRequest({ id: row._id, decision });
      showAlert(
        'success',
        decision === 'APPROVED'
          ? t('admin.reviewRequests.approveSuccess', 'Request approved successfully.')
          : t('admin.reviewRequests.rejectSuccess', 'Request rejected successfully.'),
      );
      setRefreshKey(k => k + 1);
      setConfirmState(null);
    } catch (error: any) {
      showAlert(
        'error',
        error?.message || t('admin.reviewRequests.decisionError', 'Could not update the request. Try again.'),
      );
    } finally {
      setDecidingId(null);
    }
  }, [confirmState, showAlert, t]);

  const columns = useMemo(
    () =>
      getReviewRequestsColumns({
        t,
        showActions: activeTab === 'PENDING',
        decidingId,
        onApprove: handleApprove,
        onReject: handleReject,
      }),
    [t, activeTab, decidingId, handleApprove, handleReject],
  );

  const tabs = useMemo(
    () => [
      { key: 'PENDING', label: 'admin.reviewRequests.tabs.pending', icon: 'Clock' },
      { key: 'APPROVED', label: 'admin.reviewRequests.tabs.approved', icon: 'CheckCircle' },
      { key: 'REJECTED', label: 'admin.reviewRequests.tabs.declined', icon: 'XCircle' },
    ],
    [],
  );

  // Defense in depth: sidebar already hides this menu item for non
  // tenant_admin users, but guard the screen directly in case of a direct
  // URL navigation.
  if (!isTenantAdmin) {
    return (
      <NotFound
        message={t('admin.reviewRequests.accessDenied', 'You do not have permission to view this page.')}
      />
    );
  }

  return (
    <VStack space="md" width="100%">
      <TitleHeader
        title="admin.menu.reviewRequests"
        description="admin.reviewRequestsDescription"
        bottom={
          <HStack space="md" alignItems="center" flexWrap="wrap" gap="$2">
            {tabs.map(tab => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={key => setActiveTab(key as TabKey)}
                iconSize={16}
              />
            ))}
          </HStack>
        }
      />

      <FilterButton data={filterOptions} showClearButton={showClearButton} onFilterChange={handleFilterChange} _container={styles.filterContainer} />

      <Box {...styles.tableWrapper}>
        <DataTable
          data={rows}
          columns={columns}
          getRowKey={(row: ChangeRequestRecord) => row._id}
          isLoading={isLoading}
          emptyMessage="admin.reviewRequests.table.noRequests"
          responsive
          pagination={{
            enabled: true,
            pageSize,
            maxPageNumbers: 5,
            showPageSizeSelector: true,
            pageSizeOptions: [10, 25, 50],
            serverSide: {
              count: page,
              total,
            },
          }}
          onPageChange={setPage}
          onPageSizeChange={(size: number) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Box>

      <Modal
        isOpen={!!confirmState}
        onClose={handleCancelDecision}
        onCancel={handleCancelDecision}
        onConfirm={handleConfirmDecision}
        confirmLoading={!!confirmState && decidingId === confirmState.row._id}
        size="sm"
        maxWidth={420}
        headerTitle={
          confirmState?.decision === 'APPROVED'
            ? t('admin.reviewRequests.confirm.approveTitle', 'Approve Request')
            : t('admin.reviewRequests.confirm.rejectTitle', 'Reject Request')
        }
        cancelButtonText={t('admin.reviewRequests.confirm.cancel', 'No, Cancel')}
        confirmButtonText={t('admin.reviewRequests.confirm.continue', 'Yes, Continue')}
      >
        <Text>
          {confirmState
            ? `${t('admin.reviewRequests.confirm.question', 'Do you want to')} ${
                confirmState.decision === 'APPROVED'
                  ? t('admin.reviewRequests.confirm.acceptWord', 'accept')
                  : t('admin.reviewRequests.confirm.rejectWord', 'reject')
              } ${t('admin.reviewRequests.confirm.theRequestFor', 'the request for')} ${
                confirmState.row.entityName ||
                confirmState.row.requestorName ||
                t('admin.reviewRequests.confirm.thisParticipant', 'this participant')
              }?`
            : ''}
        </Text>
      </Modal>
    </VStack>
  );
};

export default ReviewRequestsScreen;
