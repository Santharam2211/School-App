// AdminTimetable.js
import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { Card, Text, Button, TextInput } from "react-native-paper";
import axios from "axios";
import { API_BASE } from "../config";

export default function AdminTimetable({ navigation }) {
  const CLASSES = [1,2,3,4,5,6,7,8,9,10];

  return (
    <ScrollView style={{ padding: 10, backgroundColor: '#ffffff' }}>
      <Text variant="headlineMedium" style={{ color: '#ff7a00', textAlign: 'center', marginBottom: 20 }}>Select Class</Text>
      {CLASSES.map(cls => (
        <TouchableOpacity 
          key={cls} 
          onPress={() => navigation.navigate("AdminClassTimetable", { stuClass: cls, day: "Monday" })}
        >
          <Card style={{ 
            margin: 8, 
            padding: 16, 
            backgroundColor: '#f8f9fa',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}>
            <Text variant="titleLarge" style={{ color: '#ff7a00', textAlign: 'center' }}>Class {cls}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
