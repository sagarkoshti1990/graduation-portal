import { theme } from '@config/theme';

export const drawerStyles = {
    container: {
        justifyContent: 'flex-start' as const,
        margin: 0,
        width: '$full' as const,
        height: '$full' as const,
    },
    content: {
        height: '$full' as const,
        width: 300,
        maxWidth: '85%' as const,
        bg: '$backgroundLight0' as const,
        borderRadius: 0,
        padding: 0,
        sx: {
            '_web': {
                position: 'fixed' as const,
                left: 0,
                top: 0,
                height: '100vh',
            },
        },
    },
    backdrop: {
        bg: '$backgroundLight900',
        opacity: 0.5,
    },
    body: {
        flex: 1,
        padding: 0,
    },
};
