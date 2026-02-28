// frontend/screens/FacultyDashboard.js
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from "../config";
import { fetchHomeworkSubmissions } from "../services/api";
import * as DocumentPicker from 'expo-document-picker';

export default function FacultyDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [homework, setHomework] = useState({});
  const [homeworkIds, setHomeworkIds] = useState({});
  const [loading, setLoading] = useState({});
  const [submissionsModal, setSubmissionsModal] = useState({ visible: false, data: null });
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [pdfAttachments, setPdfAttachments] = useState({});
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  });
  const route = useRoute();
  const { teacherId } = route.params || {};

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const readResponseBody = async (res) => {
    const contentType = res.headers?.get?.('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      const text = await res.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return { message: text };
      }
    } catch {
      return null;
    }
  };

  const getErrorMessage = (body, fallback) => {
    if (!body) return fallback;
    return body.message || body.error || body.details || fallback;
  };

  const getHttpErrorMessage = (res, body, fallback) => {
    const base = getErrorMessage(body, fallback);
    if (!res) return base;
    if (base && base !== fallback) return base;
    return `${fallback} (HTTP ${res.status})`;
  };

  // Fetch timetable and homework when teacherId or selectedDay changes
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await fetch(`${API_BASE}/teacher-timetable/${teacherId}/${selectedDay}`);
        const data = await res.json();

        // Map homework by slotId as string
        const hwMap = {};
        const idMap = {};
        data.forEach(slot => {
          hwMap[`${slot.classId}-${slot.slotId.toString()}`] = slot.homework || "";
          idMap[`${slot.classId}-${slot.slotId.toString()}`] = slot.homeworkId || null;
        });

        setHomework(hwMap);
        setHomeworkIds(idMap);
        setTimetable(data);
      } catch (err) {
        console.error("Error fetching timetable:", err);
        Alert.alert("Error", "Failed to load timetable");
      }
    };

    if (teacherId) {
      fetchTimetable();
    }
  }, [teacherId, selectedDay]);

  const refreshTimetable = async () => {
    try {
      const res = await fetch(`${API_BASE}/teacher-timetable/${teacherId}/${selectedDay}`);
      const data = await res.json();
      const hwMap = {};
      const idMap = {};
      data.forEach(slot => {
        hwMap[`${slot.classId}-${slot.slotId.toString()}`] = slot.homework || "";
        idMap[`${slot.classId}-${slot.slotId.toString()}`] = slot.homeworkId || null;
      });
      setHomework(hwMap);
      setHomeworkIds(idMap);
      setTimetable(data);
    } catch (err) {
      console.error('Error refreshing timetable:', err);
    }
  };

  // Pick PDF file for homework attachment
  const pickPDF = async (slotKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPdfAttachments(prev => ({
          ...prev,
          [slotKey]: {
            uri: asset.uri,
            name: asset.name,
            size: asset.size
          }
        }));
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert('Error', 'Failed to pick PDF file');
    }
  };

  // Remove PDF attachment
  const removePDF = (slotKey) => {
    setPdfAttachments(prev => {
      const newAttachments = { ...prev };
      delete newAttachments[slotKey];
      return newAttachments;
    });
  };

  // View homework submissions
  const viewSubmissions = async (slot) => {
    const homeworkKey = `${slot.classId}-${slot.slotId.toString()}`;
    const homeworkText = homework[homeworkKey];
    
    if (!homeworkText || homeworkText.trim() === "") {
      Alert.alert("No Homework", "No homework has been assigned for this slot yet.");
      return;
    }

    setLoadingSubmissions(true);
    try {
      // First, we need to get the homework ID
      // We'll make a request to find the homework for this slot
      const res = await fetch(`${API_BASE}/teacher-timetable/${teacherId}/${selectedDay}`);
      const data = await res.json();
      const currentSlot = data.find(s => s.slotId.toString() === slot.slotId.toString() && s.classId === slot.classId);
      
      if (currentSlot && currentSlot.homeworkId) {
        const submissionsData = await fetchHomeworkSubmissions(currentSlot.homeworkId);
        setSubmissionsModal({ visible: true, data: submissionsData });
      } else {
        Alert.alert("Info", "No submissions found for this homework.");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      Alert.alert("Error", "Failed to load submissions. The homework may not have been saved yet.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Submit homework for a specific slot
  const submitHomework = async (slot) => {
    const homeworkKey = `${slot.classId}-${slot.slotId.toString()}`;
    const homeworkText = homework[homeworkKey];
    const pdfAttachment = pdfAttachments[homeworkKey];
    const existingHomeworkId = homeworkIds[homeworkKey];
    
    if (!homeworkText || homeworkText.trim() === "") {
      Alert.alert("Error", "Please enter homework text");
      return;
    }

    setLoading(prev => ({ ...prev, [homeworkKey]: true }));

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('classId', String(slot.classId));
      formData.append('day', String(slot.day));
      formData.append('slotId', String(slot.slotId));
      formData.append('homeworkText', homeworkText.trim());
      formData.append('teacherId', String(teacherId));
      formData.append('subject', String(slot.subject || ''));
      formData.append('hour', String(slot.hour || ''));
      
      // Add PDF if selected
      if (pdfAttachment) {
        const fileUri = pdfAttachment.uri;
        const fileName = pdfAttachment.name;
        
        // Create file object for FormData
        const fileInfo = {
          uri: fileUri,
          type: 'application/pdf',
          name: fileName,
        };
        formData.append('pdfAttachment', fileInfo);
      }

      const url = existingHomeworkId
        ? `${API_BASE}/homework/${existingHomeworkId}`
        : `${API_BASE}/homework`;

      const res = await fetch(url, {
        method: existingHomeworkId ? "PUT" : "POST",
        body: formData
      });

      const result = await readResponseBody(res);
      if (res.ok) {
        // Check if SMS failed due to trial account
        const smsStatus = result.smsStatus;
        const hasTrialError = smsStatus?.hasTrialErrors || 
                              smsStatus?.message?.includes('Trial account') ||
                              smsStatus?.message?.includes('unverified');
        
        if (hasTrialError) {
          Alert.alert(
            "Homework Saved (SMS Failed)",
            `Homework ${existingHomeworkId ? 'updated' : 'submitted'} successfully!\n\n⚠️ SMS not sent: Twilio trial account cannot send to unverified numbers.\n\nTo fix:\n1. Verify numbers at twilio.com/console/phone-numbers/verified\n2. Or upgrade to paid Twilio account`,
            [{ text: "OK" }]
          );
        } else if (smsStatus?.sentCount > 0) {
          Alert.alert(
            "Success", 
            `Homework ${existingHomeworkId ? 'updated' : 'submitted'}! SMS sent to ${smsStatus.sentCount} students.`
          );
        } else {
          Alert.alert(
            "Success", 
            `Homework ${existingHomeworkId ? 'updated' : 'submitted'} successfully!`
          );
        }
        removePDF(homeworkKey);
        await refreshTimetable();
      } else {
        console.error("Submission failed:", result);
        Alert.alert("Error", getHttpErrorMessage(res, result, "Failed to submit homework"));
      }
    } catch (err) {
      console.error("Error submitting homework:", err);
      Alert.alert("Error", err?.message || "Failed to submit homework");
    } finally {
      setLoading(prev => ({ ...prev, [homeworkKey]: false }));
    }
  };

  const confirmDeleteHomework = (slot) => {
    const homeworkKey = `${slot.classId}-${slot.slotId.toString()}`;
    const existingHomeworkId = homeworkIds[homeworkKey];

    if (!existingHomeworkId) {
      Alert.alert('Info', 'No saved homework to delete for this slot.');
      return;
    }

    Alert.alert(
      'Delete Homework',
      `Delete homework for Class ${slot.classId} (${slot.subject} - ${slot.hour})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(prev => ({ ...prev, [homeworkKey]: true }));
            try {
              const res = await fetch(`${API_BASE}/homework/${existingHomeworkId}`, { method: 'DELETE' });
              const result = await readResponseBody(res);
              if (res.ok) {
                Alert.alert('Deleted', 'Homework deleted successfully.');
                removePDF(homeworkKey);
                await refreshTimetable();
              } else {
                Alert.alert('Error', getHttpErrorMessage(res, result, 'Failed to delete homework'));
              }
            } catch (err) {
              console.error('Error deleting homework:', err);
              Alert.alert('Error', err?.message || 'Failed to delete homework');
            } finally {
              setLoading(prev => ({ ...prev, [homeworkKey]: false }));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.header}>Faculty Dashboard</Text>
      
      {/* Day Selector */}
      <View style={styles.daySelectorContainer}>
        <Text style={styles.daySelectorLabel}>Select Day:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorScroll}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDay === day.toLowerCase() && styles.dayButtonActive
              ]}
              onPress={() => setSelectedDay(day.toLowerCase())}
            >
              <Text style={[
                styles.dayButtonText,
                selectedDay === day.toLowerCase() && styles.dayButtonTextActive
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.subHeader}>{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s Classes</Text>
      
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={timetable}
        keyExtractor={(item) => `${item.classId}-${item.slotId}`}
        renderItem={({ item }) => {
          const homeworkKey = `${item.classId}-${item.slotId.toString()}`;
          const isLoading = loading[homeworkKey];
          const hasSavedHomework = !!homeworkIds[homeworkKey];
          
          return (
            <View style={styles.card}>
              <Text style={styles.classText}>Class: {item.classId}</Text>
              <Text style={styles.subjectText}>Subject: {item.subject}</Text>
              <Text style={styles.timeText}>Time: {item.hour}</Text>
              <Text style={styles.dayText}>Day: {item.day}</Text>

              <TextInput
                placeholder="Enter homework assignment..."
                style={styles.input}
                value={homework[homeworkKey] || ""}
                onChangeText={(text) =>
                  setHomework(prev => ({
                    ...prev,
                    [homeworkKey]: text
                  }))
                }
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />

              {/* PDF Attachment Section */}
              <View style={styles.pdfSection}>
                <Text style={styles.pdfLabel}>PDF Attachment (Optional):</Text>
                
                {pdfAttachments[homeworkKey] ? (
                  <View style={styles.pdfPreview}>
                    <View style={styles.pdfInfo}>
                      <MaterialCommunityIcons name="file-pdf" size={20} color="#dc2626" />
                      <Text style={styles.pdfName} numberOfLines={1}>
                        {pdfAttachments[homeworkKey].name}
                      </Text>
                      <Text style={styles.pdfSize}>
                        ({Math.round(pdfAttachments[homeworkKey].size / 1024)} KB)
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removePdfButton}
                      onPress={() => removePDF(homeworkKey)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.addPdfButton}
                    onPress={() => pickPDF(homeworkKey)}
                    disabled={isLoading}
                  >
                    <MaterialCommunityIcons name="file-plus" size={20} color="#3b82f6" />
                    <Text style={styles.addPdfText}>Add PDF</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#ff7a00" />
                  <Text style={styles.loadingText}>Sending homework...</Text>
                </View>
              ) : (
                <View>
                  <Button 
                    color="#ff7a00" 
                    title="Submit Homework" 
                    onPress={() => submitHomework(item)} 
                  />

                  {hasSavedHomework && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => confirmDeleteHomework(item)}
                    >
                      <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                      <Text style={styles.deleteButtonText}>Delete Homework</Text>
                    </TouchableOpacity>
                  )}

                  {homework[homeworkKey] && homework[homeworkKey].trim() !== "" && (
                    <TouchableOpacity 
                      style={styles.viewSubmissionsButton}
                      onPress={() => viewSubmissions(item)}
                      disabled={loadingSubmissions}
                    >
                      <MaterialCommunityIcons name="account-check" size={18} color="#3b82f6" />
                      <Text style={styles.viewSubmissionsText}>
                        {loadingSubmissions ? 'Loading...' : 'View Submissions'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No classes scheduled for {selectedDay}.</Text>
        }
      />
      
      {/* Submissions Modal */}
      <Modal
        visible={submissionsModal.visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSubmissionsModal({ visible: false, data: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Homework Submissions</Text>
              <TouchableOpacity onPress={() => setSubmissionsModal({ visible: false, data: null })}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {submissionsModal.data && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.homeworkInfo}>
                  <Text style={styles.homeworkSubject}>{submissionsModal.data.homework.subject}</Text>
                  <Text style={styles.homeworkDesc}>{submissionsModal.data.homework.description}</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{submissionsModal.data.totalStudents}</Text>
                      <Text style={styles.statLabel}>Total Students</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statNumber, { color: '#4caf50' }]}>{submissionsModal.data.finishedCount}</Text>
                      <Text style={styles.statLabel}>Finished</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statNumber, { color: '#f57c00' }]}>
                        {submissionsModal.data.totalStudents - submissionsModal.data.finishedCount}
                      </Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.submissionsHeader}>Student Status:</Text>
                {submissionsModal.data.submissions.map((submission, index) => (
                  <View key={index} style={styles.submissionRow}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{submission.studentName}</Text>
                      <Text style={styles.studentRoll}>Roll: {submission.rollNo}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      submission.status === 'finished' ? styles.statusFinished : styles.statusPending
                    ]}>
                      <MaterialCommunityIcons 
                        name={submission.status === 'finished' ? 'check-circle' : 'clock-outline'} 
                        size={16} 
                        color={submission.status === 'finished' ? '#2e7d32' : '#f57c00'} 
                      />
                      <Text style={[
                        styles.statusText,
                        { color: submission.status === 'finished' ? '#2e7d32' : '#f57c00' }
                      ]}>
                        {submission.status === 'finished' ? 'Finished' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#ffffff' 
  },
  content: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center'
  },
  header: { 
    fontSize: 24, 
    marginBottom: 10, 
    fontWeight: "bold", 
    color: '#ff7a00',
    textAlign: 'center',
    marginTop: 10
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center'
  },
  daySelectorContainer: {
    marginHorizontal: 20,
    marginBottom: 15
  },
  daySelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  daySelectorScroll: {
    paddingVertical: 5,
    gap: 8
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  dayButtonActive: {
    backgroundColor: '#ff7a00',
    borderColor: '#ff7a00'
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  dayButtonTextActive: {
    color: '#fff'
  },
  card: { 
    marginBottom: 20, 
    padding: 15, 
    borderWidth: 1, 
    borderRadius: 12, 
    backgroundColor: '#f8f9fa',
    borderColor: '#e3f2fd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  classText: { 
    marginBottom: 5, 
    fontSize: 18, 
    color: '#333',
    fontWeight: 'bold'
  },
  subjectText: { 
    marginBottom: 5, 
    fontSize: 16, 
    color: '#666',
    fontWeight: '600'
  },
  timeText: { 
    marginBottom: 5, 
    fontSize: 14, 
    color: '#888'
  },
  dayText: { 
    marginBottom: 10, 
    fontSize: 14, 
    color: '#888',
    fontStyle: 'italic'
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 8, 
    marginVertical: 10, 
    padding: 12, 
    backgroundColor: '#ffffff',
    borderColor: '#ddd',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10
  },
  loadingText: {
    marginLeft: 10,
    color: '#ff7a00',
    fontSize: 16
  },
  emptyText: {
    textAlign: 'center', 
    marginTop: 40,
    fontSize: 16,
    color: '#666'
  },
  viewSubmissionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6'
  },
  viewSubmissionsText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  modalBody: {
    padding: 20
  },
  homeworkInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  homeworkSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff7a00',
    marginBottom: 8
  },
  homeworkDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statBox: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  submissionsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  submissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  studentInfo: {
    flex: 1
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333'
  },
  studentRoll: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1
  },
  statusFinished: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32'
  },
  statusPending: {
    backgroundColor: '#fff3e0',
    borderColor: '#f57c00'
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4
  },
  pdfSection: {
    marginVertical: 10
  },
  pdfLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  pdfPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    padding: 12
  },
  pdfInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  pdfName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  pdfSize: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8
  },
  removePdfButton: {
    padding: 4
  },
  addPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12
  },
  addPdfText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8
  }
});