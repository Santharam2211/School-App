import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Appbar } from 'react-native-paper';
import { logout } from '../services/auth';

import FacultyDashboard from '../screens/FacultyDashboard';
//import InformLeaveScreen from '../screens/InformLeaveScreen';
import TeacherLeavesScreen from '../screens/TeacherLeavesScreen';
import UserAnnouncementScreen from '../screens/UserAnnouncementScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TeacherTabs({ route }) {
  const { teacherId } = route?.params || {};
  const teacherName = route?.params?.name || '';
  const classNo = route?.params?.classNo || 6;
  return (
    <Tab.Navigator initialRouteName="Dashboard" screenOptions={({ route, navigation }) => ({
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
        let iconName = 'view-dashboard-outline';
        if (route.name === 'Dashboard') iconName = 'view-dashboard-outline';
        if (route.name === 'Inform Leave') iconName = 'calendar-remove';
        if (route.name === 'Approve Leaves') iconName = 'calendar-check';
        if (route.name === 'Announcement') iconName = 'calendar-check';
        if (route.name === 'Profile') iconName = 'account-circle-outline';
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      }
    })}>
      <Tab.Screen name="Dashboard" component={FacultyDashboard} initialParams={{ teacherId }} />
      {/* <Tab.Screen name="Inform Leave" component={InformLeaveScreen} /> */}
      <Tab.Screen name="Approve Leaves" component={TeacherLeavesScreen} initialParams={{ teacherId }} />
      <Tab.Screen name="Announcement" component={UserAnnouncementScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ role: 'teacher', name: teacherName, teacherId }}
      />
    </Tab.Navigator>
  );
}


