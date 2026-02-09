import React from 'react';
import {
    Modal,
    ModalBackdrop,
    ModalContent,
    ModalBody,
} from '@gluestack-ui/themed';
import { drawerStyles } from './Styles';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    anchor?: 'left' | 'right';
}

/**
 * Drawer component provides a sliding overlay from the side.
 * Currently implemented using Modal with custom styles for left-aligned, full-height behavior.
 */
export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    children,
    anchor = 'left',
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            {...drawerStyles.container}
            // @ts-ignore - alignment depends on anchor
            alignItems={anchor === 'left' ? 'flex-start' : 'flex-end'}
        >
            <ModalBackdrop {...drawerStyles.backdrop} />
            <ModalContent {...drawerStyles.content}>
                <ModalBody {...drawerStyles.body}>
                    {children}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default Drawer;
