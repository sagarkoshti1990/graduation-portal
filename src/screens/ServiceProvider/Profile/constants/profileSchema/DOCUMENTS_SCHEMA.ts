import type { FormSection } from '@components/SchemaFormRenderer/type';
import styles from '../../styles';

export const DOCUMENTS_SCHEMA: FormSection[] = [
  {
    type: 'section',
    id: 'documents',
    _container: styles.sectionContainer,
    _title: styles.sectionTitle,
    _subTitle: styles.sectionSubtitle,
    rows: [
      {
        fields: [
          {
            name: 'agreementMoU',
            type: 'file',
            required: false,
            label: { key: 'documents.agreementMoU', fallback: 'Agreement / MoU' },
            subTitle: { key: 'documents.agreementMoUSub', fallback: 'Upload if applicable' },
            placeholder: { key: 'documents.agreementMoUPlaceholder', fallback: 'Click to upload PDF / DOC / JPG' },
            _input: styles.input
          }
        ]
      },
      {
        fields: [
          {
            name: 'organisationCredentials',
            type: 'file',
            required: false,
            label: { key: 'documents.organisationCredentials', fallback: 'Organisation Credentials' },
            subTitle: { key: 'documents.organisationCredentialsSub', fallback: 'Certificates, Portfolio, etc.' },
            placeholder: { key: 'documents.organisationCredentialsPlaceholder', fallback: 'Click to upload PDF / DOC / JPG' },
            _input: styles.input
          }
        ]
      }
    ]
  }
];
