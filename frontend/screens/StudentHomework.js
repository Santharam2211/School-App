// screens/StudentHomework.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchHomework, fetchAllHomework, markHomeworkFinished } from '../services/api';

export default function StudentHomework({ route }) {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const classNo = route?.params?.classNo || 6;
  const studentId = route?.params?.studentId;

  const loadHomework = async () => {
    try {
      setLoading(true);
      const allHw = await fetchAllHomework(classNo, studentId);
      let formattedHomework = [];
      if (allHw && allHw.length > 0) {
        allHw.forEach(hw => {
          formattedHomework.push({
            _id: hw._id,
            title: hw.title || hw.subject || 'Homework',
            subject: hw.subject,
            description: hw.text || hw.description || hw.homeworkText,
            teacherName: hw.teacherName || 'Teacher',
            dueDate: hw.dueDate || hw.date,
            status: hw.status || 'Pending',
            hasValidId: true,
            pdfAttachment: hw.pdfAttachment,
            pdfOriginalName: hw.pdfOriginalName
          });
        });
      }
      setHomework(formattedHomework);
    } catch (error) {
      console.error('Error loading homework:', error);
      setHomework([]);
      Alert.alert('Load Failed 🌐', 'Unable to load homework. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [classNo, studentId]);

  // View PDF attachment
  const viewPDF = async (pdfAttachment) => {
    try {
      const { API_BASE } = require('../config');
      const pdfUrl = `${API_BASE}/files/homework-pdfs/${pdfAttachment}`;

      // Check if the URL can be opened
      const supported = await Linking.canOpenURL(pdfUrl);

      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert('Error', 'Cannot open PDF file');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF file');
    }
  };

  const handleMarkFinished = async (homeworkId, homeworkTitle) => {
    if (!studentId) {
      Alert.alert('Not Logged In ⚠️', 'Student ID not found. Please log out and log in again.');
      return;
    }
    if (!homeworkId || typeof homeworkId !== 'string' || homeworkId.length !== 24) {
      Alert.alert('Invalid Homework ⚠️', 'This homework cannot be marked as finished due to an invalid ID.');
      return;
    }

    // Confirmation before marking
    Alert.alert(
      'Mark as Finished? ✅',
      `Are you sure you want to mark "${homeworkTitle || 'this homework'}" as finished?`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Done!',
          onPress: async () => {
            setSubmitting(prev => ({ ...prev, [homeworkId]: true }));
            try {
              await markHomeworkFinished(homeworkId, studentId);
              Alert.alert(
                'Homework Submitted ✅',
                `"${homeworkTitle || 'Homework'}" has been marked as finished. Great job! 🌟`
              );
              await loadHomework();
            } catch (error) {
              console.error('Error marking homework:', error);
              Alert.alert('Submission Failed ❌', 'Failed to mark homework as finished. Please check your connection and try again.');
            } finally {
              setSubmitting(prev => ({ ...prev, [homeworkId]: false }));
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <MaterialCommunityIcons name="book-open-variant" size={22} color="#3b82f6" />
          <Text style={[styles.title, { marginLeft: 6 }]}>Homework - Class {classNo}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading homework...</Text>
          </View>
        ) : homework.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-open-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No homework assigned yet</Text>
            <Text style={styles.emptySubtext}>Check back later for assignments from your teachers</Text>
          </View>
        ) : (
          homework.map(hw => (
            <View key={hw._id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.hwTitle}>{hw.title || hw.subject || 'Homework'}</Text>
                <View style={hw.status === 'Finished' ? styles.badgeFinished : styles.badgePending}>
                  <Text style={{ color: hw.status === 'Finished' ? '#2e7d32' : '#f57c00', fontWeight: '600', fontSize: 12 }}>
                    {hw.status || 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>📅 Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : '—'}</Text>
              <Text style={styles.meta}>Teacher: {hw.teacherName || 'Teacher'}   Subject: {hw.subject || '—'}</Text>
              <Text style={styles.desc}>{hw.description || hw.text || ''}</Text>

              {/* PDF Attachment Section */}
              {hw.pdfAttachment && (
                <View style={styles.pdfAttachmentSection}>
                  <Text style={styles.pdfLabel}>📎 PDF Attachment:</Text>
                  <TouchableOpacity
                    style={styles.pdfButton}
                    onPress={() => viewPDF(hw.pdfAttachment)}
                  >
                    <MaterialCommunityIcons name="file-pdf" size={20} color="#dc2626" />
                    <Text style={styles.pdfButtonText}>
                      {hw.pdfOriginalName || 'View PDF'}
                    </Text>
                    <MaterialCommunityIcons name="open-in-new" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}

              {hw.status !== 'Finished' && hw.hasValidId && (
                <TouchableOpacity
                  style={[styles.finishButton, submitting[hw._id] && styles.finishButtonDisabled]}
                  onPress={() => handleMarkFinished(hw._id, hw.title)}
                  disabled={submitting[hw._id]}
                >
                  <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                  <Text style={styles.finishButtonText}>
                    {submitting[hw._id] ? 'Marking...' : 'Mark as Finished'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff'
  },
  content: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center'
  },
  card: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e3f2fd'
  },
  hwTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  meta: { color: '#666', marginTop: 2 },
  desc: { marginTop: 8, color: '#333', marginBottom: 10 },
  badgePending: {
    backgroundColor: '#fff3e0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#f57c00'
  },
  badgeFinished: {
    backgroundColor: '#e8f5e9',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2e7d32'
  },
  finishButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  finishButtonDisabled: {
    backgroundColor: '#a5d6a7',
    elevation: 0
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center'
  },
  pdfAttachmentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  pdfLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pdfButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginHorizontal: 8,
    flex: 1,
    textAlign: 'center'
  }
});
