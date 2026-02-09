export const styles = {
    headerContainer: {
        mb: '$6',
        px: '$1',
    },
    headerTitleRow: {
        alignItems: 'flex-start' as const,
        mb: '$2',
        pt: '$1',
    },
    headerIconWrapper: {
        mt: '$1',
    },
    headerTitleText: {
        flex: 1,
    },
    headerSubtitleText: {
        mb: '$2',
    },
    tableInfoAlert: {
        bg: '$white',
        borderWidth: 1,
        borderColor: '$gray300',
        p: '$4',
        mb: '$4',
        borderRadius: '$sm',
    },
    tableContainer: {
        mx: '$2',
        borderWidth: 1,
        borderColor: '$gray300',
        borderRadius: '$lg',
        mb: '$8',
        pt: '$4',
        px: '$4',
    },
    tableHeader: {
        flexDirection: 'row' as const,
        bg: '$gray50',
        borderBottomWidth: 2,
        borderBottomColor: '$gray300',
        py: '$3',
        mx: '-$4',
        px: '$4',
    },
    headerCell: {
        flex: 1,
        minWidth: 100,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    fieldNameCell: {
        flex: 1.5,
        minWidth: 160,
        alignItems: 'flex-start' as const,
        justifyContent: 'center' as const,
    },
    roleBadge: {
        px: '$2',
        py: '$1',
        borderRadius: '$sm',
        mb: '$1',
    },
    roleBadgeText: {
        fontSize: '$xs',
        fontWeight: '$bold' as const,
        color: '$white',
        textAlign: 'center' as const,
    },
    roleSubtitle: {
        fontSize: '$xs',
        color: '$textSecondary',
        textAlign: 'center' as const,
    },
    tableRow: {
        flexDirection: 'row' as const,
        borderBottomWidth: 1,
        borderBottomColor: '$gray300',
        py: '$3',
        mx: '-$4',
        px: '$4',
        bg: '$white',
    },
    tableRowAlt: {
        bg: '$gray50',
    },
    fieldNameText: {
        fontSize: '$sm',
        color: '$textPrimary',
        fontWeight: '$medium' as const,
    },
    iconCell: {
        flex: 1,
        minWidth: 100,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    approvalBadge: {
        bg: '$warning500',
        px: '$2',
        py: '$1',
        borderRadius: '$sm',
    },
    approvalBadgeText: {
        fontSize: '$xs',
        fontWeight: '$semibold' as const,
        color: '$white',
    },
    legendInsideContainer: {
        pt: '$6',
        pb: '$4',
        mt: '$2',
    },
    legendTitle: {
        fontSize: '$md',
        fontWeight: '$semibold' as const,
        color: '$textPrimary',
        mb: '$3',
    },
    legendItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        mb: '$2',
        gap: '$2',
    },
    legendText: {
        fontSize: '$sm',
        color: '$textSecondary',
    },
    ruleItem: {
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
        mb: '$2',
        gap: '$2',
    },
    ruleBullet: {
        w: '$1',
        h: '$1',
        borderRadius: '$full',
        bg: '$textSecondary',
        mt: '$1.5',
    },
    ruleText: {
        flex: 1,
        fontSize: '$sm',
        color: '$textSecondary',
    },
    // Helper styles
    flexOne: {
        flex: 1,
    },
    marginBottom12: {
        mb: '$3',
    },
    dashText: {
        fontSize: '$sm',
        color: '$textSecondary',
    },
    tableInnerContainer: {
        minWidth: 760,
        flex: 1,
    },
} as const;