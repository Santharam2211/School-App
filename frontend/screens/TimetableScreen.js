import React from "react";
import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text } from "react-native-paper";

const classes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function TimetableClassesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Class Timetable</Text>

      <FlatList
        contentContainerStyle={styles.list}
        data={classes}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ClassTimetable", { classId: item })
            }
          >
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.text}>Class {item}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fefefe",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff7a00",
    textAlign: "center",
    marginBottom: 16,
  },
  list: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    paddingVertical: 6,
  },
  card: {
    marginVertical: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    paddingVertical: 12,
  },
});
