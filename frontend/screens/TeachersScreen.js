import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Appbar, Card, TextInput, Button, Text, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import axios from 'axios';
import { API_BASE } from '../config';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../services/auth';

export default function TeachersScreen() {
  const navigation = useNavigation();
  const scrollRef = useRef(null);

  let LinearGradientComp = View;
  try {
    LinearGradientComp = require('expo-linear-gradient').LinearGradient || View;
  } catch (e) {
    LinearGradientComp = View;
  }

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // form state
  const [teacherId, setTeacherId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [filterName, setFilterName] = useState('');

  function handleClearAll() {
    setEditingId(null);
    setTeacherId('');
    setName('');
    setMobile('');
    setEmail('');
    setPassword('');
    setHomeAddress('');
    setErrors({});
  }

  useEffect(() => { loadTeachers(); }, []);

  async function loadTeachers() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/teachers`);
      setTeachers(res.data || []);
    } catch (err) {
      console.warn('Teachers load failed', err.message);
      setTeachers([]);
      Alert.alert('Network Error 🌐', 'Unable to load teachers.');
    } finally { setLoading(false); }
  }

  function validate() {
    const e = {};
    if (!teacherId.trim()) e.teacherId = 'ID required';
    if (!name.trim()) e.name = 'Name required';
    if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = 'Invalid mobile';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!password || password.length < 6) e.password = 'Min 6 chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveTeacher() {
    if (!validate()) return;
    const trimmedName = name.trim();
    const payload = {
      teacherId: teacherId.trim(),
      name: trimmedName,
      mobile,
      email: email.trim(),
      homeAddress: homeAddress.trim(),
      password,
      emailVerificationCode: "123456",
      emailVerified: true,
    };
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/teachers/${editingId}`, payload);
        setTeachers(prev => prev.map(t => t._id === editingId ? { ...t, ...payload } : t));
        Alert.alert('Updated ✅', `${trimmedName} updated.`, [{ text: 'OK', onPress: handleClearAll }]);
      } else {
        const res = await axios.post(`${API_BASE}/teachers`, payload);
        setTeachers(prev => [...prev, res.data]);
        Alert.alert('Added ✅', `${trimmedName} added.`, [{ text: 'OK', onPress: handleClearAll }]);
      }
    } catch (err) {
      Alert.alert('Save Failed ❌', 'Check network or duplicate ID.');
    } finally { setSaving(false); }
  }

  function startEdit(t) {
    setEditingId(t._id);
    setTeacherId(t.teacherId);
    setName(t.name);
    setMobile(t.mobile || '');
    setEmail(t.email || '');
    setHomeAddress(t.homeAddress || '');
    setPassword('');
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function confirmDelete(t) {
    Alert.alert('Delete Teacher 🗑️', `Delete ${t.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE}/teachers/${t._id}`);
            setTeachers(prev => prev.filter(x => x._id !== t._id));
          } catch (err) { Alert.alert('Error', 'Delete failed.'); }
        }
      }
    ]);
  }

  const filteredTeachers = useMemo(() => {
    let list = (teachers || []).slice();
    if (filterName.trim()) {
      const q = filterName.toLowerCase();
      list = list.filter(t => (t.name || '').toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.name || '').localeCompare((b.name || '')));
  }, [teachers, filterName]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#ff7a00" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6fb' }}>
      <LinearGradientComp colors={['#ff7a00', '#ff3d00']} style={{ paddingTop: 40, paddingBottom: 8, backgroundColor: '#ff7a00' }}>
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.Content title="👨‍🏫 Teachers" subtitle={`Total: ${teachers.length}`} titleStyle={{ color: '#fff', fontWeight: 'bold' }} />
          <Appbar.Action icon="logout" color="#fff" onPress={() => logout(navigation)} />
        </Appbar.Header>
      </LinearGradientComp>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Card style={styles.formCard}>
            <Card.Title title={editingId ? '✏️ Edit Teacher' : '➕ Add Teacher'} titleStyle={{ fontWeight: 'bold' }} />
            <Card.Content>
              <TextInput label="Teacher ID" mode="outlined" value={teacherId} onChangeText={setTeacherId} style={styles.input} error={!!errors.teacherId} />
              <TextInput label="Name" mode="outlined" value={name} onChangeText={setName} style={styles.input} error={!!errors.name} />
              <TextInput label="Email" mode="outlined" value={email} onChangeText={setEmail} style={styles.input} error={!!errors.email} />
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                right={<TextInput.Icon icon={passwordVisible ? 'eye-off' : 'eye'} onPress={() => setPasswordVisible(!passwordVisible)} />}
              />
              <TextInput label="Mobile" mode="outlined" value={mobile} onChangeText={setMobile} style={styles.input} keyboardType="phone-pad" />
              <TextInput label="Address" mode="outlined" value={homeAddress} onChangeText={setHomeAddress} style={styles.input} multiline />

              <View style={styles.btnRow}>
                <Button mode="contained" onPress={handleClearAll} style={styles.clearButton}>Clear</Button>
                <Button mode="contained" onPress={saveTeacher} style={styles.addButton} loading={saving}>{editingId ? 'Save' : 'Add'}</Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.filterCard}>
            <Card.Content>
              <TextInput placeholder="🔍 Search teacher..." mode="outlined" value={filterName} onChangeText={setFilterName} style={styles.input} />
            </Card.Content>
          </Card>

          <View style={styles.countRow}>
            <Text style={styles.countText}>Total Teachers: {teachers.length}</Text>
            <Text style={styles.countText}>Showing: {filteredTeachers.length}</Text>
          </View>

          <View style={styles.listContainer}>
            {filteredTeachers.map((item, idx) => (
              <View key={item._id}>
                <View style={styles.studentRow}>
                  <View style={styles.rollBubble}><Text style={styles.rollText}>{(item.name || '').charAt(0)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentDetails}>ID: {item.teacherId} • 📱 {item.mobile}</Text>
                  </View>
                  <IconButton icon="pencil" size={20} iconColor="#ff7a00" onPress={() => startEdit(item)} />
                  <IconButton icon="delete" size={20} iconColor="#d32f2f" onPress={() => confirmDelete(item)} />
                </View>
                {idx < filteredTeachers.length - 1 && <Divider />}
              </View>
            ))}
          </View>
          {filteredTeachers.length === 0 && <Text style={styles.emptyText}>No teachers found.</Text>}
        </View>
      </ScrollView>
    </View>
  );
 }

 const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 40 },
  content: { width: '100%', maxWidth: 800, alignSelf: 'center' },
  formCard: { marginBottom: 12, borderRadius: 12, elevation: 3 },
  filterCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  countText: { color: '#555', fontWeight: '600' },
  input: { marginBottom: 8, backgroundColor: '#fff' },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  clearButton: { backgroundColor: '#444', marginRight: 8, borderRadius: 20 },
  addButton: { backgroundColor: '#ff7a00', borderRadius: 20 },
  listContainer: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, elevation: 2 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rollBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff3e0', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: '#ff7a00' },
  rollText: { color: '#ff7a00', fontWeight: 'bold', fontSize: 12 },
  studentName: { fontWeight: 'bold', fontSize: 14 },
  studentDetails: { color: '#777', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#aaa' }
 });
