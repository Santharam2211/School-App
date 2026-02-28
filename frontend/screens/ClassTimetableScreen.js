import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Platform } from "react-native";
import { Card, Text, Button, Menu, Divider } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import { API_BASE } from "../config";
import { logout } from '../services/auth';

export default function ClassTimetableScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { classId } = route.params;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = [0, 1, 2, 3, 4, 5, 6];

  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [teacherMap, setTeacherMap] = useState({});
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState({});

  // ✅ Capitalize helper
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, teacherRes, timetableRes] = await Promise.all([
          axios.get(`${API_BASE}/assignments`),
          axios.get(`${API_BASE}/teachers`),
          axios.get(`${API_BASE}/timetable/${classId}`),
        ]);

        setAssignments(assignRes.data || {});
        setTeacherMap(
          teacherRes.data.reduce((acc, t) => {
            acc[t._id] = t;
            return acc;
          }, {})
        );

        // Use specific subject names instead of loading from assignments
        const specificSubjects = ['Tamil', 'English', 'Maths', 'Science', 'SST'];
        setSubjects(specificSubjects);

        // ✅ Convert lowercase keys (from DB) to capitalized (for frontend)
        const backendTimetable = timetableRes.data?.timetable || {};
        const formattedTimetable = Object.keys(backendTimetable).reduce((acc, key) => {
          acc[capitalize(key)] = backendTimetable[key];
          return acc;
        }, {});

        setTimetable(formattedTimetable);
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const handleChange = (day, hour, subject) => {
    setTimetable((prev) => {
      const dayHours = prev[day] ? [...prev[day]] : [];
      const updated = dayHours.filter((h) => h.hour !== hour);

      if (subject) {
        updated.push({ hour, subject });
      }

      return { ...prev, [day]: updated };
    });
  };

  const assignTeacher = async (subject, teacherId) => {
    try {
      console.log('Assigning teacher:', { subject, teacherId, classId });
      
      // Get current assignments for this class
      const currentAssignment = assignments[classId] || {};
      const currentSubjects = currentAssignment.subjects || {};
      
      // Create new subjects object with the updated assignment
      const nextSubjects = { ...currentSubjects, [subject]: teacherId };
      
      console.log('Current subjects:', currentSubjects);
      console.log('Next subjects:', nextSubjects);

      // Update backend
      await axios.put(`${API_BASE}/assignments/${classId}`, { subjects: nextSubjects });
      
      // Update local state
      setAssignments(prev => ({ 
        ...prev, 
        [classId]: { 
          ...prev[classId], 
          subjects: nextSubjects 
        } 
      }));
      
      console.log('Teacher assignment successful');
    } catch (err) {
      console.error('assign save failed', err);
      alert('Failed to assign teacher: ' + err.message);
    }
  };

  const saveTimetable = async () => {
    try {
      // ✅ Convert capitalized keys back to lowercase and add teacher assignments
      const normalizedTimetable = Object.keys(timetable).reduce((acc, day) => {
        const daySlots = timetable[day].map(slot => {
          // Get the teacher assigned to this subject
          const teacherId = assignments?.[classId]?.subjects?.[slot.subject];
          
          return {
            ...slot,
            teacher: teacherId || null // Add teacher field to each slot
          };
        });
        
        acc[day.toLowerCase()] = daySlots;
        return acc;
      }, {});

      await axios.put(`${API_BASE}/timetable/${classId}`, {
        timetable: normalizedTimetable,
      });

      alert("Timetable saved successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Error saving timetable:", err);
      alert("Failed to save timetable");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          {days.map((day) => (
            <Card key={day} style={styles.card}>
              <Card.Title title={day} titleStyle={styles.dayTitle} />
              <Card.Content>
                {hours.map((hour) => {
                  const subject =
                    timetable?.[day]?.find((h) => h.hour === hour)?.subject || "";
                  const teacherId = assignments?.[classId]?.subjects?.[subject];
                  const teacher = teacherMap[teacherId];

                  return (
                    <View key={hour} style={[styles.row, { zIndex: 1000 - hour }]}>
                      <View style={styles.rowHeader}>
                        <Text style={styles.hourText}>Hour {hour + 1}</Text>
                        {teacher ? (
                          <Text style={styles.teacherInline}>👨‍🏫 {teacher.name}</Text>
                        ) : null}
                      </View>

                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={subject}
                          onValueChange={(val) => handleChange(day, hour, val)}
                          style={styles.picker}
                          mode="dropdown"
                          dropdownIconColor="#ff7a00"
                          itemStyle={Platform.OS === 'ios' ? { fontSize: 16, height: 50 } : undefined}
                        >
                          <Picker.Item label="Select Subject" value="" />
                          {subjects.map((s) => (
                            <Picker.Item key={s} label={s} value={s} />
                          ))}
                        </Picker>
                      </View>

                      {subject && (
                        <View style={styles.teacherAssignment}>
                          {teacher ? (
                            <View style={styles.assignedTeacherContainer}>
                              <Text style={styles.assignedTeacherText}>
                                👨‍🏫 {teacher.name}
                              </Text>
                              <Menu
                                visible={!!menuOpen[`${day}_${hour}`]}
                                onDismiss={() =>
                                  setMenuOpen(prev => ({
                                    ...prev,
                                    [`${day}_${hour}`]: false,
                                  }))
                                }
                                anchor={
                                  <Button
                                    mode="contained-tonal"
                                    buttonColor="#4caf50"
                                    textColor="#fff"
                                    onPress={() =>
                                      setMenuOpen(prev => ({
                                        ...prev,
                                        [`${day}_${hour}`]: true,
                                      }))
                                    }
                                    style={styles.changeTeacherBtn}
                                  >
                                    Change
                                  </Button>
                                }
                              >
                                {Object.values(teacherMap).map(t => (
                                  <Menu.Item
                                    key={t._id || t.id}
                                    title={`${t.name} (${t.teacherId || ''})`}
                                    onPress={() => {
                                      console.log('Teacher selected:', t);
                                      assignTeacher(subject, t._id || t.id);
                                      setMenuOpen(prev => ({
                                        ...prev,
                                        [`${day}_${hour}`]: false,
                                      }));
                                    }}
                                  />
                                ))}
                                <Divider />
                                <Menu.Item
                                  title="Unassign"
                                  onPress={() => {
                                    console.log('Unassigning teacher for subject:', subject);
                                    assignTeacher(subject, null);
                                    setMenuOpen(prev => ({
                                      ...prev,
                                      [`${day}_${hour}`]: false,
                                    }));
                                  }}
                                />
                              </Menu>
                            </View>
                          ) : (
                            <View style={styles.noTeacherContainer}>
                        <Text style={styles.warning}>⚠️ No teacher assigned</Text>
                              <Menu
                                visible={!!menuOpen[`${day}_${hour}`]}
                                onDismiss={() =>
                                  setMenuOpen(prev => ({
                                    ...prev,
                                    [`${day}_${hour}`]: false,
                                  }))
                                }
                                anchor={
                                  <Button
                                    mode="contained"
                                    buttonColor="#ff7a00"
                                    textColor="#fff"
                                    onPress={() =>
                                      setMenuOpen(prev => ({
                                        ...prev,
                                        [`${day}_${hour}`]: true,
                                      }))
                                    }
                                    style={styles.assignTeacherBtn}
                                  >
                                    Assign Teacher
                                  </Button>
                                }
                              >
                                {Object.values(teacherMap).map(t => (
                                  <Menu.Item
                                    key={t._id || t.id}
                                    title={`${t.name} (${t.teacherId || ''})`}
                                    onPress={() => {
                                      console.log('Teacher selected (no teacher case):', t);
                                      assignTeacher(subject, t._id || t.id);
                                      setMenuOpen(prev => ({
                                        ...prev,
                                        [`${day}_${hour}`]: false,
                                      }));
                                    }}
                                  />
                                ))}
                              </Menu>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </Card.Content>
            </Card>
          ))}

          <Button
            mode="contained"
            icon="content-save"
            style={styles.saveBtn}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{ fontWeight: "700", letterSpacing: 0.5 }}
            onPress={saveTimetable}
          >
            Save Timetable
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { padding: 10, paddingBottom: 24 },
  content: { width: "100%", maxWidth: 960, alignSelf: "center" },
  card: {
    marginVertical: 10,
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
  dayTitle: { fontWeight: "700", fontSize: 18, color: "#ff7a00" },
  row: {
    marginVertical: 8,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e3f2fd",
    // Ensure dropdowns render above following rows on Android
    elevation: 1,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerWrapper: {
    borderWidth: 2,
    borderRadius: 14,
    borderColor: "#ff7a00",
    backgroundColor: "#fff8f0",
    marginTop: 8,
    paddingHorizontal: 10,
    minHeight: 52,
    justifyContent: 'center',
    // iOS needs zIndex on the picker container for stacked dropdowns
    zIndex: 10,
  },
  picker: { height: 50, color: "#333", width: '100%' },
  hourText: { fontSize: 15, fontWeight: "bold", color: "#ff7a00" },
  teacherInline: { fontSize: 13, color: '#4caf50', fontWeight: '500' },
  teacher: { fontSize: 14, color: "#4caf50", marginTop: 4, fontWeight: "500" },
  warning: { fontSize: 14, color: "#f44336", marginTop: 4, fontWeight: "500" },
  teacherAssignment: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  assignedTeacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignedTeacherText: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "500",
    flex: 1,
  },
  noTeacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeTeacherBtn: {
    marginLeft: 8,
  },
  assignTeacherBtn: {
    marginLeft: 8,
  },
  saveBtn: {
    marginVertical: 16,
    backgroundColor: "#ff7a00",
    borderRadius: 8,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
