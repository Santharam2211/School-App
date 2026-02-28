import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, Alert, StyleSheet } from "react-native";
import { TextInput, Button, Text, Card, Divider } from "react-native-paper";
import axios from "axios";
import { BASE_URL } from "../config";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // --- Validation Alerts ---
    if (!username.trim() && !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your username and password to continue.");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Missing Username", "Please enter your username.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Missing Password", "Please enter your password.");
      return;
    }

    // --- Demo user check ---
    const demoUsers = [
      { username: "admin", password: "admin123", role: "admin" },
      { username: "teacher1", password: "teacher123", role: "teacher" },
      { username: "student1", password: "student123", role: "student" },
      { username: "test1", password: "test1", role: "student" },
    ];
    const match = demoUsers.find(
      (u) => u.username === username.trim() && u.password === password.trim()
    );
    if (match) {
      Alert.alert(
        "Login Successful ✅",
        `Welcome back! Logging you in as ${match.role}.`,
        [
          {
            text: "Continue",
            onPress: () => {
              if (match.role === "admin") navigation.replace("Admin");
              if (match.role === "teacher") navigation.navigate("Teacher", { teacherId: match.username });
              if (match.role === "student") navigation.replace("Student", { classNo: 6 });
            },
          },
        ]
      );
      return;
    }

    // --- Backend auth with a short timeout so the app doesn't hang ---
    setLoading(true);
    try {
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();
      const response = await axios.post(
        `${BASE_URL}/login`,
        { username: cleanUsername, password: cleanPassword },
        { timeout: 5000 }
      );

      const role = response?.data?.role;
      const userId = response?.data?._id;
      const passwordIsDefault = !!response?.data?.passwordIsDefault;
      const studentData = response?.data?.studentData;

      if (role === "admin") {
        Alert.alert("Login Successful ✅", "Welcome, Admin!", [
          { text: "Continue", onPress: () => navigation.replace("Admin") },
        ]);
      } else if (role === 'teacher') {
        const teacherName = response?.data?.name || '';
        Alert.alert('Login Successful ✅', 'Welcome, Teacher!', [
          { text: 'Continue', onPress: () => navigation.navigate('Teacher', { teacherId: userId, name: teacherName }) },
        ]);
      } else if (role === "student") {
        if (passwordIsDefault) {
          Alert.alert(
            "Change Password Required 🔒",
            "Your account is using a default password. Please update it to continue.",
            [{ text: "OK", onPress: () => navigation.navigate("ChangePassword", { _id: userId }) }]
          );
          return;
        }
        let classNo = 6;
        let studentInfo = studentData;
        if (!studentData) {
          try {
            const studentResponse = await axios.get(`${BASE_URL}/api/students/${userId}`);
            studentInfo = studentResponse?.data;
            classNo = studentInfo?.stuClass || 6;
          } catch (studentError) {
            console.log("Student info not found, using defaults");
          }
        } else {
          classNo = studentData.stuClass || 6;
        }
        Alert.alert("Login Successful ✅", "Welcome, Student!", [
          {
            text: "Continue",
            onPress: () =>
              navigation.replace("Student", {
                classNo,
                _id: userId,
                studentId: userId,
                studentData: studentInfo,
              }),
          },
        ]);
      } else {
        Alert.alert("Login Failed", "Your account has an unknown role. Please contact admin.");
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        Alert.alert(
          "Login Failed ❌",
          "Incorrect username or password. Please try again.",
          [{ text: "Try Again" }]
        );
      } else if (error.code === "ECONNABORTED") {
        Alert.alert(
          "Connection Timeout ⏱️",
          "The server took too long to respond. Please check your connection and try again."
        );
      } else {
        Alert.alert(
          "Server Unreachable 🌐",
          "Could not connect to the server. Please check your internet connection or try the demo credentials."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Card style={styles.card} elevation={6}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              📚 School App
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sign in to continue
            </Text>

            <TextInput
              label="Username"
              mode="outlined"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              outlineColor="#ff7a00"
              activeOutlineColor="#ff7a00"
              theme={{ roundness: 10 }}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                outlineColor="#ff7a00"
                activeOutlineColor="#ff7a00"
                theme={{ roundness: 10 }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                mode="text"
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeButton}
                icon={passwordVisible ? 'eye-off' : 'eye'}
                textColor="#ff7a00"
              />
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              icon={loading ? undefined : "login"}
              buttonColor="#ff7a00"
              textColor="#ffffff"
              loading={loading}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            {/* removed demo credentials block */}
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fef6f0", // soft background shade
  },
  inner: {
    padding: 20,
    alignItems: "center",
  },
  card: {
    borderRadius: 20,
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    width: "100%",
    maxWidth: 380,
  },
  title: {
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "bold",
    color: "#ff7a00",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  input: {
    marginBottom: 15,
    backgroundColor: "#ffffff",
  },
  button: {
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
    elevation: 3,
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 15,
    zIndex: 1,
    minWidth: 40,
  },

});
