import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TimetableClassesScreen from '../screens/TimetableScreen';
import ClassTimetableScreen from '../screens/ClassTimetableScreen';
import { Appbar } from 'react-native-paper';
import ReactNative from 'react';
import { logout } from '../services/auth';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator();

export default function TimetableStackNavigator() {
  const navigation = useNavigation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ff7a00',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="TimetableClasses"
        component={TimetableClassesScreen}
        options={{ 
          title: "Select Class",
          headerRight: () => (
            <Appbar.Action icon="logout" color="#fff" onPress={() => logout(navigation)} />
          )
        }}
      />
      <Stack.Screen
        name="ClassTimetable"
        component={ClassTimetableScreen}
        options={({ route }) => ({
          title: route.params?.classId
            ? `Class ${route.params.classId} Timetable`
            : "Class Timetable",
        })}
      />
    </Stack.Navigator>
  );
}
