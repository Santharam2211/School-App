import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Appbar, Card, Text, Button, Menu, Divider } from 'react-native-paper';
import { logout } from '../services/auth';
import axios from 'axios';
import { API_BASE } from '../config';
import { useNavigation } from '@react-navigation/native';

const SUBJECTS = ['English', 'Tamil', 'Maths', 'Science', 'SST'];
const CLASSES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function AssignmentsScreen() {
  const navigation = useNavigation();
  const [assignments, setAssignments] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [menuOpen, setMenuOpen] = useState({});

  useEffect(() => {
    loadTeachers();
    loadAssignments();
  }, []);

  async function loadTeachers() {
    try {
      const res = await axios.get(`${API_BASE}/teachers`);
      setTeachers(res.data || []);
    } catch (err) {
      console.warn('teachers load failed', err.message);
      setTeachers([]);
      Alert.alert('Network Error 🌐', 'Unable to load teachers. Please check your connection.');
    }
  }

  async function loadAssignments() {
    try {
      const res = await axios.get(`${API_BASE}/assignments`);
      console.log('Loaded assignments from backend:', res.data);
      setAssignments(res.data || createEmpty());
    } catch (err) {
      console.warn('assign load failed', err.message);
      setAssignments(createEmpty());
    }
  }

  function createEmpty() {
    const base = {};
    CLASSES.forEach(
      c =>
      (base[c] = {
        subjects: SUBJECTS.reduce((acc, s) => ({ ...acc, [s]: null }), {}),
        classTeacher: null
      })
    );
    return base;
  }

  function toggleClass(c) {
    setExpanded(prev => ({ ...prev, [c]: !prev[c] }));
  }

  async function assignTeacher(stuClass, subject, teacherId) {
    const teacher = teacherId ? teacherMap[teacherId] : null;
    try {
      const currentAssignment = assignments[stuClass] || {};
      const currentSubjects = currentAssignment.subjects || {};
      const nextSubjects = { ...currentSubjects, [subject]: teacherId };

      await axios.put(`${API_BASE}/assignments/${stuClass}`, { subjects: nextSubjects });

      setAssignments(prev => ({
        ...prev,
        [stuClass]: { ...prev[stuClass], subjects: nextSubjects }
      }));

      if (teacherId && teacher) {
        Alert.alert(
          'Assignment Saved ✅',
          `${teacher.name} has been assigned to ${subject} for Class ${stuClass}.`
        );
      } else {
        Alert.alert(
          'Unassigned ✅',
          `${subject} for Class ${stuClass} has been unassigned.`
        );
      }
    } catch (err) {
      console.error('assign save failed', err);
      Alert.alert('Assignment Failed ❌', 'Failed to assign teacher. Please check your network and try again.');
    }
  }

  async function assignClassTeacher(stuClass, teacherId) {
    const teacher = teacherId ? teacherMap[teacherId] : null;
    try {
      const currentAssignment = assignments[stuClass] || {};
      const currentSubjects = currentAssignment.subjects || {};
      const updatedAssignment = { subjects: currentSubjects, classTeacher: teacherId };

      await axios.put(`${API_BASE}/assignments/${stuClass}`, updatedAssignment);

      setAssignments(prev => ({
        ...prev,
        [stuClass]: { ...prev[stuClass], subjects: currentSubjects, classTeacher: teacherId }
      }));

      if (teacherId && teacher) {
        Alert.alert(
          'Class Teacher Assigned ✅',
          `${teacher.name} is now the Class Teacher for Class ${stuClass}.`
        );
      } else {
        Alert.alert(
          'Unassigned ✅',
          `Class Teacher for Class ${stuClass} has been unassigned.`
        );
      }
    } catch (err) {
      console.error('class teacher assign save failed', err);
      Alert.alert('Assignment Failed ❌', 'Failed to assign class teacher. Please check your network and try again.');
    }
  }

  const teacherMap = useMemo(() => {
    const m = {};
    teachers.forEach(t => (m[t._id || t.id] = t));
    console.log('Teacher map created:', m);
    return m;
  }, [teachers]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fefefe' }}>
      <Appbar.Header style={{ backgroundColor: '#ff7a00' }}>
        <Appbar.Content
          title="Class Assignments"
          titleStyle={{ color: '#ffffff', fontWeight: '600' }}
        />
        <Appbar.Action icon="logout" color="#fff" onPress={() => logout(navigation)} />
      </Appbar.Header>

      <FlatList
        contentContainerStyle={styles.list}
        data={CLASSES}
        keyExtractor={i => i.toString()}
        renderItem={({ item: stuClass }) => (
          <Card style={styles.card}>
            <TouchableOpacity onPress={() => toggleClass(stuClass)}>
              <Card.Title
                title={`Class ${stuClass}`}
                titleStyle={{ fontWeight: '600', color: '#333' }}
                subtitle={
                  expanded[stuClass] ? 'Tap to collapse' : 'Tap to expand'
                }
              />
            </TouchableOpacity>

            {expanded[stuClass] && (
              <Card.Content>
                {/* Class Teacher Assignment */}
                <View style={styles.classTeacherRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classTeacherLabel}>Class Teacher</Text>
                    <Text style={styles.assignedTeacher}>
                      {(() => {
                        const classTeacherData = assignments[stuClass]?.classTeacher;

                        // Handle both populated object and ID cases
                        if (classTeacherData) {
                          if (typeof classTeacherData === 'object' && classTeacherData.name) {
                            // It's a populated object
                            return classTeacherData.name;
                          } else if (typeof classTeacherData === 'string') {
                            // It's an ID, look it up in teacherMap
                            const teacher = teacherMap[classTeacherData];
                            return teacher?.name || 'Unknown';
                          }
                        }
                        return 'Unassigned';
                      })()}
                    </Text>
                  </View>

                  <Menu
                    visible={!!menuOpen[`${stuClass}_classTeacher`]}
                    onDismiss={() =>
                      setMenuOpen(prev => ({
                        ...prev,
                        [`${stuClass}_classTeacher`]: false,
                      }))
                    }
                    anchor={
                      <Button
                        mode="contained"
                        buttonColor="#4caf50"
                        textColor="#fff"
                        onPress={() =>
                          setMenuOpen(prev => ({
                            ...prev,
                            [`${stuClass}_classTeacher`]: true,
                          }))
                        }
                      >
                        {assignments[stuClass]?.classTeacher ? 'Change' : 'Assign'}
                      </Button>
                    }
                  >
                    {teachers.map(t => (
                      <Menu.Item
                        key={t._id || t.id}
                        title={`${t.name} (${t.teacherId || ''})`}
                        onPress={() => {
                          assignClassTeacher(stuClass, t._id || t.id);
                          setMenuOpen(prev => ({
                            ...prev,
                            [`${stuClass}_classTeacher`]: false,
                          }));
                        }}
                      />
                    ))}
                    <Divider />
                    <Menu.Item
                      title="Unassign"
                      onPress={() => {
                        assignClassTeacher(stuClass, null);
                        setMenuOpen(prev => ({
                          ...prev,
                          [`${stuClass}_classTeacher`]: false,
                        }));
                      }}
                    />
                  </Menu>
                </View>

                <Divider style={{ marginVertical: 10 }} />

                {/* Subject Assignments */}
                {SUBJECTS.map(sub => {
                  const assigned = assignments[stuClass]?.subjects
                    ? assignments[stuClass].subjects[sub]
                    : null;
                  return (
                    <View key={sub} style={styles.subjectRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subjectName}>{sub}</Text>
                        <Text style={styles.assignedTeacher}>
                          {assigned
                            ? teacherMap[assigned]?.name || 'Unknown'
                            : 'Unassigned'}
                        </Text>
                      </View>

                      <Menu
                        visible={!!menuOpen[`${stuClass}_${sub}`]}
                        onDismiss={() =>
                          setMenuOpen(prev => ({
                            ...prev,
                            [`${stuClass}_${sub}`]: false,
                          }))
                        }
                        anchor={
                          <Button
                            mode="contained-tonal"
                            buttonColor="#ff7a00"
                            textColor="#fff"
                            onPress={() =>
                              setMenuOpen(prev => ({
                                ...prev,
                                [`${stuClass}_${sub}`]: true,
                              }))
                            }
                          >
                            {assigned ? 'Change' : 'Assign'}
                          </Button>
                        }
                      >
                        {teachers.map(t => (
                          <Menu.Item
                            key={t._id || t.id}
                            title={`${t.name} (${t.teacherId || ''})`}
                            onPress={() => {
                              console.log('Teacher selected in assignment screen:', { teacher: t, subject: sub, class: stuClass });
                              assignTeacher(stuClass, sub, t._id || t.id);
                              setMenuOpen(prev => ({
                                ...prev,
                                [`${stuClass}_${sub}`]: false,
                              }));
                            }}
                          />
                        ))}
                        <Divider />
                        <Menu.Item
                          title="Unassign"
                          onPress={() => {
                            console.log('Unassigning teacher for subject:', { subject: sub, class: stuClass });
                            assignTeacher(stuClass, sub, null);
                            setMenuOpen(prev => ({
                              ...prev,
                              [`${stuClass}_${sub}`]: false,
                            }));
                          }}
                        />
                      </Menu>
                    </View>
                  );
                })}

                <Divider style={{ marginTop: 10 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <Button onPress={() => toggleClass(stuClass)}>Done</Button>
                </View>
              </Card.Content>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 12,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  card: {
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  assignedTeacher: {
    fontSize: 14,
    color: '#666',
  },
  classTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#f0f8f0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  classTeacherLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
});
