import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Appbar } from 'react-native-paper';
import { logout } from '../services/auth';

import StudentLeavesScreen from '../screens/StudentLeavesScreen';
import StudentRequestLeaveScreen from '../screens/StudentRequestLeaveScreen';
import StudentHomework from '../screens/StudentHomework';
import UserAnnouncementScreen from '../screens/UserAnnouncementScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function StudentTabs({ route }) {
  // Get class information from route params or use default
  const classNo = route?.params?.classNo || 6;
  const studentId = route?.params?._id || route?.params?.studentId;
  const studentData = route?.params?.studentData;
  const studentName = studentData?.name || route?.params?.name || 'Student';
  const rollNo = studentData?.rollNo || route?.params?.rollNo || '';

  return (
    <Tab.Navigator initialRouteName="Leaves" screenOptions={({ route, navigation }) => ({
      headerShown: true,
      headerStyle: { backgroundColor: '#ff7a00' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerRight: () => (
        <Appbar.Action icon="logout" color="#fff" onPress={() => logout(navigation)} />
      ),
      tabBarActiveTintColor: '#ff7a00',
      tabBarInactiveTintColor: '#666666',
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      tabBarStyle: {
        backgroundColor: '#ffffff',
        ...(Platform.OS !== 'web' && { marginBottom: 10 }),
        borderTopColor: '#e3f2fd'
      },
      tabBarIcon: ({ color, size }) => {
        let iconName = 'calendar';
        if (route.name === 'Leaves') iconName = 'calendar-check';
        if (route.name === 'Request Leave') iconName = 'calendar-plus';
        if (route.name === 'Homework') iconName = 'book-open-variant';
        if (route.name === 'Announcements') iconName = 'calendar-plus';
        if (route.name === 'Profile') iconName = 'account-circle-outline';
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      }
    })}>
      <Tab.Screen name="Leaves" component={StudentLeavesScreen} initialParams={{ studentId }} />
      <Tab.Screen name="Request Leave" component={StudentRequestLeaveScreen} initialParams={{ studentId, studentData }} />
      <Tab.Screen
        name="Homework"
        component={StudentHomework}
        initialParams={{ classNo, studentId }}
      />
      <Tab.Screen name="Announcements" component={UserAnnouncementScreen} initialParams={{ studentId, studentData }} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ role: 'student', name: studentName, rollNo }}
      />
    </Tab.Navigator>
  );
}


