// frontend/screens/ProfileScreen.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Card, Avatar } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';

/**
 * ProfileScreen — displayed in the bottom tab for every role.
 *
 * Expected route params (passed from the navigator):
 *   • student : { role: 'student', name, rollNo }
 *   • teacher : { role: 'teacher', name, teacherId }
 *   • admin   : { role: 'admin',   name }          ← name is optional
 */
export default function ProfileScreen() {
    const route = useRoute();
    const params = route.params || {};

    const role = params.role || 'user';
    const name = params.name || 'User';
    const rollNo = params.rollNo || params.studentId || '';
    const teacherId = params.teacherId || '';

    // Decide avatar letter and accent colour per role
    const avatarLetter = name.charAt(0).toUpperCase() || 'U';
    const accent =
        role === 'admin' ? '#ff7a00' : role === 'teacher' ? '#ff7a00' : '#ff7a00';

    // Label for the ID row
    const idLabel =
        role === 'student'
            ? 'Roll Number'
            : role === 'teacher'
                ? 'Teacher ID'
                : 'Role';

    const idValue =
        role === 'student'
            ? rollNo || '—'
            : role === 'teacher'
                ? teacherId || '—'
                : 'Administrator';

    return (
        <View style={styles.screen}>
            <View style={[styles.banner, { backgroundColor: accent }]}>
                <Avatar.Text
                    size={80}
                    label={avatarLetter}
                    style={[styles.avatar, { backgroundColor: '#fff' }]}
                    labelStyle={{ color: accent, fontWeight: 'bold', fontSize: 34 }}
                />
                <Text style={styles.roleChip}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
            </View>

            <Card style={styles.card} elevation={4}>
                <Card.Content>
                    {/* Name row */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={[styles.value, styles.nameValue]}>{name}</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* ID / Roll row */}
                    <View style={styles.row}>
                        <Text style={styles.label}>{idLabel}</Text>
                        <Text style={[styles.value, { color: accent }]}>{idValue}</Text>
                    </View>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    banner: {
        paddingTop: Platform.OS === 'web' ? 40 : 50,
        paddingBottom: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    avatar: {
        marginBottom: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    roleChip: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        backgroundColor: 'rgba(0,0,0,0.18)',
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 4,
    },
    card: {
        margin: 20,
        marginTop: -28,
        borderRadius: 16,
        backgroundColor: '#fff',
    },
    row: {
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    label: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
        maxWidth: '65%',
        textAlign: 'right',
    },
    nameValue: {
        color: '#222',
    },
});
