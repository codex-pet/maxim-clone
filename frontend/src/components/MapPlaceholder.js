import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import PitikDot from './PitikDot';

export default function MapPlaceholder({ color }) {
    return (
        <View style={[styles.circle, {
            borderColor: color || COLORS.primary,
            backgroundColor: color === COLORS.ladiesOnly ? '#FCE4EC' : COLORS.mapGrid,
        }]}>
            <PitikDot />
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
});