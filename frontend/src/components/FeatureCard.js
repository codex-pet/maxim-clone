import { View, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../constants/colors';


export default function FeatureCard(props) {
    return (
        <View style={[styles.card, { borderColor: props.color || COLORS.cardBorder }]}>
            <View style={styles.iconContainer}>
                <Ionicons name={props.icon} size={24} color={props.color} />
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.title}>{props.title}</Text>
                <Text style={styles.description}>{props.description}</Text>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.cardBorder,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        padding: 12,
        marginBottom: 10,
    },

    iconContainer: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: COLORS.backgroundLight,
    },

    textContainer: {
        flex: 1,
        marginLeft: 10
    },

    title: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.text,
    },

    description: {
        fontSize: 12,
        color: COLORS.textSecondary,
    }
});