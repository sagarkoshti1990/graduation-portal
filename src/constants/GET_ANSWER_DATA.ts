export const PARTICIPANT_DETAIL_CHALLENGE_NOTES_ANSWER_ITEMS = [
  { createdFromQuestionId: '69ef48e35b9067fa786cd496', keyName: 'successNotes', label: 'Success Notes' },
  { createdFromQuestionId: '69ef483a5b9067fa786cd2f6', keyName: 'challengeNotes', label: 'Challenge Notes' },
];

export const CHECK_INS_SUBMISSION_ANSWER_ITEMS = [
  { qid: '69830d56a97625e23240f455', keyName: 'visitDate', label: 'Visit Date' },
  { qid: '69fb4f1ee03feb46ac123b0e', keyName: 'tags', label: 'Tags' },
  { qid: '69830d56a97625e23240f455', keyName: 'notes', label: 'Notes' },
];

export const LOG_VISIT_MODULE_POPUP = {
  "69830d56a97625e23240f455": { value: new Date().toISOString().split('T')[0], readonly: false }, // 'Visit Date'
}


export const ACTION_COLUMN = {
  "69830d56a97625e23240f455": {
    value: new Date().toISOString().split('T')[0],
    readonly: false,
  }, // 'Visit Date'
}