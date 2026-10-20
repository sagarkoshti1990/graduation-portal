import React from 'react';
import ViewDetailsModal from './ViewDetailsModal';
import RequestInfoModal from './RequestInfoModal';
import DeclineModal from './DeclineModal';
import AcceptAndScheduleModal from './AcceptAndScheduleModal';
import {
  acceptAndScheduleSupportRequest,
  requestMoreInfoForSupportRequest,
  declineSupportRequest,
} from '../../../../../services/serviceProvider';

export type SupportRequestModalType =
  | 'view_details'
  | 'request_info'
  | 'decline'
  | 'accept_schedule'
  | null;

export interface SupportRequestsModalsProps {
  selectedItem: any;
  activeModal: SupportRequestModalType;
  onClose: () => void;
  onOpenModal: (type: SupportRequestModalType, item?: any) => void;
  onSuccess?: () => void;
}

export default function SupportRequestsModals({
  selectedItem,
  activeModal,
  onClose,
  onOpenModal,
  onSuccess,
}: SupportRequestsModalsProps): React.JSX.Element {
  const handleRequestInfoSubmit = async (message: string) => {
    if (selectedItem?.id) {
      const res = await requestMoreInfoForSupportRequest({
        requestId: selectedItem.id,
        message,
      });
      if (res.success) {
        onClose();
      } else {
        throw new Error(res.message || 'Failed to request additional information');
      }
    }
  };

  const handleDeclineSubmit = async (reason: string, details: string) => {
    try {
      if (selectedItem?.id) {
        await declineSupportRequest({
          requestId: selectedItem.id,
          reason,
          details,
        });
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error('[SupportRequestsModals] Error submitting Decline:', error);
    }
  };

  const SUPPORT_OFFERING_TYPE_BY_TAB: Record<string, 'training' | 'additional_service' | 'asset'> = {
    sessions: 'training',
    additional_services: 'additional_service',
    assets: 'asset',
  };

  const handleAcceptScheduleSubmit = async (data: any) => {
    try {
      if (selectedItem?.id) {
        await acceptAndScheduleSupportRequest({
          requestId: selectedItem.id,
          support_offering_type: SUPPORT_OFFERING_TYPE_BY_TAB[selectedItem?.type],
          ...data,
        });
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error('[SupportRequestsModals] Error submitting Accept & Schedule:', error);
    }
  };

  return (
    <>
      {/* View Full Details Modal */}
      <ViewDetailsModal
        isOpen={activeModal === 'view_details'}
        onClose={onClose}
        item={selectedItem}
        onRequestInfo={() => onOpenModal('request_info', selectedItem)}
        onDecline={() => onOpenModal('decline', selectedItem)}
        onAcceptRequest={() => onOpenModal('accept_schedule', selectedItem)}
      />

      {/* Request Info Modal */}
      <RequestInfoModal
        isOpen={activeModal === 'request_info'}
        onClose={onClose}
        item={selectedItem}
        onSubmit={handleRequestInfoSubmit}
      />

      {/* Decline Modal */}
      <DeclineModal
        isOpen={activeModal === 'decline'}
        onClose={onClose}
        item={selectedItem}
        onSubmit={handleDeclineSubmit}
      />

      {/* Accept & Schedule Modal */}
      <AcceptAndScheduleModal
        isOpen={activeModal === 'accept_schedule'}
        onClose={onClose}
        item={selectedItem}
        onSubmit={handleAcceptScheduleSubmit}
      />
    </>
  );
}
