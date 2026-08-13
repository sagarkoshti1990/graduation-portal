import { FormSection } from '@components/SchemaFormRenderer/type';
import styles from '../../styles';

export const BASIC_INFO_SCHEMA: FormSection[] = [
  {
    type: 'section',
    id: 'basicInfo',
    _container: styles.sectionContainer,
    _title: styles.sectionTitle,
    _subTitle: styles.sectionSubtitle,
    rows: [
      {
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            label: { key: 'basicInfo.name', fallback: 'Support Provider Name' },
            placeholder: { key: 'basicInfo.namePlaceholder', fallback: 'Enter Support Provider Name' },
            _input: styles.input,
            validation: [
              { rule: 'required', message: { key: 'errors.orgNameRequired', fallback: 'Support Provider Name is required' } }
            ]
          }
        ]
      },
      {
        fields: [
          {
            name: 'organizationType',
            type: 'pillmultiselect',
            required: true,
            label: { key: 'basicInfo.type', fallback: 'Provider Type' },
            optionsSource: 'organizationTypes',
            _input: styles.input,
            validation: [
              { rule: 'required', message: { key: 'errors.typeRequired', fallback: 'Provider Type is required' } }
            ]
          }
        ]
      }
    ]
  }
];
