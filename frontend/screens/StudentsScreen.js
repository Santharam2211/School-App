// frontend/screens/StudentsScreen.js
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  TextInput,
  Button,
  IconButton,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import axios from 'axios';
import { API_BASE } from '../config';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../services/auth';

export default function StudentsScreen() {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const classOffsets = useRef({}); // To store Y offsets of class cards

  // ... existing gradient code ...
  let LinearGradientComp = View;
  try {
    LinearGradientComp = require('expo-linear-gradient').LinearGradient || View;
  } catch (e) {
    LinearGradientComp = View;
  }

  const API = (API_BASE ? API_BASE.replace(/\/$/, '') : 'http://localhost:5000/api');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // form state
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [stuClass, setStuClass] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // filter state
  const [filterName, setFilterName] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // validation errors
  const [errors, setErrors] = useState({});

  function handleClearAll() {
    setEditingId(null);
    setName('');
    setRollNo('');
    setStuClass('');
    setMobile('');
    setPassword('');
    setFilterName('');
    setFilterClass('');
    setErrors({});
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/students`);
      setStudents(res.data || []);
    } catch (err) {
      console.warn('Load students failed', err?.message || err);
      setStudents([]);
      Alert.alert('Network', 'Unable to load students from server. Check backend or network.');
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name required';
    if (!rollNo.trim()) e.rollNo = 'Roll number required';
    if (!stuClass.trim() || isNaN(stuClass) || +stuClass < 1 || +stuClass > 10) {
      e.stuClass = 'Class must be between 1–10';
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = 'Enter valid 10-digit mobile';
    if (!password.trim() || password.trim().length < 4) e.password = 'Password min 4 chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveStudent() {
    if (!validate()) return;
    const normalizedRoll = rollNo.trim();
    const normalizedClass = String(stuClass).trim();
    const normalizedName = name.trim();
    const normalizedMobile = mobile.trim();
    const normalizedPassword = password.trim();

    const duplicate = students.find(s => String(s.rollNo) === normalizedRoll && s._id !== editingId);
    if (duplicate) {
      setErrors(prev => ({ ...prev, rollNo: 'Roll number already exists' }));
      Alert.alert('Duplicate', 'A student with this roll number already exists.');
      return;
    }

    const payload = {
      name: normalizedName,
      rollNo: normalizedRoll,
      stuClass: normalizedClass,
      mobile: normalizedMobile,
      password: normalizedPassword
    };

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/students/${editingId}`, payload);
        setStudents(prev => prev.map(s => (s._id === editingId ? { ...s, ...payload } : s)));
        Alert.alert('Student Updated ✅', `${normalizedName}'s details updated.`, [{ text: 'OK', onPress: handleClearAll }]);
      } else {
        const res = await axios.post(`${API}/students`, payload);
        setStudents(prev => [...prev, res.data || payload]);
        Alert.alert('Student Added ✅', `${normalizedName} added successfully.`, [{ text: 'OK', onPress: handleClearAll }]);
      }
    } catch (err) {
      Alert.alert('Save Failed ❌', 'Unable to save student.');
    } finally {
      setSaving(false);
    }
  }

  function editStudent(s) {
    setEditingId(s._id);
    setName(s.name || '');
    setRollNo(String(s.rollNo || ''));
    setStuClass(String(s.stuClass || ''));
    setMobile(s.mobile || '');
    setPassword('');
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function confirmDelete(s) {
    Alert.alert('Delete Student 🗑️', `Delete ${s.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API}/students/${s._id}`);
            setStudents(prev => prev.filter(x => x._id !== s._id));
            Alert.alert('Deleted ✅', `${s.name} removed.`);
          } catch (err) {
            Alert.alert('Delete Failed ❌', 'Could not delete student.');
          }
        }
      }
    ]);
  }

  const classGroups = useMemo(() => {
    let list = (students || []).slice();
    if (filterName.trim()) list = list.filter(s => (s.name || '').toLowerCase().includes(filterName.toLowerCase()));
    if (filterClass.trim()) list = list.filter(s => String(s.stuClass) === filterClass.trim());
    const grouped = {};
    list.forEach(s => {
      const cls = parseInt(s.stuClass, 10);
      if (!grouped[cls]) grouped[cls] = [];
      grouped[cls].push(s);
    });
    return Object.keys(grouped).map(Number).sort((a, b) => a - b).map(cls => ({
      classNum: cls,
      students: grouped[cls].sort((a, b) => (parseInt(a.rollNo, 10) || 0) - (parseInt(b.rollNo, 10) || 0))
    }));
  }, [students, filterName, filterClass]);

  const scrollToClass = (cls) => {
    const offset = classOffsets.current[cls];
    if (offset !== undefined) {
      scrollRef.current?.scrollTo({ y: offset, animated: true });
    } else {
      Alert.alert('Notice', `No students found for Class ${cls}`);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#ff7a00" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6fb' }}>
      <LinearGradientComp colors={['#ff7a00', '#ff3d00']} style={{ paddingTop: 40, paddingBottom: 8, backgroundColor: '#ff7a00' }}>
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.Content title="📘 Students" subtitle={`Total: ${students.length}`} titleStyle={{ color: '#fff', fontWeight: 'bold' }} />
          <Appbar.Action icon="logout" color="#fff" onPress={() => logout(navigation)} />
        </Appbar.Header>

        {/* Quick Jump Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jumpBar} contentContainerStyle={{ paddingHorizontal: 12 }}>
          <Text style={styles.jumpLabel}>Go to:</Text>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(c => (
            <Button
              key={c}
              mode="contained"
              compact
              style={styles.jumpBtn}
              labelStyle={styles.jumpBtnText}
              onPress={() => scrollToClass(c)}
            >
              C{c}
            </Button>
          ))}
        </ScrollView>
      </LinearGradientComp>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Card style={styles.formCard}>
            <Card.Title title={editingId ? '✏️ Edit Student' : '➕ Add Student'} titleStyle={{ fontWeight: 'bold' }} />
            <Card.Content>
              <TextInput label="Student Name" mode="outlined" value={name} onChangeText={setName} error={!!errors.name} style={styles.input} />
              <TextInput label="Roll No" mode="outlined" value={rollNo} onChangeText={setRollNo} error={!!errors.rollNo} style={styles.input} />
              <TextInput label="Class (1-10)" mode="outlined" keyboardType="numeric" value={stuClass} onChangeText={setStuClass} error={!!errors.stuClass} style={styles.input} />
              <TextInput label="Mobile" mode="outlined" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} error={!!errors.mobile} style={styles.input} />
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                right={<TextInput.Icon icon={passwordVisible ? 'eye-off' : 'eye'} onPress={() => setPasswordVisible(!passwordVisible)} />}
              />
              <View style={styles.btnRow}>
                <Button mode="contained" onPress={handleClearAll} style={styles.clearButton}>Clear</Button>
                <Button mode="contained" onPress={saveStudent} style={styles.addButton} loading={saving}>{editingId ? 'Save' : 'Add'}</Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.filterCard}>
            <Card.Content>
              <TextInput placeholder="🔍 Search name..." mode="outlined" value={filterName} onChangeText={setFilterName} style={styles.input} />
            </Card.Content>
          </Card>

          {classGroups.map(group => (
            <View
              key={group.classNum}
              onLayout={(e) => { classOffsets.current[group.classNum] = e.nativeEvent.layout.y; }}
            >
              <Card style={styles.classCard}>
                <View style={styles.classCardHeader}>
                  <Text style={styles.classCardTitle}>Class {group.classNum}</Text>
                  <View style={styles.classBadge}><Text style={styles.classBadgeText}>{group.students.length}</Text></View>
                </View>
                <Card.Content>
                  {group.students.map((item, idx) => (
                    <View key={item._id}>
                      <View style={styles.studentRow}>
                        <View style={styles.rollBubble}><Text style={styles.rollText}>{item.rollNo}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.studentName}>{item.name}</Text>
                          <Text style={styles.studentDetails}>📱 {item.mobile}</Text>
                        </View>
                        <IconButton icon="pencil" size={20} iconColor="#ff7a00" onPress={() => editStudent(item)} />
                        <IconButton icon="delete" size={20} iconColor="#d32f2f" onPress={() => confirmDelete(item)} />
                      </View>
                      {idx < group.students.length - 1 && <Divider />}
                    </View>
                  ))}
                </Card.Content>
              </Card>
            </View>
          ))}
          {classGroups.length === 0 && <Text style={styles.emptyText}>No students found.</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  jumpBar: { marginBottom: 8, flexDirection: 'row' },
  jumpLabel: { color: '#fff', fontWeight: 'bold', alignSelf: 'center', marginRight: 8, fontSize: 13 },
  jumpBtn: { marginRight: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 15 },
  jumpBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 40 },
  content: { width: '100%', maxWidth: 800, alignSelf: 'center' },
  formCard: { marginBottom: 12, borderRadius: 12, elevation: 3 },
  filterCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  input: { marginBottom: 8, backgroundColor: '#fff' },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  clearButton: { backgroundColor: '#444', marginRight: 8, borderRadius: 20 },
  addButton: { backgroundColor: '#ff7a00', borderRadius: 20 },
  classCard: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', elevation: 3 },
  classCardHeader: { backgroundColor: '#ff7a00', padding: 10, flexDirection: 'row', alignItems: 'center' },
  classCardTitle: { color: '#fff', fontWeight: 'bold', flex: 1, fontSize: 16 },
  classBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  classBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rollBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff3e0', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: '#ff7a00' },
  rollText: { color: '#ff7a00', fontWeight: 'bold', fontSize: 12 },
  studentName: { fontWeight: 'bold', fontSize: 14 },
  studentDetails: { color: '#777', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#aaa' }
});
