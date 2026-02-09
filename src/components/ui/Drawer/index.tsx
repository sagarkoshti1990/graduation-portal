import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Pressable,
} from '@gluestack-ui/themed';
import { Platform, Animated, Dimensions } from 'react-native';
import { drawerStyles } from './Styles';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    anchor?: 'left' | 'right';
}

const DRAWER_WIDTH = 300;
const { width: screenWidth } = Dimensions.get('window');

/**
 * Drawer component provides a smooth sliding overlay from the side.
 * Uses absolute positioning and Animated API for native performance and smooth transitions.
 */
export const Drawer: React.FC<DrawerProps> = ({
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
    }, [isOpen, anchor]);

    if (!shouldRender && !isOpen) return null;

    return (
        <Box
            {...drawerStyles.container}
            // @ts-ignore
            style={Platform.OS === 'web' ? { position: 'fixed' } : {}}
        >
            {/* Backdrop */}
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

            {/* Drawer Content */}
            <Animated.View
                style={[
                    drawerStyles.content(anchor, DRAWER_WIDTH),
                    {
                        transform: [{ translateX: slideAnim }],
                    }
                ]}
            >
                <Box flex={1} bg="$backgroundLight0">
                    {children}
                </Box>
            </Animated.View>
        </Box>
    );
};

export default Drawer;
