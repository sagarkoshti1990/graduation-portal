export const CSV_TEMPLATES_KEYS = [
    {
        id: 'user_import',
        titleKey: 'admin.csvTemplatePage.templates.user_import.title',
        descriptionKey: 'admin.csvTemplatePage.templates.user_import.description',
    },
    // {
    //     id: 'participant_assignment',
    //     titleKey: 'admin.csvTemplatePage.templates.participant_assignment.title',
    //     descriptionKey: 'admin.csvTemplatePage.templates.participant_assignment.description',
    // },
    // {
    //     id: 'lc_supervisor_mapping',
    //     titleKey: 'admin.csvTemplatePage.templates.lc_supervisor_mapping.title',
    //     descriptionKey: 'admin.csvTemplatePage.templates.lc_supervisor_mapping.description',
    // },
    // {
    //     id: 'bulk_status_update',
    //     titleKey: 'admin.csvTemplatePage.templates.bulk_status_update.title',
    //     descriptionKey: 'admin.csvTemplatePage.templates.bulk_status_update.description',
    // },
    // {
    //     id: 'geographic_reassignment',
    //     titleKey: 'admin.csvTemplatePage.templates.geographic_reassignment.title',
    //     descriptionKey: 'admin.csvTemplatePage.templates.geographic_reassignment.description',
    // },
];

export const GUIDELINES_KEYS = [
    'admin.csvTemplatePage.guidelines.items.0',
    'admin.csvTemplatePage.guidelines.items.1',
    'admin.csvTemplatePage.guidelines.items.2',
    'admin.csvTemplatePage.guidelines.items.3',
    'admin.csvTemplatePage.guidelines.items.4',
    'admin.csvTemplatePage.guidelines.items.5',
    'admin.csvTemplatePage.guidelines.items.6',
];

export const CSV_CONTENT_STRINGS: Record<string, string> = {
    user_import: "username,email,phone_code,phone,name,role,province,site,location,dob\njohn.doe,john@example.com,27,6789450945,John Doe,user,SA-G,SA-G-RF,A2659 Jozini Road Ntuzuma 4359,04/03/75",
    participant_assignment: "participant_email,lc_email,assignment_date\nparticipant@example.com,lc@example.com,2024-01-01",
    lc_supervisor_mapping: "lc_email,supervisor_email\nlc@example.com,supervisor@example.com",
    bulk_status_update: "user_email,new_status,reason\nuser@example.com,inactive,Resigned",
    geographic_reassignment: "user_email,new_province,new_district\nuser@example.com,Western Cape,Cape Town"
};
