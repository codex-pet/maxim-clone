import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function RideTypeSelector({ selected, onSelect }) {
    return (
        <View style={styles.container}>

            {/* STANDARD BUTTON */}
            <TouchableOpacity
                style={[styles.button, selected === 'standard' && styles.activeStandard]}
                onPress={() => onSelect('standard')}
            >
                <Ionicons
                    name="car-outline"
                    size={16}
                    color={selected === 'standard' ? COLORS.background : COLORS.primary}
                />
                <Text style={[styles.text, { fontSize: 16 }, selected === 'standard' && styles.activeText]}>
                    Standard
                </Text>
            </TouchableOpacity>

            {/* LADIES ONLY BUTTON */}
            <TouchableOpacity
                style={[
                    styles.button,
                    styles.ladiesButton,
                    selected === 'ladiesOnly' && styles.activeLadies
                ]}
                onPress={() => onSelect('ladiesOnly')}
            >
                <Ionicons
                    name="female-outline"
                    size={16}
                    color={selected === 'ladiesOnly' ? COLORS.background : COLORS.ladiesOnly}
                />
                <Text style={[styles.text, { color: COLORS.ladiesOnly }, selected === 'ladiesOnly' && styles.activeTextLadies]}>
                    Ladies-Only
                </Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 14,
        paddingHorizontal: 46,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.background,
    },
    activeStandard: {
        backgroundColor: COLORS.primary,
    },
    activeLadies: {
        backgroundColor: COLORS.ladiesOnly,
        borderColor: COLORS.ladiesOnly,
    },
    text: {
        fontSize: 14,
        color: COLORS.primary,
    },
    activeText: {
        color: COLORS.background,
    },
    activeTextLadies: {
        color: COLORS.background,
    },

    ladiesButton: {
        borderColor: COLORS.ladiesOnly,
    }
});