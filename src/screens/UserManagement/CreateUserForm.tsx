import React, { useRef, useEffect } from 'react';
import { VStack, HStack, Text, Box, Input, Pressable, Button, ButtonText } from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import DatePicker from '@components/ui/Inputs/DatePicker';
import { FastInputField } from './index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { styles } from './Styles';

interface CreateUserFormProps {
  isMobile: boolean;
  t: any;
  roles: any[];
  provinces: any[];
  sites: any[];
  genders: any[];
  organisations: any[];
  positions: any[];
  COUNTRY_CODES: any[];
  getCreateField: (field: string) => any;
  handleCreateFieldChange: (field: string, value: any) => void;
  getCreateError: (field: string) => string | undefined;
  isCreateUserSubmitting: boolean;
  showCreateUserPassword: boolean;
  setShowCreateUserPassword: (show: boolean) => void;
  isCreateUserModalOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  isMobile,
  t,
  roles,
  provinces,
  sites,
  genders,
  organisations,
  positions,
  COUNTRY_CODES,
  getCreateField,
  handleCreateFieldChange,
  getCreateError,
  isCreateUserSubmitting,
  showCreateUserPassword,
  setShowCreateUserPassword,
  isCreateUserModalOpen,
  onClose,
  onSubmit,
}) => {
  const firstNameRef = useRef<any>(null);

  useEffect(() => {
    if (isCreateUserModalOpen) {
      // Auto-focus First Name input when modal opens
      const timer = setTimeout(() => {
        firstNameRef.current?.focus?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCreateUserModalOpen]);

  // Determine selected role type for conditional field visibility
  const roleId = getCreateField('roleId');
  const selRole = roles.find(r => r.id.toString() === roleId);
  const roleTitle = (selRole?.title?.toLowerCase() || '');
  const roleLabel = (selRole?.label?.toLowerCase() || '');

  const isSupervisorOrLC = ['supervisor', 'org_admin', 'lc', 'linkage champion'].some(
    k => roleTitle.includes(k) || roleLabel.includes(k)
  );
  const isParticipant = ['participant', 'user'].some(
    k => roleTitle.includes(k) || roleLabel.includes(k)
  );
  // Show additional fields for any valid role selection (Supervisor, LC, or Participant)

  return (
    <VStack key={isCreateUserModalOpen ? 'open' : 'closed'} space="md" width="100%">
      {/* Personal Information */}
      <VStack space="sm">
        <HStack space="xs" alignItems="center">
          <LucideIcon name="User" size={16} color="$textMutedForeground" />
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
            {t('admin.users.createUser.personalInformation') || 'Personal Information'}
          </Text>
        </HStack>

        <HStack space="md" flexDirection={isMobile ? 'column' : 'row'}>
          <VStack space="xs" flex={1}>
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.firstName') || 'First Name'} *
            </Text>
            <Input 
              {...styles.createUserFormInput} 
              isInvalid={!!getCreateError('firstName')} 
              isDisabled={isCreateUserSubmitting}
            >
              <FastInputField
                ref={firstNameRef}
                placeholder={t('admin.users.createUser.firstNamePlaceholder') || 'Enter first name'}
                value={getCreateField('firstName')}
                onChangeText={(text: string) => handleCreateFieldChange('firstName', text)}
              />
            </Input>
            {getCreateError('firstName') && <Text color="$error600" fontSize="$xs">{getCreateError('firstName')}</Text>}
          </VStack>
          <VStack space="xs" flex={1}>
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.lastName') || 'Last Name'} *
            </Text>
            <Input {...styles.createUserFormInput} isInvalid={!!getCreateError('lastName')} isDisabled={isCreateUserSubmitting}>
              <FastInputField
                placeholder={t('admin.users.createUser.lastNamePlaceholder') || 'Enter last name'}
                value={getCreateField('lastName')}
                onChangeText={(text: string) => handleCreateFieldChange('lastName', text)}
              />
            </Input>
            {getCreateError('lastName') && <Text color="$error600" fontSize="$xs">{getCreateError('lastName')}</Text>}
          </VStack>
        </HStack>

        <VStack space="xs" width={isMobile ? '100%' : '100%'}>
          <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
            {t('admin.users.createUser.email') || 'Email Address'} *
          </Text>
          <Input {...styles.createUserFormInput} isInvalid={!!getCreateError('email')} isDisabled={isCreateUserSubmitting} alignItems="center">
            <Box pr="$2">
              <LucideIcon name="Mail" size={16} color="$textMutedForeground" />
            </Box>
            <FastInputField
              placeholder={t('admin.users.createUser.emailPlaceholder') || 'user@skillssa.co.za'}
              value={getCreateField('email')}
              onChangeText={(text: string) => handleCreateFieldChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Input>
          {getCreateError('email') && <Text color="$error600" fontSize="$xs">{getCreateError('email')}</Text>}
        </VStack>

        <HStack space="md" flexDirection={isMobile ? 'column' : 'row'}>
          <VStack space="xs" flex={1}>
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.countryCode') || 'Country Code'}
            </Text>
            <Box>
              <Select
                {...styles.createUserFormSelect}
                options={COUNTRY_CODES}
                value={getCreateField('countryCode')}
                onChange={(val) => handleCreateFieldChange('countryCode', val)}
                placeholder="+27"
                disabled={isCreateUserSubmitting}
                searchable={true}
              />
            </Box>
          </VStack>
          <VStack space="xs" flex={1}>
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.phoneNumber') || 'Phone Number'}
            </Text>
            <Input {...styles.createUserFormInput} isDisabled={isCreateUserSubmitting}>
              <FastInputField
                placeholder={t('admin.users.createUser.phoneNumberPlaceholder') || '000 000 000'}
                value={getCreateField('phoneNumber')}
                onChangeText={(text: string) => handleCreateFieldChange('phoneNumber', text)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </Input>
            {getCreateError('phoneNumber') && <Text color="$error600" fontSize="$xs">{getCreateError('phoneNumber')}</Text>}
          </VStack>
        </HStack>

        <HStack space="md" flexDirection={isMobile ? 'column' : 'row'}>
          <VStack space="xs" flex={1}>
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.alternativeCountryCode') || 'Alt Country Code'}
            </Text>
            <Box>
              <Select
                {...styles.createUserFormSelect}
                options={COUNTRY_CODES}
                value={getCreateField('alternativePhoneCode')}
                onChange={(val) => handleCreateFieldChange('alternativePhoneCode', val)}
                placeholder="+27"
                disabled={isCreateUserSubmitting}
                searchable={true}
              />
            </Box>
          </VStack>
          <VStack space="xs" flex={1}>
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.alternativePhone') || 'Alternative Phone'}
            </Text>
            <Input {...styles.createUserFormInput} isInvalid={!!getCreateError('alternativePhone')} isDisabled={isCreateUserSubmitting}>
              <FastInputField
                placeholder={t('admin.users.createUser.alternativePhonePlaceholder') || '000 000 000'}
                value={getCreateField('alternativePhone')}
                onChangeText={(text: string) => handleCreateFieldChange('alternativePhone', text)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </Input>
            {getCreateError('alternativePhone') && <Text color="$error600" fontSize="$xs">{getCreateError('alternativePhone')}</Text>}
          </VStack>
        </HStack>
      </VStack>

      {/* Role & Permissions */}
      <VStack space="sm">
        <HStack space="xs" alignItems="center">
          <LucideIcon name="Shield" size={16} color="$textMutedForeground" />
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
            {t('admin.users.createUser.roleAndPermissions') || 'Role & Permissions'}
          </Text>
        </HStack>
        <VStack space="xs">
          <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
            {t('admin.users.createUser.role') || 'Role'} *
          </Text>
          <Box zIndex={1000}>
            <Select
              {...styles.createUserFormSelect}
              options={[
                { value: '', label: t('admin.users.createUser.rolePlaceholder') || 'Select user role' },
                ...roles.filter(r => (r.label || r.title)?.toLowerCase() !== 'admin' && (r.label || r.title)?.toLowerCase() !== 'brac admin').map(r => ({ value: r.id.toString(), label: r.label || r.title }))
              ]}
              value={getCreateField('roleId')}
              onChange={(val) => handleCreateFieldChange('roleId', val)}
              placeholder={t('admin.users.createUser.rolePlaceholder') || 'Select user role'}
              disabled={isCreateUserSubmitting}
            />
          </Box>
          {getCreateError('roleId') && <Text color="$error600" fontSize="$xs">{getCreateError('roleId')}</Text>}
        </VStack>
      </VStack>

      {/* Additional Information */}
      <VStack space="sm">
          <HStack space="xs" alignItems="center">
            <LucideIcon name="FileText" size={16} color="$textMutedForeground" />
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
              {t('admin.users.createUser.additionalInformation') || 'Additional Information'}
            </Text>
          </HStack>

          <HStack space="md" flexDirection={isMobile ? 'column' : 'row'}>
            <VStack space="xs" flex={1}>
              <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                {t('admin.users.createUser.gender') || 'Gender'} *
              </Text>
              <Box>
                <Select
                  {...styles.createUserFormSelect}
                  options={[
                    { value: '', label: 'Select gender' },
                    ...genders.map(g => ({ value: g._id, label: g.name }))
                  ]}
                  value={getCreateField('gender')}
                  onChange={(val) => handleCreateFieldChange('gender', val)}
                  placeholder="Select gender"
                  disabled={isCreateUserSubmitting}
                />
              </Box>
              {getCreateError('gender') && <Text color="$error600" fontSize="$xs">{getCreateError('gender')}</Text>}
            </VStack>
            <VStack space="xs" flex={1}>
              <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                {t('admin.users.createUser.dob') || 'DOB'} *
              </Text>
              <Box zIndex={999}>
                <DatePicker
                  {...styles.createUserFormInput}
                  placeholder="YYYY_MM_DD"
                  value={getCreateField('dob') ? getCreateField('dob').replace(/_/g, '-') : ''}
                  onChange={(date: string) => handleCreateFieldChange('dob', date.replace(/-/g, '_'))}
                />
              </Box>
              {getCreateError('dob') && <Text color="$error600" fontSize="$xs">{getCreateError('dob')}</Text>}
            </VStack>
          </HStack>

          <VStack space="xs">
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.username') || 'Username'} *
            </Text>
            <Input {...styles.createUserFormInput} isInvalid={!!getCreateError('username')} isDisabled={isCreateUserSubmitting}>
              <FastInputField
                placeholder="Enter username"
                value={getCreateField('username')}
                onChangeText={(text: string) => handleCreateFieldChange('username', text)}
              />
            </Input>
            {getCreateError('username') && <Text color="$error600" fontSize="$xs">{getCreateError('username')}</Text>}
          </VStack>

          <HStack space="md" flexDirection={isMobile ? 'column' : 'row'}>
            <VStack space="xs" flex={1}>
              <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                {t('admin.users.createUser.password') || 'Password'} *
              </Text>
              <Box position="relative">
                <Input {...styles.createUserFormInput} isInvalid={!!getCreateError('password')} isDisabled={isCreateUserSubmitting}>
                  <FastInputField
                    placeholder="Enter password"
                    value={getCreateField('password')}
                    onChangeText={(text: string) => handleCreateFieldChange('password', text)}
                    secureTextEntry={!showCreateUserPassword}
                    pr="$12"
                  />
                </Input>
                <Pressable
                  onPress={() => setShowCreateUserPassword(!showCreateUserPassword)}
                  disabled={isCreateUserSubmitting}
                  style={styles.resetPasswordEyeIconButton}
                >
                  <LucideIcon
                    name={showCreateUserPassword ? 'EyeOff' : 'Eye'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </Box>
              {getCreateError('password') && <Text color="$error600" fontSize="$xs">{getCreateError('password')}</Text>}
            </VStack>

            <VStack space="xs" flex={1}>
              <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                {t('admin.users.createUser.confirmPassword') || 'Confirm Password'} *
              </Text>
              <Box position="relative">
                <Input {...styles.createUserFormInput} isInvalid={!!getCreateError('confirmPassword')} isDisabled={isCreateUserSubmitting}>
                  <FastInputField
                    placeholder="Confirm password"
                    value={getCreateField('confirmPassword')}
                    onChangeText={(text: string) => handleCreateFieldChange('confirmPassword', text)}
                    secureTextEntry={!showCreateUserPassword}
                    pr="$12"
                  />
                </Input>
                <Pressable
                  onPress={() => setShowCreateUserPassword(!showCreateUserPassword)}
                  disabled={isCreateUserSubmitting}
                  style={styles.resetPasswordEyeIconButton}
                >
                  <LucideIcon
                    name={showCreateUserPassword ? 'EyeOff' : 'Eye'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </Box>
              {getCreateError('confirmPassword') && <Text color="$error600" fontSize="$xs">{getCreateError('confirmPassword')}</Text>}
            </VStack>
          </HStack>

          {/* Organisation, Position, Employee ID — only for Supervisor/LC roles */}
          {isSupervisorOrLC && (
            <>
              <HStack space="md" flexDirection={isMobile ? 'column' : 'row'}>
                <VStack space="xs" flex={1}>
                  <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                    {t('admin.users.createUser.organisation') || 'Organisation'} *
                  </Text>
                  <Box>
                    <Select
                      {...styles.createUserFormSelect}
                      options={[
                        { value: '', label: t('admin.users.createUser.organisationPlaceholder') || 'Select organisation' },
                        ...organisations.map(o => ({ value: o._id, label: o.name }))
                      ]}
                      value={getCreateField('organisationId')}
                      onChange={(val) => handleCreateFieldChange('organisationId', val)}
                      placeholder={t('admin.users.createUser.organisationPlaceholder') || 'Select organisation'}
                      disabled={isCreateUserSubmitting}
                    />
                  </Box>
                  {getCreateError('organisationId') && <Text color="$error600" fontSize="$xs">{getCreateError('organisationId')}</Text>}
                </VStack>
                <VStack space="xs" flex={1}>
                  <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                    {t('admin.users.createUser.position') || 'Position'} *
                  </Text>
                  <Box>
                    <Select
                      {...styles.createUserFormSelect}
                      options={[
                        { value: '', label: t('admin.users.createUser.positionPlaceholder') || 'Select position' },
                        ...positions.map(p => ({ value: p._id, label: p.name }))
                      ]}
                      value={getCreateField('positionId')}
                      onChange={(val) => handleCreateFieldChange('positionId', val)}
                      placeholder={t('admin.users.createUser.positionPlaceholder') || 'Select position'}
                      disabled={isCreateUserSubmitting}
                    />
                  </Box>
                  {getCreateError('positionId') && <Text color="$error600" fontSize="$xs">{getCreateError('positionId')}</Text>}
                </VStack>
              </HStack>
            </>
          )}

          {/* National ID & Employee ID combined */}
          <HStack space="md" flexDirection={isMobile ? 'column' : 'row'}>
            {isSupervisorOrLC && (
              <VStack space="xs" flex={1}>
                <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                  {t('admin.users.createUser.employeeId') || 'Employee ID'} *
                </Text>
                <Input {...styles.createUserFormInput} isInvalid={!!getCreateError('employeeId')} isDisabled={isCreateUserSubmitting}>
                  <FastInputField
                    placeholder={t('admin.users.createUser.employeeIdPlaceholder') || 'Enter Employee ID'}
                    value={getCreateField('employeeId')}
                    onChangeText={(text: string) => handleCreateFieldChange('employeeId', text)}
                  />
                </Input>
                {getCreateError('employeeId') && <Text color="$error600" fontSize="$xs">{getCreateError('employeeId')}</Text>}
              </VStack>
            )}

            <VStack space="xs" flex={1}>
              <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
                {t('admin.users.createUser.nationalId') || 'National ID'}
              </Text>
              <Input {...styles.createUserFormInput} isInvalid={!!getCreateError('nationalId')} isDisabled={isCreateUserSubmitting}>
                <FastInputField
                  placeholder={t('admin.users.createUser.nationalIdPlaceholder') || 'Enter National ID'}
                  value={getCreateField('nationalId')}
                  onChangeText={(text: string) => handleCreateFieldChange('nationalId', text)}
                  keyboardType="numeric"
                />
              </Input>
              {getCreateError('nationalId') && <Text color="$error600" fontSize="$xs">{getCreateError('nationalId')}</Text>}
            </VStack>
          </HStack>
        </VStack>
      

      {/* Geographic Assignment */}
      <VStack space="sm">
        <HStack space="xs" alignItems="center">
          <LucideIcon name="MapPin" size={16} color="$textMutedForeground" />
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
            {t('admin.users.createUser.geographicAssignment') || 'Geographic Assignment'}
          </Text>
        </HStack>

        <HStack space="md" flexDirection={isMobile ? 'column' : 'row'}>
          <VStack space="xs" flex={1}>
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.province') || 'Province'}
            </Text>
            <Box>
              <Select
                {...styles.createUserFormSelect}
                options={[
                  { value: '', label: t('admin.users.createUser.provincePlaceholder') || 'Select province' },
                  ...provinces.map(p => ({ value: p._id, label: p.name }))
                ]}
                value={getCreateField('provinceId')}
                onChange={(val) => handleCreateFieldChange('provinceId', val)}
                placeholder={t('admin.users.createUser.provincePlaceholder') || 'Select province'}
                disabled={isCreateUserSubmitting}
              />
            </Box>
          </VStack>
          <VStack space="xs" flex={1}>
            <Text {...TYPOGRAPHY.caption} color="$textForeground" fontWeight="$bold">
              {t('admin.users.createUser.site') || 'Site'}
            </Text>
            <Box>
              <Select
                {...styles.createUserFormSelect}
                options={[
                  { value: '', label: getCreateField('provinceId') ? (t('admin.users.createUser.sitePlaceholderReady') || 'Select site') : (t('admin.users.createUser.sitePlaceholder') || 'Select province first') },
                  ...sites.map(s => ({ value: s._id, label: s.name }))
                ]}
                value={getCreateField('siteId')}
                onChange={(val) => handleCreateFieldChange('siteId', val)}
                placeholder={getCreateField('provinceId') ? (t('admin.users.createUser.sitePlaceholderReady') || 'Select site') : (t('admin.users.createUser.sitePlaceholder') || 'Select province first')}
                disabled={isCreateUserSubmitting || !getCreateField('provinceId')}
              />
            </Box>
          </VStack>
        </HStack>
      </VStack>

      {/* Footer Content */}
      <VStack space="md" width="100%">
        <Box bg="$background50" p="$3" borderRadius="$md" mb="$2">
          <HStack space="xs" alignItems="flex-start">
            <LucideIcon name="Info" size={14} color="$textMutedForeground" style={{ marginTop: 2 }} />
            <Text {...TYPOGRAPHY.caption} color="$textMutedForeground" flex={1}>
              {t('admin.users.createUser.passwordNote')}
            </Text>
          </HStack>
        </Box>
        <HStack space="md" justifyContent="flex-end">
          <Button variant={"outlineghost" as any} onPress={onClose} isDisabled={isCreateUserSubmitting}>
            <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.createUser.cancel') || 'Cancel'}</ButtonText>
          </Button>
          <Button variant="solid" action="primary" onPress={onSubmit} isDisabled={isCreateUserSubmitting}>
            <ButtonText color="$white" {...TYPOGRAPHY.bodySmall}>
              {isCreateUserSubmitting ? (t('common.submitting') || 'Submitting...') : (t('admin.users.createUser.create') || 'Create User')}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </VStack>
  );
};
