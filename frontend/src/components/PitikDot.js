import { View, StyleSheet, Animated } from "react-native";
import { useRef, useEffect, } from "react";
import { COLORS } from "../constants/colors";

export default function PitikDot() {
    const pulse = useRef(new Animated.Value(0)).current;
    const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
    const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulse]);
    return (
    <View style={styles.container}>
        
        <Animated.View style={[styles.ringLarge, {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }]
        }]} />

        <Animated.View style={[styles.ringSmall, {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }]
        }]} />

        <View style={styles.pitikDot} />

    </View>
);
}

const styles = StyleSheet.create({
    pitikDot: {
        width: 30,
        height: 30,
        borderRadius: 30,
        backgroundColor: COLORS.pitikDot,
    },

    container: {
        alignItems: "center",
        justifyContent: "center",
    },

    ringLarge: {
        position: "absolute",
        width: 90,
        height: 90,
        borderRadius: 50,
        backgroundColor: COLORS.pitikDot,
    },

    ringSmall: {
        position: "absolute",
        width: 60,
        height: 60,
        borderRadius: 35,
        backgroundColor: COLORS.pitikDot,
    }
});