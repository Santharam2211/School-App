/*import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { Card, TextInput, Button } from "react-native-paper";
import { API_BASE } from "../config";

export default function InformLeaveScreen() {
  const [leave, setLeave] = useState({ studentRoll: "", from: "", to: "", reason: "" });

  const informLeave = async () => {
    try {
      const res = await fetch(`${API_BASE}/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: `[${leave.studentRoll}] ${leave.reason}`,
          from: new Date(leave.from),
          to: new Date(leave.to),
        })
      });
      if (res.ok) Alert.alert("Leave informed", "Leave submitted for approval");
      else Alert.alert("Error", "Failed to submit leave");
      setLeave({ studentRoll: "", from: "", to: "", reason: "" });
    } catch (err) {
      Alert.alert("Error", "Network issue while informing leave");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Inform Leave</Text>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.fieldLabel}>Student Roll</Text>
            <TextInput mode="outlined" placeholder="Student Roll" value={leave.studentRoll} onChangeText={(t) => setLeave({ ...leave, studentRoll: t })} style={styles.input} />

            <Text style={styles.fieldLabel}>From</Text>
            <TextInput mode="outlined" placeholder="YYYY-MM-DD" value={leave.from} onChangeText={(t) => setLeave({ ...leave, from: t })} style={styles.input} />

            <Text style={styles.fieldLabel}>To</Text>
            <TextInput mode="outlined" placeholder="YYYY-MM-DD" value={leave.to} onChangeText={(t) => setLeave({ ...leave, to: t })} style={styles.input} />

            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput mode="outlined" placeholder="Reason" value={leave.reason} onChangeText={(t) => setLeave({ ...leave, reason: t })} style={styles.input} />
            <View style={styles.btnRow}>
              <Button mode="contained" onPress={() => setLeave({ studentRoll: "", from: "", to: "", reason: "" })} style={styles.clearButton} labelStyle={{ color: '#fff', fontWeight: '700' }}>Clear all</Button>
              <Button mode="contained" onPress={informLeave} style={styles.submitButton} labelStyle={{ fontWeight: '700' }}>Submit</Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20, 
    fontWeight: "bold", 
    color: '#ff7a00',
    textAlign: 'center'
  },
  card: { 
    marginBottom: 20, 
    borderRadius: 14,
    backgroundColor: '#fff',
    elevation: 3
  },
  input: { 
    marginVertical: 8,
    backgroundColor: '#fff'
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  submitButton: {
    backgroundColor: '#ff7a00',
    borderRadius: 25,
    marginTop: 10
  },
  clearButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    marginTop: 10,
    marginRight: 8
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
});


*/