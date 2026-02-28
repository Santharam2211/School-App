import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';


import StudentsScreen from '../screens/StudentsScreen';
import TeachersScreen from '../screens/TeachersScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import TimetableStackNavigator from './TimetableStackNavigator';
import AdminAnnouncementScreen from '../screens/AdminAnnouncementScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator initialRouteName="Students" screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#ff7a00',
      tabBarInactiveTintColor: '#666666',
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e3f2fd',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        ...(Platform.OS !== 'web' && { marginBottom: 10 }),
      },
      tabBarIcon: ({ color, size }) => {
        let iconName = 'help-circle-outline';
        if (route.name === 'Students') iconName = 'account-group-outline';
        if (route.name === 'Teachers') iconName = 'account-tie-outline';
        if (route.name === 'Assignments') iconName = 'clipboard-list-outline';
        if (route.name === 'Timetable') iconName = 'calendar-clock-outline';
        if (route.name === 'Announcement') iconName = 'calendar-clock-outline';
        if (route.name === 'Profile') iconName = 'account-circle-outline';
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      }
    })}>
      <Tab.Screen name="Students" component={StudentsScreen} />
      <Tab.Screen name="Teachers" component={TeachersScreen} />
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="Timetable" component={TimetableStackNavigator} />
      <Tab.Screen name="Announcement" component={AdminAnnouncementScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ role: 'admin', name: 'Admin' }}
      />
    </Tab.Navigator>
  );
}
