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
    try {
      console.log('[SupportRequestsModals] Submitting Request Info for ID:', selectedItem?.id, 'Message:', message);
      if (selectedItem?.id) {
        const res = await requestMoreInfoForSupportRequest({
          requestId: selectedItem.id,
          message,
        });
        console.log('[SupportRequestsModals] Request Info Response:', res);
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error('[SupportRequestsModals] Error submitting Request Info:', error);
    }
  };

  const handleDeclineSubmit = async (reason: string, details: string) => {
    try {
      console.log('[SupportRequestsModals] Submitting Decline for ID:', selectedItem?.id, 'Reason:', reason, 'Details:', details);
      if (selectedItem?.id) {
        const res = await declineSupportRequest({
          requestId: selectedItem.id,
          reason,
          details,
        });
        console.log('[SupportRequestsModals] Decline Response:', res);
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error('[SupportRequestsModals] Error submitting Decline:', error);
    }
  };

  const handleAcceptScheduleSubmit = async (data: any) => {
    try {
      console.log('[SupportRequestsModals] Submitting Accept & Schedule for ID:', selectedItem?.id, 'Payload:', data);
      if (selectedItem?.id) {
        const res = await acceptAndScheduleSupportRequest({
          requestId: selectedItem.id,
          ...data,
        });
        console.log('[SupportRequestsModals] Accept & Schedule Response:', res);
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
