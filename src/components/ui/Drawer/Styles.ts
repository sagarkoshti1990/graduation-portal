import { theme } from '@config/theme';

export const drawerStyles = {
    container: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    content: (anchor: 'left' | 'right', width: number) => ({
        position: 'absolute' as const,
        top: 0,
        [anchor]: 0,
        width: width,
        maxWidth: '85%' as const,
        height: '100%' as const,
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    }),
};
