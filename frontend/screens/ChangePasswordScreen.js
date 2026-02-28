import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, TextInput, Button } from 'react-native-paper';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function ChangePasswordScreen({ route, navigation }) {
  const userId = route?.params?._id;
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible1, setVisible1] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      Alert.alert('Validation', 'Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Validation', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/users/${userId}/change-password`, { newPassword: newPassword.trim() });
      Alert.alert('Success', 'Password updated');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Unable to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Change Password</Text>
          <TextInput
            label="New Password"
            mode="outlined"
            secureTextEntry={!visible1}
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
            right={<TextInput.Icon icon={visible1 ? 'eye-off' : 'eye'} onPress={() => setVisible1(v => !v)} />}
          />
          <TextInput
            label="Confirm Password"
            mode="outlined"
            secureTextEntry={!visible2}
            value={confirm}
            onChangeText={setConfirm}
            style={styles.input}
            right={<TextInput.Icon icon={visible2 ? 'eye-off' : 'eye'} onPress={() => setVisible2(v => !v)} />}
          />
          <Button mode="contained" onPress={submit} loading={loading} disabled={loading}>
            Update Password
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  card: { borderRadius: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#fff', marginBottom: 12 }
});


