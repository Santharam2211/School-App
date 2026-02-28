import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Card, Text, TextInput, Button } from 'react-native-paper';
import { API_BASE } from '../config';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function StudentRequestLeaveScreen({ route }) {
  const studentId = route?.params?.studentId;
  const studentData = route?.params?.studentData;

  // Initialize form fields with student data if available
  const [rollNo, setRollNo] = useState(studentData?.rollNo || '');
  const [studentName, setStudentName] = useState(studentData?.name || '');
  const [from, setFrom] = useState(new Date());
  const [to, setTo] = useState(new Date());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Update form fields when student data changes
  useEffect(() => {
    if (studentData) {
      setRollNo(studentData.rollNo || '');
      setStudentName(studentData.name || '');
    }
  }, [studentData]);

  const onFromChange = (event, selectedDate) => {
    const currentDate = selectedDate || from;
    setShowFromPicker(Platform.OS === 'ios');
    setFrom(currentDate);
  };

  const onToChange = (event, selectedDate) => {
    const currentDate = selectedDate || to;
    setShowToPicker(Platform.OS === 'ios');
    setTo(currentDate);
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  async function submitLeave() {
    if (!studentId) {
      Alert.alert('Error', 'Student identity missing. Please re-login.');
      return;
    }
    if (!rollNo.trim() || !studentName.trim() || !from || !to || !reason.trim()) {
      Alert.alert('Validation', 'Please fill Roll No, Name, From, To and Reason');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: studentId,
          from: from,
          to: to,
          reason: `[roll:${rollNo.trim()}][name:${studentName.trim()}] ${reason.trim()}`
        })
      });
      if (!res.ok) throw new Error('Failed');
      setReason('');
      Alert.alert('Submitted', 'Leave request sent to teacher for approval');
    } catch (e) {
      Alert.alert('Error', 'Unable to submit leave');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Request Leave</Text>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Fill leave details</Text>
          <TextInput
            mode="outlined"
            placeholder="Roll No"
            value={rollNo}
            onChangeText={setRollNo}
            style={styles.readonlyInput}
            editable={false}
            label="Roll No (Auto-filled)"
          />
          <TextInput
            mode="outlined"
            placeholder="Student Name"
            value={studentName}
            onChangeText={setStudentName}
            style={styles.readonlyInput}
            editable={false}
            label="Student Name (Auto-filled)"
          />

          <View style={styles.dateContainer}>
            <Text style={styles.label}>From Date</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={formatDate(from)}
                onChange={(e) => setFrom(new Date(e.target.value))}
                style={styles.webDateInput}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    console.log("Opening From Picker");
                    setShowFromPicker(true);
                  }}
                  style={styles.pickerTrigger}
                >
                  <TextInput
                    mode="outlined"
                    value={formatDate(from)}
                    style={styles.input}
                    right={<TextInput.Icon icon="calendar" onPress={() => setShowFromPicker(true)} />}
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
                {showFromPicker && (
                  <DateTimePicker
                    value={from}
                    mode="date"
                    display="default"
                    onChange={onFromChange}
                  />
                )}
              </>
            )}
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.label}>To Date</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={formatDate(to)}
                onChange={(e) => setTo(new Date(e.target.value))}
                style={styles.webDateInput}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    console.log("Opening To Picker");
                    setShowToPicker(true);
                  }}
                  style={styles.pickerTrigger}
                >
                  <TextInput
                    mode="outlined"
                    value={formatDate(to)}
                    style={styles.input}
                    right={<TextInput.Icon icon="calendar" onPress={() => setShowToPicker(true)} />}
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
                {showToPicker && (
                  <DateTimePicker
                    value={to}
                    mode="date"
                    display="default"
                    onChange={onToChange}
                  />
                )}
              </>
            )}
          </View>

          <TextInput mode="outlined" placeholder="Reason" value={reason} onChangeText={setReason} style={styles.input} multiline numberOfLines={3} />
          <Button mode="contained" onPress={submitLeave} loading={loading} disabled={loading} buttonColor="#ff7a00" style={{ marginTop: 10 }}>Submit Request</Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  header: { fontSize: 22, textAlign: 'center', fontWeight: 'bold', color: '#ff7a00', marginBottom: 12 },
  card: { marginBottom: 10, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  input: { backgroundColor: '#fff', marginBottom: 10 },
  readonlyInput: { backgroundColor: '#f5f5f5', marginBottom: 10 },
  dateContainer: { marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 4 },
  pickerTrigger: { width: '100%' },
  webDateInput: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#7f8c8d',
    fontSize: 16,
    outlineColor: '#ff7a00',
    marginBottom: 10
  }
});


