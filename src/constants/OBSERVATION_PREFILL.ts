const OBSERVATION_PREFILL_FIELD_IDS = {
  FACILITATOR_NAME: 'facilitator_name',
  PROVINCE: 'province',
  SITE: 'site',
  DATE_OF_COLLECTION: 'date_of_collection',
  PARTICIPANT_NAME: 'name',
  NATIONAL_ID_NUMBER: 'national_id',
  COUNTRY_CODE: 'phone_code',
  CELL_PHONE_NUMBER: 'phone',
  ALTERNATE_COUNTRY_CODE: 'alt_phone_code',
  EMAIL_ADDRESS: 'email',
  VISIT_DATE: 'visit_date',
  GENDER:"gender",
  DOB:"dob"
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
  gender?:string;
  dob?:string;
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
  gender,
  dob
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
  [OBSERVATION_PREFILL_FIELD_IDS.GENDER]: { value: gender, readonly: false }, // "What is your gender?"
  [OBSERVATION_PREFILL_FIELD_IDS.DOB]: { value: dob, readonly: false } // "What is your date of birth?"
});
