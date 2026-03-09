/**
 * Admin Dashboard Filter Configurations
 * Data-driven filter definitions for the Admin Dashboard screen
 */

type FilterOption = { labelKey?: string; label?: string; value: string };

type FilterConfig = {
  name?: string;
  nameKey?: string;
  attr: string;
  type?: string;
  data?: FilterOption[] | string[];
  placeholder?: string;
  placeholderKey?: string;
  [key: string]: string | FilterOption[] | string[] | undefined;
};

// Date filter configurations (using search type with date placeholder)
export const FromDateFilter: FilterConfig = {
  nameKey: 'admin.dashboardFilters.fromDate',
  attr: 'fromDate',
  type: 'date', // Can be changed to 'date' or 'datepicker' when date picker component is implemented
  data: [],
  placeholderKey: 'admin.dashboardFilters.datePlaceholder',
};

export const ToDateFilter: FilterConfig = {
  nameKey: 'admin.dashboardFilters.toDate',
  attr: 'toDate',
  type: 'date', // Can be changed to 'date' or 'datepicker' when date picker component is implemented
  data: [],
  placeholderKey: 'admin.dashboardFilters.datePlaceholder',
};

// Time Period filter
export const TimePeriodFilter: FilterConfig = {
  nameKey: 'admin.dashboardFilters.timePeriod',
  attr: 'timePeriod',
  type: 'select',
  data: [
    { labelKey: 'admin.filters.allTimePeriod', value: 'all-time' },
    { labelKey: 'admin.dashboardFilters.last6Months', value: 'last-6-months' },
    { labelKey: 'admin.dashboardFilters.last3Months', value: 'last-3-months' },
    { labelKey: 'admin.dashboardFilters.lastMonth', value: 'last-month' },
    { labelKey: 'admin.dashboardFilters.lastWeek', value: 'last-week' },
    { labelKey: 'admin.dashboardFilters.custom', value: 'custom' },
  ],
};

// Provinces filter
export const ProvincesFilter: FilterConfig = {
  nameKey: 'admin.filters.filterByProvince',
  attr: 'province',
  type: 'select',
  data: [
    { labelKey: 'admin.filters.allProvinces', value: 'all-provinces' },
    { labelKey: 'Gauteng', value: 'Gauteng' },
    { labelKey: 'KwaZulu-nutal', value: 'KwaZulu-nutal' },
    { labelKey: 'Western Cape', value: 'Western Cape' },
  ],
};

// Districts filter
export const DistrictsFilter: FilterConfig = {
  nameKey: 'admin.filters.allDistrict',
  attr: 'district',
  type: 'select',
  data: [
    { labelKey: 'admin.filters.allDistrict', value: 'all-districts' },
    { labelKey: 'Johannesburg', value: 'Johannesburg' },
    { labelKey: 'eThekwini', value: 'eThekwini' },
    { labelKey: 'Cape Town', value: 'Cape Town' },
  ],
};

// Linkage Champions filter
export const ChampionsFilter: FilterConfig = {
  nameKey: 'admin.dashboardFilters.champions',
  attr: 'champions',
  type: 'select',
  data: [
    { labelKey: 'admin.dashboardFilters.allChampions', value: 'all-champions' },
    { labelKey: 'admin.filters.linkageChampion', value: 'linkage-champion' },
  ],
};

// Genders filter
export const GendersFilter: FilterConfig = {
  nameKey: 'admin.dashboardFilters.genders',
  attr: 'genders',
  type: 'select',
  data: [
    { labelKey: 'admin.dashboardFilters.allGenders', value: 'all-genders' },
    { labelKey: 'admin.dashboardFilters.male', value: 'male' },
    { labelKey: 'admin.dashboardFilters.female', value: 'female' },
    { labelKey: 'admin.dashboardFilters.other', value: 'other' },
  ],
};

// Combined filter options for Admin Dashboard
export const AdminDashboardFilterOptions: ReadonlyArray<FilterConfig> = [
  FromDateFilter,
  ToDateFilter,
  TimePeriodFilter,
  ProvincesFilter,
  DistrictsFilter,
  ChampionsFilter,
  GendersFilter,
];
