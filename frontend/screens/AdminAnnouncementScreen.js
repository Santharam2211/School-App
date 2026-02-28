import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { API_BASE } from "../config";

export default function AdminAnnouncementScreen() {
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Fetch announcements when screen loads
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_BASE}/announcements`);
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      Alert.alert('Load Failed 🌐', 'Unable to fetch announcements. Please check your connection.');
    }
  };

  const postOrUpdateAnnouncement = async () => {
    if (!message.trim()) {
      Alert.alert('Missing Announcement ⚠️', 'Please enter an announcement message before submitting.');
      return;
    }

    const preview = message.trim().length > 60
      ? message.trim().substring(0, 60) + '...'
      : message.trim();

    try {
      const url = editingId
        ? `${API_BASE}/announcements/${editingId}`
        : `${API_BASE}/announcements`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), postedBy: 'admin' }),
      });

      if (response.ok) {
        Alert.alert(
          editingId ? 'Announcement Updated ✅' : 'Announcement Posted 📢',
          editingId
            ? `Your announcement has been updated:\n"${preview}"`
            : `Your announcement has been posted:\n"${preview}"`
        );
        setMessage('');
        setEditingId(null);
        fetchAnnouncements();
      } else {
        Alert.alert('Post Failed ❌', `Server returned an error (${response.status}). Please try again.`);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Network Error 🌐', 'Could not reach the server. Please check your internet connection.');
    }
  };

  const handleEdit = (id, text) => {
    setEditingId(id);
    setMessage(text);
  };

  const deleteAction = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/announcements/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        Alert.alert('Deleted ✅', 'The announcement has been removed successfully.');
        fetchAnnouncements();
      } else {
        Alert.alert('Delete Failed ❌', `Server returned an error (${response.status}). Please try again.`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      Alert.alert('Network Error 🌐', 'Could not delete the announcement. Please check your connection.');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Announcement 🗑️',
      'Are you sure you want to delete this announcement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteAction(id), style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Announcements</Text>
      </View>

      {/* Input Field */}
      <TextInput
        style={styles.input}
        placeholder="Enter announcement..."
        placeholderTextColor="#999"
        value={message}
        onChangeText={setMessage}
      />

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={postOrUpdateAnnouncement}>
        <Text style={styles.buttonText}>
          {editingId ? "Update Announcement" : "Post Announcement"}
        </Text>
      </TouchableOpacity>

      {/* Announcement List */}
      <ScrollView style={styles.list}>
        {announcements.length === 0 ? (
          <Text style={styles.noText}>No announcements yet</Text>
        ) : (
          announcements.map((a) => (
            <View key={a._id} style={styles.card}>
              <Text style={styles.cardText}>{a.message}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleEdit(a._id, a.message)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.edit}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(a._id)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#ff8c00",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    marginTop: 5,
  },
  headerText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#ff8c00",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  list: { marginTop: 25, marginHorizontal: 20 },
  noText: { textAlign: "center", color: "#999", marginTop: 20 },
  card: {
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffd699",
  },
  cardText: { fontSize: 16, color: "#333" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionBtn: {
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  edit: {
    color: "#007bff",
    fontWeight: "bold",
    marginRight: 20,
  },
  delete: {
    color: "#d9534f",
    fontWeight: "bold",
  },
});






