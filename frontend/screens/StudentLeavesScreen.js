import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { API_BASE } from '../config';

export default function StudentLeavesScreen({ route }) {
  const studentId = route?.params?.studentId;
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    loadLeaves();
  }, [studentId]);

  async function loadLeaves() {
    if (!studentId) {
      console.log('No student ID provided');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaves?student=${studentId}`);
      const data = await res.json();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading leaves:', e);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#ff7a00" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Leave Information</Text>
      {leaves.length === 0 && <Text style={{ textAlign: 'center', color: '#666' }}>No leaves yet.</Text>}
      {leaves.map((lv, idx) => (
        <Card key={idx} style={styles.card}>
          <Card.Content>
            <Text style={styles.row}><Text style={styles.label}>Reason:</Text> {String(lv.reason || '')}</Text>
            <Text style={styles.row}><Text style={styles.label}>From:</Text> {new Date(lv.from).toDateString()}</Text>
            <Text style={styles.row}><Text style={styles.label}>To:</Text> {new Date(lv.to).toDateString()}</Text>
            {lv.status && <Text style={styles.status}>Status: {lv.status}</Text>}
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  header: { fontSize: 22, textAlign: 'center', fontWeight: 'bold', color: '#ff7a00', marginBottom: 12 },
  card: { marginBottom: 10, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  row: { marginBottom: 4 },
  label: { fontWeight: '600', color: '#333' },
  status: { marginTop: 6, color: '#555' }
});






