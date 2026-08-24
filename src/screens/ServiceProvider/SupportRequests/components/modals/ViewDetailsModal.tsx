import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import modalStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';
import cardStyles from '../../styles';

const BASE_PATH = 'supportProvider.supportRequests';

export interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onRequestInfo?: () => void;
  onDecline?: () => void;
  onAcceptRequest?: () => void;
}

export default function ViewDetailsModal({
  isOpen,
  onClose,
  item,
  onRequestInfo,
  onDecline,
  onAcceptRequest,
}: ViewDetailsModalProps): React.JSX.Element {
  const { t } = useLanguage();

  if (!isOpen || !item) return <></>;

  const hasPreferredInfo =
    item?.type === 'Training' ||
    !!item?.preferredDate ||
    !!item?.preferredTime ||
    !!item?.preferredLocation;

  const title = item?.title || '';
  const status = item?.status || 'Pending';
  const categoryTag = item?.type || (hasPreferredInfo ? 'Training' : 'Service/Asset');

  const coachName = item?.coach;
  const hubName = item?.hub;
  const email = item?.email;
  const phone = item?.phone;

  const participantsCount = `${item?.participants ?? 0} participants`;
  const province = item?.province || item?.location;
  const category = item?.category;

  const justification = item?.justification;
  const participantDetails = item?.participantDetails;
  const specialRequirements = item?.specialRequirements;

  const isDeclined = item?.status?.toLowerCase() === 'declined';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...modalStyles.viewDetailsModalProps}
      headerContent={
        <VStack {...modalStyles.modalColFlex1}>
          <Text {...modalStyles.viewDetailsTitleText}>
            {title}
          </Text>
          <HStack {...modalStyles.labelRow}>
            {/* Status Badge */}
            <Box {...modalStyles.statusBadgePending}>
              <Text {...modalStyles.statusTextPending}>
                {status}
              </Text>
            </Box>

            {/* Category/Type Tag Badge */}
            <Box {...modalStyles.categoryBadge}>
              <Text {...modalStyles.categoryText}>
                {categoryTag}
              </Text>
            </Box>
          </HStack>
        </VStack>
      }
      footerContent={
        isDeclined ? null : (
          <HStack {...modalStyles.modalFooterRow}>
            {/* Request Info Button */}
            <Pressable
              onPress={() => {
                onClose();
                onRequestInfo?.();
              }}
              {...modalStyles.btnViewDetailsRequestInfo}
            >
              <HStack {...modalStyles.buttonRowMd}>
                <LucideIcon name="MessageSquare" {...modalStyles.iconDetails} />
                <Text {...modalStyles.textBtnRequestInfo}>
                  {t(`${BASE_PATH}.buttonTexts.requestInfo`)}
                </Text>
              </HStack>
            </Pressable>

            {/* Decline Button */}
            <Pressable
              onPress={() => {
                onClose();
                onDecline?.();
              }}
              {...modalStyles.btnViewDetailsDecline}
            >
              <HStack {...modalStyles.buttonRowMd}>
                <LucideIcon name="X" {...modalStyles.iconDecline} />
                <Text {...modalStyles.textDecline}>
                  {t(`${BASE_PATH}.buttonTexts.decline`)}
                </Text>
              </HStack>
            </Pressable>

            {/* Accept Request Button */}
            <Pressable
              onPress={() => {
                onClose();
                onAcceptRequest?.();
              }}
              {...modalStyles.btnViewDetailsAccept}
            >
              <HStack {...modalStyles.buttonRowMd}>
                <LucideIcon name="CheckCircle" {...modalStyles.iconAccept} />
                <Text {...modalStyles.textAccept}>
                  {t(`${BASE_PATH}.buttonTexts.acceptRequest`)}
                </Text>
              </HStack>
            </Pressable>
          </HStack>
        )
      }
    >
      <VStack {...modalStyles.viewDetailsBodyVStack}>
        {/* Coach Information */}
        <VStack {...modalStyles.modalColFullWidth}>
          <Text {...modalStyles.sectionHeadingText}>
            {t(`${BASE_PATH}.titles.coachInformation`)}
          </Text>
          <Box {...modalStyles.coachInfoBox}>
            <VStack {...modalStyles.coachInfoVStack} {...modalStyles.coachInfoVStack1} >
              <HStack {...modalStyles.coachInfoRow}>
                <LucideIcon name="User" {...modalStyles.iconCoachMeta} />
                <Text {...modalStyles.textCoachName}>
                  {coachName}
                </Text>
              </HStack>

              <HStack {...modalStyles.coachInfoRow}>
                <LucideIcon name="Building2" {...modalStyles.iconCoachMeta} />
                <Text {...modalStyles.textHubName}>
                  {hubName}
                </Text>
              </HStack>

              <HStack {...modalStyles.coachInfoRow}>
                <LucideIcon name="Mail" {...modalStyles.iconContact} />
                <Text {...modalStyles.textContact}>
                  {email || '-'}
                </Text>
              </HStack>

              <HStack {...modalStyles.coachInfoRow}>
                <LucideIcon name="Phone" {...modalStyles.iconContact} />
                <Text {...modalStyles.textContact}>
                  {phone || '-'}
                </Text>
              </HStack>
            </VStack>
          </Box>
        </VStack>

        {/* Request Details */}
        <VStack {...modalStyles.modalColFullWidth}>
          <Text {...modalStyles.sectionHeadingText}>
            {t(`${BASE_PATH}.titles.requestDetails`)}
          </Text>
          <VStack {...modalStyles.coachInfoVStack}>
            {hasPreferredInfo ? (
              /* Training & Sessions or Extended Details Grid */
              <>
                <HStack {...modalStyles.modalRowFullWidth}>
                  <Box {...modalStyles.gridCardBox} {...modalStyles.coachInfoVStack1} >
                    <Text {...modalStyles.gridCardLabel}>
                      {t(`${BASE_PATH}.labels.participants`)}
                    </Text>
                    <Text {...modalStyles.gridCardValue}>
                      {participantsCount}
                    </Text>
                  </Box>

                  <Box {...modalStyles.gridCardBox} {...modalStyles.coachInfoVStack1} >
                    <Text {...modalStyles.gridCardLabel}>
                      {t(`${BASE_PATH}.labels.preferredDate`)}
                    </Text>
                    <Text {...modalStyles.gridCardValue}>
                      {item?.preferredDate || 'N/A'}
                    </Text>
                  </Box>
                </HStack>

                <HStack {...modalStyles.modalRowFullWidth}>
                  <Box {...modalStyles.gridCardBox} {...modalStyles.coachInfoVStack1} >
                    <Text {...modalStyles.gridCardLabel}>
                      {t(`${BASE_PATH}.labels.preferredTime`)}
                    </Text>
                    <Text {...modalStyles.gridCardValue}>
                      {item?.preferredTime || 'N/A'}
                    </Text>
                  </Box>

                  <Box {...modalStyles.gridCardBox} {...modalStyles.coachInfoVStack1} >
                    <Text {...modalStyles.gridCardLabel}>
                      {t(`${BASE_PATH}.labels.preferredLocation`)}
                    </Text>
                    <Text {...modalStyles.gridCardValue}>
                      {item?.preferredLocation || 'N/A'}
                    </Text>
                  </Box>
                </HStack>

                <HStack {...modalStyles.modalRowFullWidth}>
                  <Box {...modalStyles.gridCardBox} {...modalStyles.coachInfoVStack1} >
                    <Text {...modalStyles.gridCardLabel}>
                      {t(`${BASE_PATH}.labels.province`)}
                    </Text>
                    <Text {...modalStyles.gridCardValue}>
                      {province}
                    </Text>
                  </Box>

                  <Box {...modalStyles.gridCardBox} {...modalStyles.coachInfoVStack1} >
                    <Text {...modalStyles.gridCardLabel}>
                      {t(`${BASE_PATH}.labels.category`)}
                    </Text>
                    <Text {...modalStyles.gridCardValue}>
                      {category}
                    </Text>
                  </Box>
                </HStack>
              </>
            ) : (
              /* Standard Service / Asset Grid (3 fields) */
              <>
                <HStack {...modalStyles.modalRowFullWidth}>
                  <Box {...modalStyles.gridCardBox} {...modalStyles.coachInfoVStack1} >
                    <Text {...modalStyles.gridCardLabel}>
                      {t(`${BASE_PATH}.labels.participants`)}
                    </Text>
                    <Text {...modalStyles.gridCardValue}>
                      {participantsCount}
                    </Text>
                  </Box>

                  <Box {...modalStyles.gridCardBox} {...modalStyles.coachInfoVStack1} >
                    <Text {...modalStyles.gridCardLabel}>
                      {t(`${BASE_PATH}.labels.province`)}
                    </Text>
                    <Text {...modalStyles.gridCardValue}>
                      {province}
                    </Text>
                  </Box>
                </HStack>

                <Box {...modalStyles.gridCardBoxFullWidth} {...modalStyles.coachInfoVStack1} >
                  <Text {...modalStyles.gridCardLabel}>
                    {t(`${BASE_PATH}.labels.category`)}
                  </Text>
                  <Text {...modalStyles.gridCardValue}>
                    {category}
                  </Text>
                </Box>
              </>
            )}
          </VStack>
        </VStack>

        {/* Request Justification */}
        {justification && (
          <VStack {...modalStyles.modalColFullWidth}>
            <Text {...modalStyles.sectionHeadingText}>
              {t(`${BASE_PATH}.labels.requestJustification`)}
            </Text>
            <Box {...modalStyles.justificationBox} {...modalStyles.coachInfoVStack1} >
              <Text {...modalStyles.justificationText}>
                {justification}
              </Text>
            </Box>
          </VStack>
        )}

        {/* Participant Details */}
        {participantDetails && (
          <VStack {...modalStyles.modalColFullWidth}>
            <Text {...modalStyles.sectionHeadingText}>
              {t(`${BASE_PATH}.labels.participantDetails`)}
            </Text>
            <Box {...modalStyles.justificationBox} {...modalStyles.coachInfoVStack1} >
              <Text {...modalStyles.justificationText}>
                {participantDetails}
              </Text>
            </Box>
          </VStack>
        )}

        {/* Special Requirements */}
        {specialRequirements && (
          <VStack {...modalStyles.modalColFullWidth}>
            <Text {...modalStyles.sectionHeadingText}>
              {t(`${BASE_PATH}.labels.specialRequirements`)}
            </Text>
            <Box {...modalStyles.specialReqBox}>
              <HStack {...modalStyles.coachInfoRow}>
                <LucideIcon name="AlertCircle" {...modalStyles.iconSpecialReq} />
                <Text {...modalStyles.textSpecialReq}>
                  {specialRequirements}
                </Text>
              </HStack>
            </Box>
          </VStack>
        )}
      </VStack>
    </Modal>
  );
}
