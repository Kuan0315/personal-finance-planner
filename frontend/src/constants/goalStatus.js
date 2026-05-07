export const GOAL_STATUS = {
  ON_TRACK: 'on-track',
  AT_RISK: 'at-risk',
  HIGH_RISK: 'high-risk',
  COMPLETED: 'completed',
};

export const GOAL_STATUS_LABELS = {
  [GOAL_STATUS.ON_TRACK]: 'On Track',
  [GOAL_STATUS.AT_RISK]: 'At Risk',
  [GOAL_STATUS.HIGH_RISK]: 'High Risk',
  [GOAL_STATUS.COMPLETED]: 'Completed',
};

export const GOAL_FILTERS = [
  { label: 'All Goals', value: 'all' },
  { label: 'On Track', value: GOAL_STATUS.ON_TRACK },
  { label: 'At Risk', value: GOAL_STATUS.AT_RISK },
  { label: 'High Risk', value: GOAL_STATUS.HIGH_RISK },
  { label: 'Completed', value: GOAL_STATUS.COMPLETED },
];

