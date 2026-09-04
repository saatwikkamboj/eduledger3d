// Stream + subject branching logic for Class 11 & 12.
export const STREAMS = [
  { id: 'Science-Medical', label: 'Science (Medical)' },
  { id: 'Science-Non-Medical', label: 'Science (Non-Medical)' },
  { id: 'Commerce', label: 'Commerce' },
  { id: 'Arts', label: 'Arts / Humanities' },
];

export const SUBJECTS_BY_STREAM = {
  'Science-Medical': ['Physics', 'Chemistry', 'Biology', 'English', 'Physical Education', 'Mathematics (Additional)'],
  'Science-Non-Medical': ['Physics', 'Chemistry', 'Mathematics', 'English', 'Computer Science', 'Physical Education'],
  Commerce: ['Accountancy', 'Business Studies', 'Economics', 'English', 'Mathematics', 'Informatics Practices'],
  Arts: ['History', 'Political Science', 'Geography', 'Economics', 'English', 'Psychology', 'Sociology', 'Fine Arts'],
};

export function subjectsFor(streamId) {
  return SUBJECTS_BY_STREAM[streamId] || [];
}
