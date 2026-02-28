import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

export default function AddTeacher() {
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!roll || !name || !className || !phone) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await axios.post('http://192.168.1.44:5000/teacher', {
        roll, name, class: className, phone
      });
      Alert.alert('Success', 'Student added');
      setRoll('');
      setName('');
      setClassName('');
      setPhone('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add student');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Roll No" style={styles.input} value={roll} onChangeText={setRoll} />
      <TextInput placeholder="Name" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Class (1-10)" style={styles.input} value={className} onChangeText={setClassName} />
      <TextInput placeholder="Phone Number" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Button title="Add Student" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});
