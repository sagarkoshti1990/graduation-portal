import type { FormSection } from '@components/SchemaFormRenderer/type';
import styles from '../../styles';

export const CONTACT_PERSON_SCHEMA: FormSection[] = [
  {
    type: 'section',
    id: 'contactPerson',
    _container: styles.sectionContainer,
    _title: styles.sectionTitle,
    _subTitle: styles.sectionSubtitle,
    rows: [
      {
        fields: [
          {
            name: 'contactPersonName',
            type: 'text',
            required: true,
            disabled: true,
            label: { key: 'contactPerson.name', fallback: 'Contact Person (Focal Person)' },
            placeholder: { key: 'contactPerson.namePlaceholder', fallback: 'Enter Contact Person Name' },
            _input: styles.input,
            validation: [
              { rule: 'required', message: { key: 'errors.contactNameRequired', fallback: 'Contact Person Name is required' } }
            ]
          }
        ]
      },
      {
        fields: [
          {
            name: 'contactEmail',
            type: 'email',
            required: true,
            disabled: true,
            label: { key: 'contactPerson.email', fallback: 'Email' },
            placeholder: { key: 'contactPerson.emailPlaceholder', fallback: 'example@org.com' },
            icon: 'Mail',
            _input: styles.input,
            validation: [
              { rule: 'required', message: { key: 'errors.emailRequired', fallback: 'Email is required' } },
              { rule: 'email', message: { key: 'errors.emailInvalid', fallback: 'Invalid email address' } }
            ]
          },
          {
            name: 'contactPhone',
            type: 'tel',
            required: true,
            disabled: true,
            label: { key: 'contactPerson.phone', fallback: 'Phone' },
            placeholder: { key: 'contactPerson.phonePlaceholder', fallback: 'Enter Phone Number' },
            icon: 'Phone',
            _input: styles.input,
            validation: [
              { rule: 'required', message: { key: 'errors.phoneRequired', fallback: 'Phone number is required' } }
            ]
          }
        ]
      }
    ]
  }
];
