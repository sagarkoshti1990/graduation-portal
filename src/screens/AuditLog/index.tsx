import React, { useState } from 'react';
import { Text, VStack, HStack, Button, LucideIcon, Box  } from '@ui';
import { titleHeaderStyles } from '@components/TitleHeader/Styles';
import TitleHeader from '@components/TitleHeader';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import FilterButton from '@components/Filter';
import { AuditLogFilterOptions } from '@constants/AUDIT_LOG_FILTERS';
import DataTable from '@components/DataTable';
import { getAuditLogColumns } from './AuditLogTableConfig';
import { AUDIT_LOG_MOCK_DATA, AuditLogEntry } from '@constants/AUDIT_LOG_MOCK_DATA';
import logger from '@utils/logger';

const AuditLogScreen = () => {
  const { t } = useLanguage();
  const [auditLogEntries] = useState<AuditLogEntry[]>(AUDIT_LOG_MOCK_DATA);
  const columns = getAuditLogColumns();

  const handleRowClick = (entry: AuditLogEntry) => {
    // Handle row click if needed (logger is dev-only; log non-sensitive id only)
    logger.log('Clicked entry id:', entry.id);
  };

  return(
    <VStack space="md" width="100%">
      <TitleHeader
        title="admin.menu.auditLog"
        description="admin.auditLog.description"
        right={
          <HStack space="md" alignItems="center">
            <Button
              {...titleHeaderStyles.solidButton}
              onPress={() => {
                // Handle export logs
              }}
            >
              <HStack space="sm" alignItems="center">   
                <LucideIcon name="Download" size={16} color={theme.tokens.colors.white} />
                <Text {...titleHeaderStyles.solidButtonText}>
                  {t('admin.auditLog.actions.exportlogsCSV')}
                </Text>
              </HStack>
            </Button>
          </HStack>
        }
      />
      
      <FilterButton data={AuditLogFilterOptions} />

      <Box width="100%" mt="$6">
        <DataTable
          data={auditLogEntries}
          columns={columns}
          onRowClick={handleRowClick}
          isLoading={false}
          emptyMessage="admin.auditLog.table.noEntries"
          getRowKey={(entry) => entry.id}
          pagination={{
            enabled: true,
            pageSize: 10,
          }}
          responsive={true}
        />
      </Box>

    </VStack>
  );
};

export default AuditLogScreen;