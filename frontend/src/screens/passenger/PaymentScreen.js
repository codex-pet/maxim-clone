import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PaymentMethodItem from '../../components/PaymentMethodItem';
import LeafletMap from '../../components/LeafletMap';
import { COLORS } from '../../constants/colors';

export default function PaymentScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const pollingInterval = useRef(null);

    const {
        isLadiesOnly, tripId, pickup, destination,
        pickupCoords, destinationCoords, distance, estimatedFare
    } = route.params || {};

    const [selectedPayment, setSelectedPayment] = useState('gcash');
    const [isLoading, setIsLoading] = useState(false);
    const [isFindingDriver, setIsFindingDriver] = useState(false);

    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    const startPollingForDriver = () => {
        if (!tripId) return;

        setIsFindingDriver(true);

        pollingInterval.current = setInterval(async () => {
            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}`);

                // If it returns a 404 or 500 error, skip this poll attempt instead of crashing
                if (!response.ok) {
                    console.log(`Polling skipped, API returned status: ${response.status}`);
                    return;
                }

                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    if (data.success && data.trip) {
                        if (data.trip.tripStatus === 'Accepted') {
                            clearInterval(pollingInterval.current);
                            setIsFindingDriver(false);
                            navigation.replace('ActiveTrip', { tripId: data.trip._id });
                        } else if (data.trip.tripStatus === 'Cancelled') {
                            clearInterval(pollingInterval.current);
                            setIsFindingDriver(false);
                            Alert.alert('Booking Cancelled', 'The driver has declined your request or the trip was cancelled.');
                        }
                    }
                } catch (parseError) {
                    console.error('Polling parse error (Safe Skip):', text.substring(0, 100));
                }
            } catch (error) {
                console.error('Polling network error:', error);
            }
        }, 3000);
    };

    const handleConfirmPayment = async () => {
        if (!tripId) {
            Alert.alert('Error', 'Trip ID is missing. Please go back and book again.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/trips/${tripId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethod: selectedPayment,
                    status: 'Looking for Driver'
                })
            });

            const text = await response.text();

            // Check if server returned an HTML error page
            if (text.startsWith('<!DOCTYPE html>') || text.startsWith('<html')) {
                console.error("Backend sent HTML Error. Check if PUT /api/trips/:id exists.");
                Alert.alert('Backend Error', 'The server returned an invalid response (HTML instead of JSON).');
                setIsLoading(false);
                return;
            }

            let result;
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                Alert.alert('Server Error', 'Received an unreadable response from the server.');
                setIsLoading(false);
                return;
            }

            if (response.ok || result.success) {
                startPollingForDriver();
            } else {
                Alert.alert('Error', result.message || 'Failed to update payment method.');
            }
        } catch (error) {
            console.error('Payment confirmation error:', error);
            Alert.alert('Network Error', 'Could not connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: COLORS.background }}>

            {isFindingDriver && (
                <View style={styles.findingDriverOverlay}>
                    <ActivityIndicator size={60} color={isLadiesOnly ? COLORS.ladiesOnly : COLORS.primary} />
                    <Text style={styles.findingDriverTitle}>Finding a driver...</Text>
                    <Text style={styles.findingDriverSub}>Please wait while we connect you to the nearest available rider.</Text>

                    <TouchableOpacity
                        style={styles.cancelWaitButton}
                        onPress={() => {
                            clearInterval(pollingInterval.current);
                            setIsFindingDriver(false);
                        }}
                    >
                        <Text style={styles.cancelWaitText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.paymentHeader}>
                <TouchableOpacity
                    style={{ width: 40 }}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading || isFindingDriver}
                >
                    <Ionicons name="arrow-back-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.paymentTitle}>Confirm Payment</Text>
                {isLadiesOnly ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>• Ladies-Only</Text>
                    </View>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* 
                  Map Container - Added explicit heights so the Map and Pins visually render 
                  Ensure pickupCoords and destinationCoords are passed properly 
                */}
                <View style={styles.mapContainer}>
                    {pickupCoords && destinationCoords ? (
                        <LeafletMap pickup={pickupCoords} destination={destinationCoords} />
                    ) : (
                        <View style={styles.mapPlaceholder}>
                            <Text>Loading Map...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Ionicons name="location" size={18} color={COLORS.primaryGreen} />
                            <Text style={styles.summaryText} numberOfLines={1}>{pickup || 'Unknown Pickup'}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Ionicons name="pin" size={18} color={COLORS.primary} />
                            <Text style={styles.summaryText} numberOfLines={1}>{destination || 'Unknown Destination'}</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Fare Breakdown</Text>
                        <View style={styles.fareRow}>
                            <Text style={styles.fareLabel}>Base fare</Text>
                            <Text style={styles.fareValue}>₱ 40.00</Text>
                        </View>
                        <View style={styles.fareRow}>
                            <Text style={styles.fareLabel}>Distance ({distance?.toFixed(1) || 0} km)</Text>
                            <Text style={styles.fareValue}>₱ {(distance * 15)?.toFixed(2) || '0.00'}</Text>
                        </View>
                        {isLadiesOnly && (
                            <View style={styles.fareRow}>
                                <Text style={styles.fareLabel}>Ladies-Only fee</Text>
                                <Text style={[styles.fareValue, { color: COLORS.ladiesOnly }]}>₱ 10.00</Text>
                            </View>
                        )}
                        <View style={styles.divider} />
                        <View style={styles.fareRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₱ {estimatedFare || 0}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Select payment method</Text>
                    <PaymentMethodItem icon="wallet-outline" label="GCash" description="E-Wallet" selected={selectedPayment === 'gcash'} onSelect={() => setSelectedPayment('gcash')} iconBackground='#0066CC' />
                    <PaymentMethodItem icon="card-outline" label="Maya" description="E-Wallet" selected={selectedPayment === 'maya'} onSelect={() => setSelectedPayment('maya')} iconBackground='#2E7D32' />
                    <PaymentMethodItem icon="cash-outline" label="Cash" description="Pay driver directly" selected={selectedPayment === 'cash'} onSelect={() => setSelectedPayment('cash')} iconBackground='#FF6B00' />

                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: isLadiesOnly ? COLORS.ladiesOnly : COLORS.primary }, isLoading && { opacity: 0.7 }]}
                        onPress={handleConfirmPayment}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.confirmText}>Confirm & Book — ₱ {estimatedFare || 0}</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    findingDriverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: 30 },
    findingDriverTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: 24 },
    findingDriverSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    cancelWaitButton: { marginTop: 40, paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20, backgroundColor: '#F0F0F0' },
    cancelWaitText: { color: COLORS.textSecondary, fontWeight: 'bold' },
    paymentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    paymentTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    badge: { backgroundColor: '#FCE4EC', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.ladiesOnly },
    badgeText: { color: COLORS.ladiesOnly, fontSize: 12, fontWeight: 'bold' },

    // Updated Map Styles so the Leaflet Map has boundaries to display properly
    mapContainer: {
        height: 250,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#e1e4e8'
    },
    mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    content: { padding: 16 },
    summaryCard: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summaryText: { fontSize: 14, color: COLORS.text, flex: 1 },
    summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8, marginLeft: 26 },
    card: { backgroundColor: COLORS.background, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E8E8E8' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
    fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    fareLabel: { fontSize: 14, color: COLORS.textSecondary },
    fareValue: { fontSize: 14, color: COLORS.text },
    divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: 8 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryGreen },
    confirmButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
    confirmText: { color: COLORS.background, fontSize: 16, fontWeight: 'bold' },
});