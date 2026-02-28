import axios from 'axios';
import { BASE_URL } from '../config';

// Fetch homework for a specific class
export const fetchHomework = async (classNo) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/student-homework/${classNo}/today`);
    return response.data;
  } catch (error) {
    console.error('Error fetching homework:', error);
    return [];
  }
};

// Fetch all homework for a class (alternative endpoint)
export const fetchAllHomework = async (classNo, studentId = null) => {
  try {
    const url = studentId 
      ? `${BASE_URL}/api/homework/class/${classNo}?studentId=${studentId}`
      : `${BASE_URL}/api/homework/class/${classNo}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching all homework:', error);
    return [];
  }
};

// Mark homework as finished
export const markHomeworkFinished = async (homeworkId, studentId) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/homework/${homeworkId}/submit`, {
      studentId
    });
    return response.data;
  } catch (error) {
    console.error('Error marking homework as finished:', error);
    throw error;
  }
};

// Fetch homework submissions (for teachers)
export const fetchHomeworkSubmissions = async (homeworkId) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/homework/${homeworkId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching homework submissions:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, { username, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

