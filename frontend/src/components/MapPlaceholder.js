import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import PitikDot from './PitikDot';

export default function MapPlaceholder({ color, latitude, longitude }) {
    return (
        <View style={[styles.circle, {
            borderColor: color || COLORS.primary,
            backgroundColor: color === COLORS.ladiesOnly ? '#FCE4EC' : COLORS.mapGrid,
        }]}>
            <PitikDot />
            {latitude && longitude && (
                <View style={styles.coordsContainer}>
                    <Text style={styles.coordsText}>
                        📍 {latitude.toFixed(4)}N, {longitude.toFixed(2)}E
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    circle: {
        width: 320,
        height: 320,
        borderRadius: 160,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },

    coordsContainer: {
        position: 'absolute',
        bottom: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    coordsText: {
        fontSize: 11,
        color: COLORS.text,
        fontWeight: 'bold',
    },
});