const OBSERVATION_PREFILL_FIELD_IDS = {
  FACILITATOR_NAME: '6a0eeab34682fdc70cef200e',
  PROVINCE: '6a0eeab34682fdc70cef2014',
  SITE: '6a0eeab34682fdc70cef201a',
  DATE_OF_COLLECTION: '6a0eeab34682fdc70cef2020',
  PARTICIPANT_NAME: '6a0eeab34682fdc70cef2033',
  NATIONAL_ID_NUMBER: '6a0eeab34682fdc70cef2039',
  COUNTRY_CODE: '6a0f0d28c7134584643a9dbd',
  CELL_PHONE_NUMBER: '6a0eeab34682fdc70cef204b',
  ALTERNATE_COUNTRY_CODE: '6a0f0edbc7134584643a9dc2',
  EMAIL_ADDRESS: '6a0eeab34682fdc70cef2057',
  VISIT_DATE: '6a0f06224682fdc70cef3671',
} as const;

type ObservationPrefillParams = {
  facilitatorName?: string;
  provinceLabel?: string;
  siteLabel?: string;
  participantName?: string;
  nationalIdLabel?: string;
  phoneCode?: string;
  phone?: string;
  alternatePhoneCode?: string;
  email?: string;
};

export const buildObservationPrefillData = ({
  facilitatorName,
  provinceLabel,
  siteLabel,
  participantName,
  nationalIdLabel,
  phoneCode,
  phone,
  alternatePhoneCode,
  email,
}: ObservationPrefillParams, formatCountryCode: (phoneCode?: string | number | null) => string) => ({
  [OBSERVATION_PREFILL_FIELD_IDS.FACILITATOR_NAME]: facilitatorName, // "Facilitator Name"
  [OBSERVATION_PREFILL_FIELD_IDS.PROVINCE]: { value: provinceLabel, readonly: provinceLabel ? true : false }, // "Province"
  [OBSERVATION_PREFILL_FIELD_IDS.SITE]: { value: siteLabel, readonly: siteLabel ? true : false }, // Site
  [OBSERVATION_PREFILL_FIELD_IDS.DATE_OF_COLLECTION]: { value: new Date().toISOString().split('T')[0], readonly: false }, // Date of Collection
  [OBSERVATION_PREFILL_FIELD_IDS.PARTICIPANT_NAME]: { value: participantName, readonly: false }, // "What is your name?"
  [OBSERVATION_PREFILL_FIELD_IDS.NATIONAL_ID_NUMBER]: { value: nationalIdLabel || '', readonly: false }, // "What is your ID number?"
  [OBSERVATION_PREFILL_FIELD_IDS.COUNTRY_CODE]: { value: formatCountryCode(phoneCode), readonly: false }, // "Country Code"
  [OBSERVATION_PREFILL_FIELD_IDS.CELL_PHONE_NUMBER]: { value: phone, readonly: false }, // "What is your cell phone number?"
  [OBSERVATION_PREFILL_FIELD_IDS.ALTERNATE_COUNTRY_CODE]: { value: formatCountryCode(alternatePhoneCode), readonly: false }, // "Country Code (For alternative number)"
  [OBSERVATION_PREFILL_FIELD_IDS.EMAIL_ADDRESS]: { value: email, readonly: false }, // "And what is your email address?"
  [OBSERVATION_PREFILL_FIELD_IDS.VISIT_DATE]: { value: new Date().toISOString().split('T')[0], readonly: false }, // "Visit Date"
});
