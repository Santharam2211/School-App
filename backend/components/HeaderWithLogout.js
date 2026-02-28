// components/HeaderWithLogout.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HeaderWithLogout({ title }) {
  const navigation = useNavigation();

  const handleLogout = () => {
    navigation.replace("Login"); // Navigate back to login screen
  };

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    paddingHorizontal: 20,
    backgroundColor: '#4e54c8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
  },
});
