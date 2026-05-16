import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default function TripHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/trips/passenger-history/${user._id}`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderTripItem = ({ item }) => (
    <View style={styles.tripCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateTimeContainer}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.dotLine}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Pickup</Text>
            <Text style={styles.addressText} numberOfLines={1}>{item.from}</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.addressLabel}>Drop-off</Text>
            <Text style={styles.addressText} numberOfLines={1}>{item.to}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.driverInfo}>
        <View style={styles.driverMeta}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.driverName}>{item.driverName}</Text>
            {item.vehicleInfo ? (
              <Text style={styles.vehicleText}>
                {item.vehicleInfo.color} {item.vehicleInfo.model} • {item.vehicleInfo.plateNumber}
              </Text>
            ) : (
              <Text style={styles.vehicleText}>No vehicle info available</Text>
            )}
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.fareText}>{item.fare}</Text>
          <Text style={styles.paymentMethod}>{item.paymentMethod?.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#4CAF50';
      case 'Cancelled': return COLORS.danger;
      case 'Accepted': return '#2196F3';
      default: return COLORS.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={{ width: 40 }} />
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyText}>No trips yet.</Text>
          <TouchableOpacity 
            style={styles.bookNowButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Book' })}
          >
            <Text style={styles.bookNowText}>Book your first trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderTripItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tripCard: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F1F1',
    marginVertical: 12,
  },
  locationContainer: {
    marginVertical: 4,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dotLine: {
    alignItems: 'center',
    width: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  addressContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  driverName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  vehicleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentMethod: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNowText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 15,
  }
});
