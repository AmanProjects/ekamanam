// User Profile Service
// Manages student and parent information

export const PROFILE_KEYS = {
  STUDENT_NAME: 'student_name',
  PARENT_NAME: 'parent_name',
  PARENT_EMAIL: 'parent_email',
};

/**
 * Get student name
 */
export const getStudentName = () => {
  return localStorage.getItem(PROFILE_KEYS.STUDENT_NAME) || '';
};

/**
 * Save student name
 */
export const saveStudentName = (name) => {
  localStorage.setItem(PROFILE_KEYS.STUDENT_NAME, name);
  console.log('👤 Student name saved:', name);
};

/**
 * Get parent name
 */
export const getParentName = () => {
  return localStorage.getItem(PROFILE_KEYS.PARENT_NAME) || '';
};

/**
 * Save parent name
 */
export const saveParentName = (name) => {
  localStorage.setItem(PROFILE_KEYS.PARENT_NAME, name);
  console.log('👤 Parent name saved:', name);
};

/**
 * Get parent email (used for OTP and admin access)
 */
export const getParentEmail = () => {
  return localStorage.getItem(PROFILE_KEYS.PARENT_EMAIL) || '';
};

/**
 * Save parent email
 */
export const saveParentEmail = (email) => {
  localStorage.setItem(PROFILE_KEYS.PARENT_EMAIL, email);
  console.log('📧 Parent email saved:', email);
};

/**
 * Get complete profile
 */
export const getProfile = () => {
  return {
    studentName: getStudentName(),
    parentName: getParentName(),
    parentEmail: getParentEmail(),
  };
};

/**
 * Save complete profile
 */
export const saveProfile = ({ studentName, parentName, parentEmail }) => {
  if (studentName) saveStudentName(studentName);
  if (parentName) saveParentName(parentName);
  if (parentEmail) saveParentEmail(parentEmail);
  console.log('✅ Profile saved successfully');
};

/**
 * Clear all profile data
 */
export const clearProfile = () => {
  localStorage.removeItem(PROFILE_KEYS.STUDENT_NAME);
  localStorage.removeItem(PROFILE_KEYS.PARENT_NAME);
  localStorage.removeItem(PROFILE_KEYS.PARENT_EMAIL);
  console.log('🗑️ Profile cleared');
};

export default {
  getStudentName,
  saveStudentName,
  getParentName,
  saveParentName,
  getParentEmail,
  saveParentEmail,
  getProfile,
  saveProfile,
  clearProfile,
};

