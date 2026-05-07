const OBSERVATION_PREFILL_FIELD_IDS = {
  FACILITATOR_NAME: '6984d256a97625e23240f7a9',
  PROVINCE: '6984d256a97625e23240f7af',
  SITE: '6984d256a97625e23240f7b5',
  DATE_OF_COLLECTION: '6984d256a97625e23240f7bb',
  PARTICIPANT_NAME: '6984d256a97625e23240f7c7',
  NATIONAL_ID_NUMBER: '6984d256a97625e23240f7cd',
  COUNTRY_CODE: '6995e256a97625e23241f8c4',
  CELL_PHONE_NUMBER: '6984d256a97625e23240f7d9',
  ALTERNATE_COUNTRY_CODE: '6995e689a97625e23241c7a9',
  EMAIL_ADDRESS: '6984d256a97625e23240f7e5',
  VISIT_DATE: '69ef483a5b9067fa786cd2de',
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
