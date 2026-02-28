import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Card, Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { API_BASE } from '../config';

export default function TeacherLeavesScreen({ route }) {
  debugger;
  const teacherId = route?.params?.teacherId;
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    loadLeaves();
  }, [teacherId]);

  async function loadLeaves() {
    if (!teacherId) {
      console.log('No teacher ID provided');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaves?teacher=${teacherId}`);
      const data = await res.json();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading leaves:', e);
      setLeaves([]);
      Alert.alert('Error', 'Unable to load leaves');
    } finally {
      setLoading(false);
    }
  }

  async function updateLeaveStatus(leaveId, status) {
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed');
      loadLeaves();
      Alert.alert('Updated', `Leave ${status.toLowerCase()}`);
    } catch (e) {
      Alert.alert('Error', 'Unable to update leave status');
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Approved': return '#4caf50';
      case 'Rejected': return '#f44336';
      default: return '#ff9800';
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#ff7a00" />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Student Leave Requests</Text>

      {leaves.length === 0 && <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No leave requests</Text>}

      {leaves.map((leave, idx) => (
        <Card key={leave._id || idx} style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text style={styles.studentName}>
                {leave.student?.name || 'Student'}
              </Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(leave.status) }]}
                textStyle={{ color: '#fff' }}
              >
                {leave.status || 'Pending'}
              </Chip>
            </View>

            <Text style={styles.detail}>Roll: {leave.student?.rollNo || 'N/A'}</Text>
            <Text style={styles.detail}>From: {new Date(leave.from).toDateString()}</Text>
            <Text style={styles.detail}>To: {new Date(leave.to).toDateString()}</Text>
            <Text style={styles.detail}>Reason: {leave.reason}</Text>
            {leave.classTeacher && (
              <Text style={styles.detail}>Class Teacher: {leave.classTeacher.name || 'N/A'}</Text>
            )}

            {leave.status === 'Pending' && (
              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={() => updateLeaveStatus(leave._id, 'Approved')}
                  style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
                  labelStyle={{ color: '#fff' }}
                >
                  Approve
                </Button>
                <Button
                  mode="contained"
                  onPress={() => updateLeaveStatus(leave._id, 'Rejected')}
                  style={[styles.actionButton, { backgroundColor: '#f44336' }]}
                  labelStyle={{ color: '#fff' }}
                >
                  Reject
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  header: { fontSize: 22, textAlign: 'center', fontWeight: 'bold', color: '#ff7a00', marginBottom: 12 },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusChip: { borderRadius: 16 },
  detail: { marginBottom: 4, color: '#666' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  actionButton: { flex: 1, marginHorizontal: 4, borderRadius: 8 }
});
