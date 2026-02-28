import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';

const subjects = ['Math', 'Science', 'English', 'Social', 'Tamil', 'Hindi'];

export default function ClassSubjects() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState({});

  const classes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    // Fetch teacher list
    axios
      .get('http://192.168.1.44:5000/teachers') // 👈 Replace with your real IP
      .then((res) => setTeachers(res.data))
      .catch((err) => console.error('Error fetching teachers', err));
  }, []);

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    setSelectedTeachers({}); // Reset selected teachers on class change
  };

  const handleAssign = async (subject, teacherId) => {
    try {
      await axios.post('http://192.168.1.44:5000/class-mapping', {
        classNum: selectedClass,
        subject,
        teacherId,
      });
      Alert.alert('Success', `Assigned ${subject} to selected teacher.`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to assign teacher.');
    }
  };

  const renderSubject = ({ item: subject }) => (
    <View style={styles.subjectRow}>
      <Text style={styles.subjectText}>{subject}</Text>
      <RNPickerSelect
        onValueChange={(value) => {
          setSelectedTeachers((prev) => ({ ...prev, [subject]: value }));
          handleAssign(subject, value);
        }}
        value={selectedTeachers[subject]}
        placeholder={{ label: 'Select Teacher', value: null }}
        items={teachers.map((t) => ({
          label: `${t.name} (${t.subject})`,
          value: t._id,
        }))}
        style={pickerSelectStyles}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Class</Text>
      <FlatList
        horizontal
        data={classes}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleClassSelect(item)}
            style={[
              styles.classButton,
              selectedClass === item && styles.selectedClassButton,
            ]}>
            <Text style={styles.classText}>Class {item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {selectedClass && (
        <>
          <Text style={styles.subHeader}>
            Assign Teachers – Class {selectedClass}
          </Text>
          <FlatList
            data={subjects}
            keyExtractor={(item) => item}
            renderItem={renderSubject}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10 },
  header: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  subHeader: { fontSize: 16, fontWeight: '600', marginVertical: 15 },
  classButton: {
    backgroundColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginRight: 10,
  },
  selectedClassButton: {
    backgroundColor: '#4e54c8',
  },
  classText: {
    color: '#000',
    fontWeight: 'bold',
  },
  subjectRow: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    elevation: 2,
  },
  subjectText: {
    fontSize: 16,
    marginBottom: 8,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 6,
    color: 'black',
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 6,
    color: 'black',
    backgroundColor: '#fff',
  },
};
