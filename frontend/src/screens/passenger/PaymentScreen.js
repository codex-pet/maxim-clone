import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PaymentMethodItem from '../../components/PaymentMethodItem';
import { COLORS } from '../../constants/colors';

export default function PaymentScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { isLadiesOnly } = route.params;
    const [selectedPayment, setSelectedPayment] = useState('gcash');

    return (
        <View style={{ flex: 1, paddingTop: insets.top }}>

            {/* PAYMENT HEADER */}
            <View style={styles.paymentHeader}>
                <TouchableOpacity
                    style={{ width: 40 }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>

                <Text style={styles.paymentTitle}>Payment</Text>

                {isLadiesOnly ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>• Ladies-Only</Text>
                    </View>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.content}>

                    {/* FARE BREAKDOWN */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Payment</Text>

                        <View style={styles.fareRow}>
                            <Text style={styles.fareLabel}>Base fare</Text>
                            <Text style={styles.fareValue}>₱ 40.00</Text>
                        </View>

                        <View style={styles.fareRow}>
                            <Text style={styles.fareLabel}>Distance (4.2 km)</Text>
                            <Text style={styles.fareValue}>₱ 50.00</Text>
                        </View>

                        <View style={styles.fareRow}>
                            <Text style={styles.fareLabel}>Ladies-Only fee</Text>
                            <Text style={[styles.fareValue, { color: COLORS.ladiesOnly }]}>
                                {isLadiesOnly ? '₱ 10.00' : '₱ 0.00'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.fareRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>
                                {isLadiesOnly ? '₱ 100.00' : '₱ 90.00'}
                            </Text>
                        </View>
                    </View>

                    {/* PAYMENT METHODS */}
                    <Text style={styles.sectionTitle}>Select payment method</Text>

                    <PaymentMethodItem
                        icon="wallet-outline"
                        label="GCash"
                        description="E-Wallet"
                        selected={selectedPayment === 'gcash'}
                        onSelect={() => setSelectedPayment('gcash')}
                        iconBackground='#0066CC'
                    />

                    <PaymentMethodItem
                        icon="card-outline"
                        label="Maya"
                        description="E-Wallet"
                        selected={selectedPayment === 'maya'}
                        onSelect={() => setSelectedPayment('maya')}
                        iconBackground='#2E7D32'
                    />

                    <PaymentMethodItem
                        icon="cash-outline"
                        label="Cash"
                        description="Pay driver directly"
                        selected={selectedPayment === 'cash'}
                        onSelect={() => setSelectedPayment('cash')}
                        iconBackground='#FF6B00'
                    />

                    <PaymentMethodItem
                        icon="card-outline"
                        label="Debit/Credit Card"
                        description="Visa, Mastercard"
                        selected={selectedPayment === 'card'}
                        onSelect={() => setSelectedPayment('card')}
                        iconBackground='#333333'
                    />

                    {/* CONFIRM BUTTON */}
                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: isLadiesOnly ? COLORS.ladiesOnly : COLORS.primary }]}
                        onPress={() => console.log('Confirmed!')}
                    >
                        <Text style={styles.confirmText}>
                            Confirm & Book — {isLadiesOnly ? '₱ 100.00' : '₱ 90.00'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.receiptNote}>A digital receipt will be sent after your trip</Text>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    paymentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    paymentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    badge: {
        backgroundColor: '#FCE4EC',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: COLORS.ladiesOnly,
    },
    badgeText: {
        color: COLORS.ladiesOnly,
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    fareLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    fareValue: {
        fontSize: 14,
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#E8E8E8',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    confirmButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    confirmText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    receiptNote: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 12,
    },
});