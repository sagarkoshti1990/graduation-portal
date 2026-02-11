import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
    Box,
    Pressable,
} from '@gluestack-ui/themed';
import { Platform, Animated, Dimensions } from 'react-native';
import { drawerStyles } from './Styles';

const DRAWER_WIDTH = 300;
const { width: screenWidth } = Dimensions.get('window');

interface DrawerContextType {
    isOpen: boolean;
    onClose: () => void;
    anchor: 'left' | 'right';
    slideAnim: Animated.Value;
    opacityAnim: Animated.Value;
}

const DrawerContext = createContext<DrawerContextType | null>(null);

const useDrawer = () => {
    const context = useContext(DrawerContext);
    if (!context) throw new Error('Drawer components must be used within a Drawer');
    return context;
};

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    anchor?: 'left' | 'right';
}

/**
 * Drawer component provides a smooth sliding overlay from the side.
 * Refactored to support Gluestack v2-like API: Backdrop, Content, Header, Body, Footer, CloseButton.
 */
export const Drawer: React.FC<DrawerProps> & {
    Backdrop: React.FC;
    Content: React.FC<{ children: React.ReactNode }>;
    Header: React.FC<{ children: React.ReactNode }>;
    Body: React.FC<{ children: React.ReactNode }>;
    Footer: React.FC<{ children: React.ReactNode }>;
    CloseButton: React.FC<{ children: React.ReactNode }>;
} = ({
    isOpen,
    onClose,
    children,
    anchor = 'left',
}) => {
        const slideAnim = useRef(new Animated.Value(anchor === 'left' ? -DRAWER_WIDTH : screenWidth)).current;
        const opacityAnim = useRef(new Animated.Value(0)).current;
        const [shouldRender, setShouldRender] = useState(isOpen);

        useEffect(() => {
            if (isOpen) {
                setShouldRender(true);
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 250,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                ]).start();
            } else {
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: anchor === 'left' ? -DRAWER_WIDTH : screenWidth,
                        duration: 250,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 250,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                ]).start(() => setShouldRender(false));
            }
        }, [isOpen, anchor, slideAnim, opacityAnim]);

        if (!shouldRender && !isOpen) return null;

        return (
            <DrawerContext.Provider value={{ isOpen, onClose, anchor, slideAnim, opacityAnim }}>
                <Box
                    {...drawerStyles.container}
                    // @ts-ignore
                    style={Platform.OS === 'web' ? { position: 'fixed' } : {}}
                >
                    {children}
                </Box>
            </DrawerContext.Provider>
        );
    };

export const DrawerBackdrop: React.FC = () => {
    const { onClose, opacityAnim } = useDrawer();
    return (
        <Animated.View
            style={[
                drawerStyles.backdrop,
                {
                    opacity: opacityAnim,
                }
            ]}
        >
            <Pressable onPress={onClose} flex={1} />
        </Animated.View>
    );
};

export const DrawerContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { anchor, slideAnim } = useDrawer();
    return (
        <Animated.View
            style={[
                drawerStyles.content(anchor, DRAWER_WIDTH),
                {
                    transform: [{ translateX: slideAnim }],
                }
            ]}
        >
            {children}
        </Animated.View>
    );
};

export const DrawerHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <Box {...drawerStyles.header}>
            {children}
        </Box>
    );
};

export const DrawerBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <Box {...drawerStyles.body}>
            {children}
        </Box>
    );
};

export const DrawerFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <Box {...drawerStyles.footer}>
            {children}
        </Box>
    );
};

export const DrawerCloseButton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { onClose } = useDrawer();
    return (
        <Pressable onPress={onClose} {...drawerStyles.closeButton}>
            {children}
        </Pressable>
    );
};

Drawer.Backdrop = DrawerBackdrop;
Drawer.Content = DrawerContent;
Drawer.Header = DrawerHeader;
Drawer.Body = DrawerBody;
Drawer.Footer = DrawerFooter;
Drawer.CloseButton = DrawerCloseButton;

export default Drawer;
