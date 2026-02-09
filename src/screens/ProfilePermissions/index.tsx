import React from 'react';
import { ScrollView } from 'react-native';
import { styles } from './Styles';
import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    LucideIcon,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import { PROFILE_PERMISSIONS_FIELDS, LEGEND_ITEMS, KEY_RULES, PermissionType } from '@constants/PROFILE_PERMISSIONS_DATA';

const ProfilePermissions = () => {
    const { t } = useLanguage();

    const renderPermissionIcon = (permission: PermissionType) => {
        if (permission === 'edit') {
            return <LucideIcon name="Pencil" size={16} color={theme.tokens.colors.success600} />;
        }
        return <LucideIcon name="Eye" size={16} color={theme.tokens.colors.textSecondary} />;
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <VStack {...styles.headerContainer}>
                <HStack space="sm" {...styles.headerTitleRow}>
                    <Box {...styles.headerIconWrapper}>
                        <LucideIcon name="ShieldCheck" size={28} color={theme.tokens.colors.primary500} />
                    </Box>
                    <Heading size="lg" {...styles.headerTitleText}>{t('admin.profilePermissionsPage.pageTitle')}</Heading>
                </HStack>
                <Text size="md" color="$textSecondary" {...styles.headerSubtitleText}>{t('admin.profilePermissionsPage.pageSubtitle')}</Text>
            </VStack>

            {/* Permissions Table - Single Container */}
            <Box {...styles.tableContainer}>
                {/* Info Alert - Inside Table */}
                <Box {...styles.tableInfoAlert}>
                    <HStack space="sm" alignItems="flex-start">
                        <LucideIcon name="Info" size={20} color={theme.tokens.colors.textSecondary} />
                        <Text fontSize="$sm" color="$textPrimary" flex={1}>
                            {t('admin.profilePermissionsPage.infoAlert')}
                        </Text>
                    </HStack>
                </Box>

                {/* Scrollable Table Content */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 1 }}
                    style={{ marginHorizontal: -16, marginBottom: 0 }}
                >
                    <Box {...styles.tableInnerContainer}>
                        {/* Table Header */}
                        <Box {...styles.tableHeader}>
                            <Box {...styles.fieldNameCell}>
                                <Text fontSize="$xs" fontWeight="$semibold" color="$textPrimary">
                                    {t('admin.profilePermissionsPage.tableHeaders.profileField')}
                                </Text>
                            </Box>

                            {/* Admin Column */}
                            <Box {...styles.headerCell}>
                                <Box {...styles.roleBadge} bg="$error900">
                                    <Text {...styles.roleBadgeText}>{t('admin.profilePermissionsPage.tableHeaders.admin')}</Text>
                                </Box>
                                <Text {...styles.roleSubtitle}>{t('admin.profilePermissionsPage.tableHeaders.adminSubtitle')}</Text>
                            </Box>

                            {/* Supervisor Column */}
                            <Box {...styles.headerCell}>
                                <Box {...styles.roleBadge} bg="$error600">
                                    <Text {...styles.roleBadgeText}>{t('admin.profilePermissionsPage.tableHeaders.supervisor')}</Text>
                                </Box>
                                <Text {...styles.roleSubtitle}>{t('admin.profilePermissionsPage.tableHeaders.supervisorSubtitle')}</Text>
                            </Box>

                            {/* LC Column */}
                            <Box {...styles.headerCell}>
                                <Box {...styles.roleBadge} bg="$gray600">
                                    <Text {...styles.roleBadgeText}>{t('admin.profilePermissionsPage.tableHeaders.lc')}</Text>
                                </Box>
                                <Text {...styles.roleSubtitle}>{t('admin.profilePermissionsPage.tableHeaders.lcSubtitle')}</Text>
                            </Box>

                            {/* Participant Column */}
                            <Box {...styles.headerCell}>
                                <Text fontSize="$xs" fontWeight="$semibold" color="$textPrimary">
                                    {t('admin.profilePermissionsPage.tableHeaders.participant')}
                                </Text>
                                <Text {...styles.roleSubtitle}>{t('admin.profilePermissionsPage.tableHeaders.participantSubtitle')}</Text>
                            </Box>

                            {/* Approval Required Column */}
                            <Box {...styles.headerCell}>
                                <Text fontSize="$xs" fontWeight="$semibold" color="$textPrimary">
                                    {t('admin.profilePermissionsPage.tableHeaders.approvalRequired')}
                                </Text>
                            </Box>
                        </Box>

                        {/* Table Rows */}
                        {PROFILE_PERMISSIONS_FIELDS.map((field, index) => (
                            <Box key={field.field} {...styles.tableRow} {...(index % 2 === 1 && styles.tableRowAlt)}>
                                <Box {...styles.fieldNameCell}>
                                    <Text {...styles.fieldNameText}>
                                        {t(`admin.profilePermissionsPage.fields.${field.field}`)}
                                    </Text>
                                </Box>

                                <Box {...styles.iconCell}>{renderPermissionIcon(field.admin)}</Box>
                                <Box {...styles.iconCell}>{renderPermissionIcon(field.supervisor)}</Box>
                                <Box {...styles.iconCell}>{renderPermissionIcon(field.lc)}</Box>
                                <Box {...styles.iconCell}>{renderPermissionIcon(field.participant)}</Box>

                                <Box {...styles.iconCell}>
                                    {field.approval ? (
                                        <Box {...styles.approvalBadge}>
                                            <Text {...styles.approvalBadgeText}>
                                                {t(`admin.profilePermissionsPage.approvalBadges.${field.approval}`)}
                                            </Text>
                                        </Box>
                                    ) : (
                                        <Text {...styles.dashText}>—</Text>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </ScrollView>

                {/* Legend and Key Rules - Inside Same Container */}
                <Box {...styles.legendInsideContainer}>
                    <HStack space="lg" alignItems="flex-start">
                        {/* Legend */}
                        <VStack {...styles.flexOne}>
                            <HStack space="sm" alignItems="center" {...styles.marginBottom12}>
                                <LucideIcon name="Info" size={20} color={theme.tokens.colors.textPrimary} />
                                <Text {...styles.legendTitle}>{t('admin.profilePermissionsPage.legend.title')}</Text>
                            </HStack>
                            <VStack space="xs">
                                {LEGEND_ITEMS.map((item, index) => (
                                    <HStack key={index} {...styles.legendItem}>
                                        <LucideIcon name={item.icon} size={16} color={item.color} />
                                        <Text {...styles.legendText}>{t(item.labelKey)}</Text>
                                    </HStack>
                                ))}
                            </VStack>
                        </VStack>

                        {/* Key Rules */}
                        <VStack {...styles.flexOne}>
                            <HStack space="sm" alignItems="center" {...styles.marginBottom12}>
                                <LucideIcon name="Key" size={20} color={theme.tokens.colors.textPrimary} />
                                <Text {...styles.legendTitle}>{t('admin.profilePermissionsPage.keyRules.title')}</Text>
                            </HStack>
                            <VStack space="xs">
                                {KEY_RULES.map((ruleKey, index) => (
                                    <HStack key={index} {...styles.ruleItem}>
                                        <Box {...styles.ruleBullet} />
                                        <Text {...styles.ruleText}>{t(ruleKey)}</Text>
                                    </HStack>
                                ))}
                            </VStack>
                        </VStack>
                    </HStack>
                </Box>
            </Box>
        </ScrollView>
    );
};

export default ProfilePermissions;