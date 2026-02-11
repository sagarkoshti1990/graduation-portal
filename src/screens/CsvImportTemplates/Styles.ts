export const csvImportStyles = {
    container: {
        flex: 1,
        bg: '$white' as const,
    },
    headerContainer: {
        space: 'xl' as const,
        mb: '$8' as const,
        mt: '$4' as const,
    },
    pageTitle: {
        size: 'xl' as const,
        mb: '$2' as const,
    },
    pageSubtitle: {
        size: 'md' as const,
        color: '$textSecondary' as const,
    },
    sectionContainer: {
        borderWidth: 1,
        borderColor: '$gray300' as const,
        borderRadius: '$md' as const,
        p: '$6' as const,
        mb: '$8' as const,
    },
    sectionTitle: {
        size: 'md' as const,
        mb: '$1' as const,
    },
    sectionSubtitle: {
        size: 'sm' as const,
        color: '$textSecondary' as const,
        mb: '$6' as const,
    },
    gridContainer: {
        flexWrap: 'wrap' as const,
        gap: '$4' as const,
        justifyContent: 'center' as const,
    },
    guidelinesContainer: {
        bg: '$gray50' as const,
        borderWidth: 1,
        borderColor: '$gray300' as const,
        borderRadius: '$md' as const,
        p: '$6' as const,
        mt: '$4' as const,
    },
    guidelinesHeader: {
        space: 'sm' as const,
        alignItems: 'center' as const,
        mb: '$4' as const,
    },
    guidelinesTitle: {
        size: 'sm' as const,
    },
    guidelinesList: {
        space: 'sm' as const,
    },
    guidelineItem: {
        space: 'sm' as const,
        alignItems: 'flex-start' as const,
    },
    bulletPoint: {
        w: '$1.5' as const,
        h: '$1.5' as const,
        borderRadius: '$full' as const,
        bg: '$textSecondary' as const,
        mt: '$2' as const,
    },
    guidelineText: {
        size: 'sm' as const,
        flex: 1,
    },
} as const;

export const templateCardStyles = {
    container: {
        w: '$full' as const,
        '$md-w': '31%',
        '$sm-minWidth': 280,
        mb: '$3' as const,
        bg: '$white' as const,
        borderRadius: '$md' as const,
        borderWidth: 1,
        borderColor: '$gray300' as const,
        p: '$3' as const,
        '$hover': {
            borderColor: '$primary500',
        },
    },
    contentVStack: {
        space: 'sm' as const,
        height: '100%',
    },
    headerHStack: {
        justifyContent: 'space-between' as const,
        alignItems: 'flex-start' as const,
    },
    title: {
        flex: 1,
        mr: '$2' as const,
        fontWeight: '$bold' as const,
        color: '$textPrimary' as const,
    },
    description: {
        mb: '$4' as const,
        color: '$textSecondary' as const,
    },
    buttonContainer: {
        mt: 'auto' as const,
    },
    downloadButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 1,
        borderColor: '$gray300' as const,
        borderRadius: '$sm' as const,
        bg: '$white' as const,
        py: '$2' as const,
        px: '$3' as const,
        '$hover': {
            bg: '$gray100',
        },
    },
    buttonText: {
        ml: '$2' as const,
        fontSize: '$sm' as const,
        fontWeight: '$medium' as const,
        color: '$textPrimary' as const,
    },
} as const;
