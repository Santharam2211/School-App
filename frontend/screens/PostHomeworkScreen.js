import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function PostHomeworkScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Card style={styles.cardInfo}>
        <Card.Content>
          <Text style={styles.header}>Post Homework (disabled)</Text>
          <Text style={{ marginBottom: 12, color: '#555' }}>
            Posting homework from this screen is temporarily disabled. Use the Dashboard card to post homework.
          </Text>
          <Button mode="contained" onPress={() => navigation.navigate('Dashboard')} style={{ backgroundColor: '#ff7a00' }}>Go to Dashboard</Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  header: { fontSize: 20, fontWeight: '700', color: '#ff7a00', marginBottom: 8 },
  cardInfo: { borderRadius: 12, backgroundColor: '#fff', elevation: 2 }
});


