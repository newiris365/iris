# React Native Mobile App Specifications

This document outlines the mobile application layout and screen workflows built using **React Native + Expo** for the student and parent mobile portals of **IRIS 365**.

---

## 📱 Tech Stack (Mobile)
* **Framework**: React Native (Expo SDK 51)
* **Language**: TypeScript
* **Navigation**: Expo Router (File-based routing)
* **Styling**: NativeWind (Tailwind CSS for React Native)
* **Components**: React Native Paper / Lucide React Native Icons
* **Hardware APIs**: `expo-camera`, `expo-location`, `expo-local-authentication` (Biometrics)

---

## Screen 1: Student Attendance QR Scanner (`/student/scanner`)

This screen activates the mobile camera, captures the attendance session QR token, fetches the student's current GPS location, and sends it to the API to mark attendance.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QRScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasPermission(
        cameraStatus.status === 'granted' && locationStatus.status === 'granted'
      );
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert("Scanning...", "Verifying geo-fencing and signature.");

    try {
      // 1. Get current GPS Coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const { latitude, longitude } = location.coords;
      const token = await AsyncStorage.getItem('iris_jwt_token');

      // 2. Dispatch request to backend core API
      const response = await fetch('https://api.iris365.in/api/v1/core/attendance/mark/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: data, // Scanned QR token (HMAC-signed session_id)
          latitude,
          longitude,
          device_id: 'mobile-app-client'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert("Success!", "Attendance marked present.");
        navigation.navigate('Dashboard');
      } else {
        Alert.alert("Failed", result.error || "Verification failed.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to validation server.");
    } finally {
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera and GPS permissions...</Text>;
  }
  if (hasPermission === false) {
    return <Text>Permissions denied. Camera and GPS are required to mark attendance.</Text>;
  }

  return (
    <View className="flex-1 bg-[#0D0A1A] justify-center items-center">
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      {scanned && (
        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
      )}
    </View>
  );
}
```

---

## Screen 2: Parent Child Telemetry Dashboard (`/parent/dashboard`)

Renders overall telemetry cards for parents to track their student child's daily metrics.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ParentDashboardScreen() {
  const [stats, setStats] = useState({ overall: 76, total: 25, present: 19 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const res = await fetch('https://api.iris365.in/api/v1/core/attendance/student/mock-student-id', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTelemetry().then(() => setRefreshing(false));
  }, []);

  return (
    <ScrollView 
      className="flex-1 bg-[#0D0A1A] px-4 pt-6"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-white text-xl font-bold">Child Progress Telemetry</Text>
      <Text className="text-[#C4B5FD] text-xs font-light mt-1">Monitoring: Khushal Gehlot (CSE Sem 4)</Text>

      {/* KPI Cards Grid */}
      <View className="flex-row justify-between mt-6 gap-3 flex-wrap">
        
        {/* Attendance dial card */}
        <View className="flex-1 bg-[#13102A] p-4 rounded-2xl border border-white/5 min-w-[45%]">
          <Text className="text-[#C4B5FD] text-[10px] uppercase font-bold">Attendance Rate</Text>
          <Text className="text-emerald-400 text-3xl font-extrabold mt-2">{stats.overall}%</Text>
          <Text className="text-[#C4B5FD]/50 text-[9px] mt-1">Status: Safe</Text>
        </View>

        {/* Canteen Wallet Balance card */}
        <View className="flex-1 bg-[#13102A] p-4 rounded-2xl border border-white/5 min-w-[45%]">
          <Text className="text-[#C4B5FD] text-[10px] uppercase font-bold">Canteen Wallet</Text>
          <Text className="text-white text-3xl font-extrabold mt-2">₹350</Text>
          <Text className="text-[#C4B5FD]/50 text-[9px] mt-1">Prepaid allowance</Text>
        </View>

      </View>
    </ScrollView>
  );
}
```

---

## Screen 3: Offline Biometric Sync Queue (`/biometric/queue`)

Maintains local offline cache logs for student fingerprint readers, and syncs automatically with the REST webhook API when Internet connection is restored.

### Code Spec:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface OfflineLog {
  fingerprint_id: string;
  device_id: string;
  timestamp: string;
}

// Queue offline log on scanning fail
export async function queueOfflineBiometricLog(log: OfflineLog) {
  try {
    const existing = await AsyncStorage.getItem('offline_biometric_queue');
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(log);
    await AsyncStorage.setItem('offline_biometric_queue', JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to queue log:', err);
  }
}

// Sync queue with backend once online
export async function syncOfflineBiometricQueue() {
  const connection = await NetInfo.fetch();
  if (!connection.isConnected) return; // Still offline

  try {
    const cached = await AsyncStorage.getItem('offline_biometric_queue');
    if (!cached) return;

    const queue: OfflineLog[] = JSON.parse(cached);
    if (queue.length === 0) return;

    const remaining: OfflineLog[] = [];

    for (const log of queue) {
      try {
        const res = await fetch('https://api.iris365.in/api/v1/core/attendance/mark/biometric', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log)
        });
        
        if (!res.ok) {
          remaining.push(log); // Keep in queue for retry if API server errors
        }
      } catch (err) {
        remaining.push(log);
      }
    }

    await AsyncStorage.setItem('offline_biometric_queue', JSON.stringify(remaining));
  } catch (err) {
    console.error('Failed to sync offline queue:', err);
  }
}
```

---

## Screen 4: Student FitZone Slot Booking (`/student/gym/book`)

Renders a 7-day date slider selector and lists available gym session time slots, enabling students to book daily slots.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GymSlotBookingScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Generate next 7 days
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    setSelectedDate(days[0]);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  const fetchSlots = async () => {
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const res = await fetch(`https://api.iris365.in/api/v1/fitzone/gym/slots?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
      }
    } catch (err) {
      // Mock Fallback
      setSlots([
        { id: 'ms1', start_time: '06:00:00', end_time: '07:30:00', capacity: 30, booked_count: 12, slot_type: 'general' },
        { id: 'ms2', start_time: '08:00:00', end_time: '09:30:00', capacity: 25, booked_count: 25, slot_type: 'cardio-only' },
        { id: 'ms3', start_time: '17:00:00', end_time: '18:30:00', capacity: 40, booked_count: 35, slot_type: 'weights-only' }
      ]);
    }
  };

  const handleBookSlot = async (slotId: string) => {
    setBookingLoading(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const profileStr = await AsyncStorage.getItem('iris_user_profile');
      const user = profileStr ? JSON.parse(profileStr) : null;
      const studentId = user?.student_id || 'mock-student-id';

      const res = await fetch('https://api.iris365.in/api/v1/fitzone/gym/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ slot_id: slotId, student_id: studentId })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        Alert.alert("Success 🎉", "Gym slot booked! Check-in QR generated.");
        fetchSlots();
      } else {
        Alert.alert("Booking Failed", result.error || "An error occurred.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to the campus server.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0D0A1A] px-4 pt-6">
      <Text className="text-white text-xl font-bold">Book Gym Slot</Text>
      
      {/* 7-Day Slider */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row my-4 max-h-[60px]">
        {days.map(d => (
          <TouchableOpacity
            key={d}
            onPress={() => setSelectedDate(d)}
            className={`px-4 py-2.5 rounded-xl mr-2.5 items-center justify-center border ${
              selectedDate === d ? 'bg-[#6C2BD9] border-[#8B5CF6]' : 'bg-[#13102A] border-white/5'
            }`}
          >
            <Text className="text-white text-xs font-semibold">{d.substring(5)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Slots List */}
      <ScrollView className="flex-1 mt-2">
        {slots.map(s => {
          const isFull = s.booked_count >= s.capacity;
          return (
            <View key={s.id} className="bg-[#13102A] p-5 rounded-2xl border border-white/5 flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-[#A78BFA] text-[10px] font-bold uppercase">{s.slot_type}</Text>
                <Text className="text-white text-sm font-semibold mt-1">
                  {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                </Text>
                <Text className="text-[#C4B5FD]/50 text-xs mt-1">
                  Capacity: {s.booked_count}/{s.capacity}
                </Text>
              </View>

              <TouchableOpacity
                disabled={isFull || bookingLoading}
                onPress={() => handleBookSlot(s.id)}
                className={`px-4 py-2.5 rounded-xl ${isFull ? 'bg-white/5' : 'bg-[#6C2BD9]'}`}
              >
                <Text className="text-white text-xs font-bold">{isFull ? 'Full' : 'Book'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
```

---

## Screen 5: Student Fitness Progress Tracking (`/student/gym/progress`)

Renders the student child's biometrics statistics (weight, height, BMI) over the past months in list format.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GymProgressScreen() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const profileStr = await AsyncStorage.getItem('iris_user_profile');
      const user = profileStr ? JSON.parse(profileStr) : null;
      const studentId = user?.student_id || 'mock-student-id';

      const res = await fetch(`https://api.iris365.in/api/v1/fitzone/gym/metrics/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics || []);
      }
    } catch (err) {
      // Mock Fallbacks
      setMetrics([
        { date: '2026-06-01', weight_kg: 75.1, bmi: 23.4, body_fat_percent: 17.6 },
        { date: '2026-05-01', weight_kg: 76.0, bmi: 23.7, body_fat_percent: 18.5 },
        { date: '2026-04-01', weight_kg: 77.2, bmi: 24.1, body_fat_percent: 19.8 }
      ]);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProgress().then(() => setRefreshing(false));
  }, []);

  const latest = metrics[0] || {};

  return (
    <ScrollView
      className="flex-1 bg-[#0D0A1A] px-4 pt-6"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-white text-xl font-bold">Fitness Progress</Text>
      
      {/* Latest Stats Panel */}
      <View className="bg-[#13102A] p-5 rounded-3xl border border-white/5 my-6">
        <Text className="text-[#C4B5FD] text-[10px] uppercase font-bold">Latest Record</Text>
        <Text className="text-white text-2xl font-extrabold mt-1">{latest.weight_kg ? latest.weight_kg + ' kg' : 'No Records'}</Text>
        
        <View className="flex-row justify-between mt-4 border-t border-white/5 pt-4">
          <View>
            <Text className="text-[#C4B5FD]/50 text-[10px] uppercase">BMI Index</Text>
            <Text className="text-white text-sm font-bold mt-1">{latest.bmi || 'N/A'}</Text>
          </View>
          <View>
            <Text className="text-[#C4B5FD]/50 text-[10px] uppercase">Body Fat</Text>
            <Text className="text-white text-sm font-bold mt-1">{latest.body_fat_percent ? latest.body_fat_percent + '%' : 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Historical List */}
      <Text className="text-[#C4B5FD]/60 text-xs font-bold mb-3">Measurement Logs</Text>
      {metrics.map((item, idx) => (
        <View key={idx} className="bg-[#13102A]/60 p-4 rounded-xl border border-white/5 flex-row justify-between items-center mb-2.5">
          <View>
            <Text className="text-white text-xs font-semibold">{item.date}</Text>
            <Text className="text-[#C4B5FD]/50 text-[10px] mt-0.5">BMI: {item.bmi}</Text>
          </View>
          <Text className="text-white text-sm font-bold">{item.weight_kg} kg</Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

---

## Screen 6: Student FitZone Membership Purchase (`/student/gym/membership`)

Displays current active membership validation statuses and triggers Razorpay subscription purchases.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GymMembershipScreen() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const res = await fetch('https://api.iris365.in/api/v1/fitzone/gym/membership-plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      setPlans([
        { id: 'p1', name: 'Monthly Basic', price: 599, duration_months: 1 },
        { id: 'p2', name: 'Quarterly Prime', price: 1499, duration_months: 3 },
        { id: 'p3', name: 'Annual Pro Elite', price: 4999, duration_months: 12 }
      ]);
    }
  };

  const handlePurchase = async (plan: any) => {
    Alert.alert(
      "Confirm Subscription",
      `Subscribe to ${plan.name} for ₹${plan.price}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Pay", 
          onPress: () => Alert.alert("Success", "Razorpay Checkout simulated successfully!") 
        }
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-[#0D0A1A] px-4 pt-6">
      <Text className="text-white text-xl font-bold">FitZone Memberships</Text>
      <Text className="text-[#C4B5FD] text-xs mt-1">Unlock fitness center access by choosing a package.</Text>

      {/* Plans List */}
      <View className="my-6">
        {plans.map(plan => (
          <View key={plan.id} className="bg-[#13102A] p-5 rounded-2xl border border-white/5 mb-4 flex-row justify-between items-center">
            <View>
              <Text className="text-white text-sm font-bold">{plan.name}</Text>
              <Text className="text-[#C4B5FD]/60 text-xs mt-1">₹{plan.price} / {plan.duration_months} Months</Text>
            </View>

            <TouchableOpacity
              onPress={() => handlePurchase(plan)}
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9]"
            >
              <Text className="text-white text-xs font-bold">Subscribe</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
```

---

## Screen 7: Student Hostel Dashboard (`/student/hostel/dashboard`)

Renders room allotment stats, block names, monthly rent, and current roommates list in a card layout.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentHostelDashboardScreen() {
  const [allocation, setAllocation] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHostelDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const profileStr = await AsyncStorage.getItem('iris_user_profile');
      const user = profileStr ? JSON.parse(profileStr) : null;
      const studentId = user?.student_id || 'mock-student-id';

      // 1. Fetch Allocation
      const allocRes = await fetch(`https://api.iris365.in/api/v1/hostel/allocations?studentId=${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allocData = await allocRes.json();

      if (allocData.success && allocData.allocations?.length > 0) {
        const activeAlloc = allocData.allocations[0];
        setAllocation(activeAlloc);

        // 2. Fetch Roommates
        const roomRes = await fetch('https://api.iris365.in/api/v1/hostel/allocations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const roomData = await roomRes.json();
        if (roomData.success) {
          const roomies = roomData.allocations.filter(
            (a: any) => a.room_id === activeAlloc.room_id && a.student_id !== studentId
          );
          setRoommates(roomies);
        }
      }
    } catch (err) {
      // Mock Fallbacks
      setAllocation({
        allotted_date: '2025-07-15',
        deposit_amount: 10000,
        hostel_rooms: {
          room_number: 'B-304',
          floor: 3,
          room_type: 'double',
          monthly_rent: 6500,
          hostel_blocks: { name: 'Aryabhata Boys Hostel (Block A)' }
        }
      });
      setRoommates([
        {
          students: {
            name: 'Priyansh Mehta',
            roll_number: 'CS23B1042',
            department: 'Computer Science'
          }
        }
      ]);
    }
  };

  useEffect(() => {
    fetchHostelDetails();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchHostelDetails().then(() => setRefreshing(false));
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-[#0D0A1A] px-4 pt-6"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-white text-xl font-bold font-sans">My Room Allotment</Text>
      
      {allocation && (
        <View className="bg-[#13102A] p-5 rounded-3xl border border-white/5 my-6">
          <Text className="text-[#C4B5FD] text-[10px] uppercase font-bold">{allocation.hostel_rooms?.hostel_blocks?.name}</Text>
          <Text className="text-white text-3xl font-extrabold mt-1">Room {allocation.hostel_rooms?.room_number}</Text>
          <Text className="text-[#C4B5FD]/50 text-xs mt-1 capitalize">{allocation.hostel_rooms?.room_type} sharing • Floor {allocation.hostel_rooms?.floor}</Text>
          
          <View className="flex-row justify-between mt-4 border-t border-white/5 pt-4">
            <View>
              <Text className="text-[#C4B5FD]/50 text-[10px] uppercase">Monthly Rent</Text>
              <Text className="text-emerald-400 text-sm font-bold mt-1">₹{allocation.hostel_rooms?.monthly_rent}</Text>
            </View>
            <View>
              <Text className="text-[#C4B5FD]/50 text-[10px] uppercase">Security Deposit</Text>
              <Text className="text-white text-sm font-bold mt-1">₹{allocation.deposit_amount}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Roommates */}
      <Text className="text-[#C4B5FD]/60 text-xs font-bold mb-3">Roommates</Text>
      {roommates.map((item, idx) => (
        <View key={idx} className="bg-[#13102A]/60 p-4 rounded-xl border border-white/5 flex-row justify-between items-center mb-2.5">
          <View>
            <Text className="text-white text-xs font-semibold">{item.students?.name}</Text>
            <Text className="text-[#C4B5FD]/50 text-[10px] mt-0.5">{item.students?.roll_number} • {item.students?.department}</Text>
          </View>
        </View>
      ))}
      {roommates.length === 0 && (
        <Text className="text-[#C4B5FD]/30 text-xs text-center py-4">No roommates registered.</Text>
      )}
    </ScrollView>
  );
}
```

---

## Screen 8: Student Visitor Access Approval (`/student/hostel/visitors`)

Lists current visitor entries requesting authorization, enabling students to approve or reject entry logs via API calls.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentVisitorAccessScreen() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchVisitors = async () => {
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const profileStr = await AsyncStorage.getItem('iris_user_profile');
      const user = profileStr ? JSON.parse(profileStr) : null;
      const studentId = user?.student_id || 'mock-student-id';

      const res = await fetch(`https://api.iris365.in/api/v1/hostel/visitors?studentId=${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVisitors(data.visitors || []);
      }
    } catch (err) {
      setVisitors([
        {
          id: 'v1',
          visitor_name: 'Rajesh Mehta',
          relation: 'Father',
          visitor_phone: '+91 98765 43210',
          purpose: 'Food delivery',
          status: 'inside',
          is_approved: false
        }
      ]);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleDecision = async (visitorId: string, approve: boolean) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const res = await fetch(`https://api.iris365.in/api/v1/hostel/visitors/${visitorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approve })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        Alert.alert("Success", approve ? "Visitor approved!" : "Visitor entry denied.");
        fetchVisitors();
      } else {
        Alert.alert("Failed", result.error || "Failed to submit decision.");
      }
    } catch (err) {
      // Mock Fallback
      setVisitors(visitors.filter(v => v.id !== visitorId));
      Alert.alert("Success", approve ? "Visitor approved! (Mock)" : "Visitor denied. (Mock)");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchVisitors().then(() => setRefreshing(false));
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-[#0D0A1A] px-4 pt-6"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-white text-xl font-bold">Visitor Authorizations</Text>
      <Text className="text-[#C4B5FD] text-xs mt-1">Approve or reject guest access requests at the main gate.</Text>

      <View className="my-6">
        {visitors.map(v => (
          <View key={v.id} className="bg-[#13102A] p-5 rounded-2xl border border-white/5 mb-4">
            <Text className="text-white text-sm font-bold">{v.visitor_name} ({v.relation || 'Guest'})</Text>
            <Text className="text-[#C4B5FD]/60 text-xs mt-1">Purpose: {v.purpose}</Text>
            <Text className="text-[#C4B5FD]/60 text-xs mt-0.5">Phone: {v.visitor_phone}</Text>

            {v.status === 'inside' && !v.is_approved && (
              <View className="flex-row gap-3 mt-4 border-t border-white/5 pt-4">
                <TouchableOpacity
                  disabled={loading}
                  onPress={() => handleDecision(v.id, false)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 items-center"
                >
                  <Text className="text-red-400 text-xs font-bold">Deny</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={loading}
                  onPress={() => handleDecision(v.id, true)}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] items-center"
                >
                  <Text className="text-white text-xs font-bold">Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {visitors.length === 0 && (
          <Text className="text-[#C4B5FD]/30 text-xs text-center py-6">No pending visitor authorizations.</Text>
        )}
      </View>
    </ScrollView>
  );
}
```

---

## Screen 9: Student Library Search (`/student/library/search`)

This screen provides search filters for physical and digital library books, displays remaining copies available, shelf location mapping, and reservation workflows.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LibrarySearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<string | null>(null);

  const fetchBooks = async (query = '') => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const res = await fetch(`https://api.iris365.in/api/v1/library/books?search=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooks(data.books || []);
      }
    } catch (err) {
      // Mock Fallback
      setBooks([
        { id: 'b1', title: 'Clean Architecture', author: 'Robert C. Martin', copies_available: 2, shelf_location: 'Rack 4-A', category: 'Software Engineering' },
        { id: 'b2', title: 'Design Patterns', author: 'Erich Gamma', copies_available: 0, shelf_location: 'Rack 4-B', category: 'Software Engineering' },
        { id: 'b3', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', copies_available: 5, shelf_location: 'Rack 2-C', category: 'Computer Science' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleReserve = async (bookId: string) => {
    setReservingId(bookId);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const profileStr = await AsyncStorage.getItem('iris_user_profile');
      const user = profileStr ? JSON.parse(profileStr) : null;
      const studentId = user?.student_id || 'mock-student-id';

      const res = await fetch('https://api.iris365.in/api/v1/library/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book_id: bookId, student_id: studentId })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        Alert.alert("Reserved 🎉", "You have successfully placed a reservation queue ticket for this book.");
        fetchBooks(searchQuery);
      } else {
        Alert.alert("Reservation Failed", result.error || "An error occurred.");
      }
    } catch (err) {
      Alert.alert("Success", "Mock reservation placed successfully!");
    } finally {
      setReservingId(null);
    }
  };

  return (
    <View className="flex-1 bg-[#0D0A1A] px-4 pt-6">
      <Text className="text-white text-xl font-bold">Library Catalogue</Text>
      <Text className="text-[#C4B5FD] text-xs mt-1">Search physical books or place reservations.</Text>

      {/* Search Input */}
      <View className="my-4 flex-row bg-[#13102A] border border-white/5 rounded-xl px-3 items-center">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchBooks(searchQuery)}
          placeholder="Search by title, author, or ISBN..."
          placeholderTextColor="#C4B5FD/40"
          className="flex-1 text-white text-sm py-3"
        />
        <TouchableOpacity onPress={() => fetchBooks(searchQuery)} className="pl-2">
          <Text className="text-[#6C2BD9] font-bold text-xs uppercase">Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#6C2BD9" size="large" />
        </View>
      ) : (
        <ScrollView className="flex-1">
          {books.map(book => {
            const isAvailable = book.copies_available > 0;
            return (
              <View key={book.id} className="bg-[#13102A] p-5 rounded-2xl border border-white/5 mb-4 flex-row justify-between items-center">
                <View className="flex-1 pr-3">
                  <Text className="text-[#A78BFA] text-[10px] font-bold uppercase">{book.category || 'General'}</Text>
                  <Text className="text-white text-base font-semibold mt-1">{book.title}</Text>
                  <Text className="text-[#C4B5FD]/70 text-xs mt-0.5">by {book.author}</Text>
                  <Text className="text-[#C4B5FD]/50 text-[10px] mt-2">
                    Location: {book.shelf_location || 'N/A'} • Available: {book.copies_available}
                  </Text>
                </View>

                {isAvailable ? (
                  <View className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Text className="text-emerald-400 text-xs font-bold">In Library</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    disabled={reservingId !== null}
                    onPress={() => handleReserve(book.id)}
                    className="px-4 py-2.5 rounded-xl bg-[#6C2BD9]"
                  >
                    <Text className="text-white text-xs font-bold">
                      {reservingId === book.id ? 'Reserving...' : 'Reserve'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          {books.length === 0 && (
            <Text className="text-[#C4B5FD]/30 text-xs text-center py-6">No books found matching criteria.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}
```

---

## Screen 10: Student Study Room Booking (`/student/library/study-rooms`)

This screen displays a list of available group study rooms and enables students to select booking dates, slot durations, and input study purpose logs.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudyRoomBookingScreen() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Generate 7 booking dates
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    setBookingDate(dates[0]);
  }, []);

  const fetchRooms = async () => {
    if (!bookingDate) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const res = await fetch(`https://api.iris365.in/api/v1/library/study-rooms?date=${bookingDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (err) {
      // Mock Fallbacks
      setRooms([
        { id: 'r1', name: 'Collaborative Sandbox Room A', capacity: 6, floor: 2, amenities: ['Whiteboard', 'LED Screen'] },
        { id: 'r2', name: 'Deep Focus Lab B', capacity: 4, floor: 2, amenities: ['Silent Zone', 'Dual Monitors'] },
        { id: 'r3', name: 'Conference Pod C', capacity: 10, floor: 3, amenities: ['Video System', 'Whiteboard'] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [bookingDate]);

  const handleBookRoom = async () => {
    if (!selectedRoom) {
      Alert.alert("Error", "Please select a study room first.");
      return;
    }
    setBookingLoading(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const profileStr = await AsyncStorage.getItem('iris_user_profile');
      const user = profileStr ? JSON.parse(profileStr) : null;
      const studentId = user?.student_id || 'mock-student-id';

      const res = await fetch('https://api.iris365.in/api/v1/library/study-room-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          student_id: studentId,
          date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          purpose,
          group_members: []
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        Alert.alert("Booking Confirmed 🎉", `Study room booked!\nPasscode: ${result.booking?.qr_code || 'SRB-ABCD'}`);
        setPurpose('');
        setSelectedRoom(null);
        fetchRooms();
      } else {
        Alert.alert("Booking Failed", result.error || "An error occurred.");
      }
    } catch (err) {
      Alert.alert("Success", "Mock booking confirmed! Entry QR passcode generated: SRB-3918A");
      setPurpose('');
      setSelectedRoom(null);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0D0A1A] px-4 pt-6">
      <Text className="text-white text-xl font-bold">Study Room Booking</Text>
      <Text className="text-[#C4B5FD] text-xs mt-1">Reserve private labs and conference pods for group studies.</Text>

      {/* Date Slider */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row my-4 max-h-[50px]">
        {dates.map(d => (
          <TouchableOpacity
            key={d}
            onPress={() => setBookingDate(d)}
            className={`px-4 py-2 rounded-xl mr-2.5 items-center justify-center border ${
              bookingDate === d ? 'bg-[#6C2BD9] border-[#8B5CF6]' : 'bg-[#13102A] border-white/5'
            }`}
          >
            <Text className="text-white text-xs font-semibold">{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#6C2BD9" size="large" />
        </View>
      ) : (
        <ScrollView className="flex-1">
          <Text className="text-[#C4B5FD]/60 text-xs font-bold mb-3">Available Rooms</Text>
          {rooms.map(room => {
            const isSelected = selectedRoom?.id === room.id;
            return (
              <TouchableOpacity
                key={room.id}
                onPress={() => setSelectedRoom(room)}
                className={`p-4 rounded-xl mb-3 border ${
                  isSelected ? 'bg-[#6C2BD9]/25 border-[#8B5CF6]' : 'bg-[#13102A] border-white/5'
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-white text-sm font-semibold">{room.name}</Text>
                    <Text className="text-[#C4B5FD]/50 text-[10px] mt-0.5">
                      Capacity: {room.capacity} pax • Floor {room.floor}
                    </Text>
                    <View className="flex-row flex-wrap mt-2 gap-1.5">
                      {room.amenities?.map((a: string, i: number) => (
                        <View key={i} className="px-2 py-0.5 rounded bg-white/5">
                          <Text className="text-[#C4B5FD]/70 text-[9px]">{a}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View className={`w-4 h-4 rounded-full border items-center justify-center ${isSelected ? 'border-[#8B5CF6] bg-[#6C2BD9]' : 'border-white/25'}`}>
                    {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {selectedRoom && (
            <View className="bg-[#13102A] p-5 rounded-2xl border border-white/5 my-4">
              <Text className="text-white text-sm font-bold mb-3">Booking Slot Details</Text>
              
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-[#C4B5FD]/50 text-[10px] uppercase font-bold mb-1">Start Time</Text>
                  <TextInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="10:00"
                    placeholderTextColor="#C4B5FD/30"
                    className="bg-white/5 border border-white/5 text-white text-xs rounded-lg p-2.5"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[#C4B5FD]/50 text-[10px] uppercase font-bold mb-1">End Time</Text>
                  <TextInput
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="12:00"
                    placeholderTextColor="#C4B5FD/30"
                    className="bg-white/5 border border-white/5 text-white text-xs rounded-lg p-2.5"
                  />
                </View>
              </View>

              <Text className="text-[#C4B5FD]/50 text-[10px] uppercase font-bold mb-1">Purpose of Study</Text>
              <TextInput
                value={purpose}
                onChangeText={setPurpose}
                placeholder="Group project brainstorming session"
                placeholderTextColor="#C4B5FD/30"
                className="bg-white/5 border border-white/5 text-white text-xs rounded-lg p-2.5 mb-4"
              />

              <TouchableOpacity
                disabled={bookingLoading}
                onPress={handleBookRoom}
                className="w-full py-3 bg-[#6C2BD9] rounded-xl items-center"
              >
                <Text className="text-white text-xs font-bold">
                  {bookingLoading ? 'Booking Room...' : `Confirm Room Booking`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
```

---

## Screen 11: Driver Trip Console (`/driver/trip`)

This screen allows school bus drivers to initiate an assigned trip, stream active GPS coordinates over Socket.io, report high-severity SOS/road incidents, and check off passenger boarding logs at stops.

### Code Spec:
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

export default function DriverTripConsole() {
  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [passengersBoarded, setPassengersBoarded] = useState(0);

  const socketRef = useRef<any>(null);
  const telemetryInterval = useRef<any>(null);

  // Coordinates drift simulation state
  const latRef = useRef(26.2912);
  const lngRef = useRef(73.0156);

  useEffect(() => {
    fetchDriverBuses();
    
    // Connect to Transit Socket namespace
    socketRef.current = io('https://api.iris365.in/transit', {
      transports: ['websocket']
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (telemetryInterval.current) clearInterval(telemetryInterval.current);
    };
  }, []);

  const fetchDriverBuses = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const res = await fetch('https://api.iris365.in/api/v1/transit/buses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBuses(data.buses || []);
        if (data.buses?.length > 0) setSelectedBus(data.buses[0]);
      }
    } catch (err) {
      // Fallback Mock Bus
      const mockBus = {
        id: '70000000-0000-0000-0000-000000000001',
        vehicle_number: 'RJ-19-PB-4050',
        model: 'Tata Starbus 40-Seater',
        route_id: '80000000-0000-0000-0000-000000000001',
        bus_routes: {
          name: 'Jodhpur Central Route',
          stops: [
            { name: "Sardarpura 4th Road", stop_index: 0 },
            { name: "Shastri Nagar Circle", stop_index: 1 },
            { name: "Mogra Highway Stop", stop_index: 2 },
            { name: "SIET Campus Terminal", stop_index: 3 }
          ]
        }
      };
      setBuses([mockBus]);
      setSelectedBus(mockBus);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    if (!selectedBus) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const res = await fetch('https://api.iris365.in/api/v1/transit/trips/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bus_id: selectedBus.id,
          route_id: selectedBus.route_id,
          trip_type: 'morning'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveTrip(data.trip);
        startGpsBroadcast(data.trip.bus_id);
      } else {
        Alert.alert("Error Starting Trip", data.error);
      }
    } catch (err) {
      // Mock Success Mode
      const mockTrip = {
        id: 'trip-mock-123',
        bus_id: selectedBus.id,
        route_id: selectedBus.route_id,
        status: 'active'
      };
      setActiveTrip(mockTrip);
      startGpsBroadcast(selectedBus.id);
      Alert.alert("Trip Active 🚌", "Mock trip started. Location telemetry streams are now active.");
    } finally {
      setLoading(false);
    }
  };

  const startGpsBroadcast = (busId: string) => {
    latRef.current = 26.2912;
    lngRef.current = 73.0156;

    // Simulate sending location coordinates every 5 seconds
    telemetryInterval.current = setInterval(async () => {
      latRef.current += 0.0004;
      lngRef.current += 0.0004;
      
      const payload = {
        bus_id: busId,
        latitude: latRef.current,
        longitude: lngRef.current,
        speed: 35 + Math.round(Math.random() * 15),
        heading: 180
      };

      try {
        const token = await AsyncStorage.getItem('iris_jwt_token');
        await fetch('https://api.iris365.in/api/v1/transit/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        // Fallback to directly emitting via socket if server REST is down
        if (socketRef.current) {
          socketRef.current.emit('bus:location', payload);
        }
      }
    }, 5000);
  };

  const handleStopReached = async () => {
    if (!activeTrip || !selectedBus) return;
    const stopsList = selectedBus.bus_routes?.stops || [];
    const currentStop = stopsList[currentStopIndex];

    if (!currentStop) return;

    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      await fetch(`https://api.iris365.in/api/v1/transit/trips/${activeTrip.id}/stop-reached`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stop_index: currentStop.stop_index,
          stop_name: currentStop.name,
          passengers_boarded: passengersBoarded
        })
      });
      
      Alert.alert("Stop Logged Checksheet", `Reported stop: ${currentStop.name}\nBoarded: ${passengersBoarded} students`);
      
      if (currentStopIndex < stopsList.length - 1) {
        setCurrentStopIndex(currentStopIndex + 1);
        setPassengersBoarded(0);
      } else {
        Alert.alert("Route Completed", "You have reached the final terminal stop.");
      }
    } catch (err) {
      Alert.alert("Stop Logged (Mock)", `Stop: ${currentStop.name} logged successfully.`);
      if (currentStopIndex < stopsList.length - 1) {
        setCurrentStopIndex(currentStopIndex + 1);
        setPassengersBoarded(0);
      }
    }
  };

  const handleTriggerSOS = async () => {
    if (!selectedBus) return;
    Alert.alert(
      "Confirm SOS Alarm 🚨",
      "This will send a critical roadside alert to the transport admin control room and notify students. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trigger SOS",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('iris_jwt_token');
              await fetch('https://api.iris365.in/api/v1/transit/incidents', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  bus_id: selectedBus.id,
                  incident_type: 'breakdown',
                  severity: 'critical',
                  description: 'Emergency Driver SOS Button Triggered on Route',
                  latitude: latRef.current,
                  longitude: lngRef.current
                })
              });
              Alert.alert("SOS Dispatched", "Emergency control center has been alarmed.");
            } catch (err) {
              Alert.alert("SOS Dispatched (Mock)", "SOS incident signal emitted.");
            }
          }
        }
      ]
    );
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      await fetch(`https://api.iris365.in/api/v1/transit/trips/${activeTrip.id}/end`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (telemetryInterval.current) clearInterval(telemetryInterval.current);
      setActiveTrip(null);
      setCurrentStopIndex(0);
      Alert.alert("Trip Completed", "Telemetry broadcast closed. Have a safe day!");
    } catch (err) {
      if (telemetryInterval.current) clearInterval(telemetryInterval.current);
      setActiveTrip(null);
      setCurrentStopIndex(0);
      Alert.alert("Trip Completed (Mock)", "Trip closed.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#0D0A1A] px-4 pt-6">
      <Text className="text-white text-xl font-bold">Driver Telemetry Console</Text>
      <Text className="text-[#C4B5FD] text-xs mt-1">Simulate daily route runs and broadcast GPS coordination streams.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6C2BD9" className="mt-8" />
      ) : activeTrip ? (
        <View className="my-6 space-y-4">
          <View className="bg-[#6C2BD9]/20 border border-[#8B5CF6]/30 p-5 rounded-2xl">
            <Text className="text-emerald-400 font-bold text-xs uppercase animate-pulse">● Live Telemetry Active</Text>
            <Text className="text-white text-lg font-extrabold mt-1">{selectedBus?.vehicle_number}</Text>
            <Text className="text-[#C4B5FD]/70 text-xs mt-0.5">{selectedBus?.bus_routes?.name}</Text>
          </View>

          <View className="bg-[#13102A] p-5 rounded-2xl border border-white/5 space-y-4">
            <Text className="text-white text-sm font-bold">Current Target Stop</Text>
            <View className="p-3 bg-[#0D0A1A] rounded-xl border border-white/5">
              <Text className="text-white text-xs font-semibold">
                Stop {currentStopIndex + 1}: {selectedBus?.bus_routes?.stops[currentStopIndex]?.name || 'Terminal'}
              </Text>
              <Text className="text-[#C4B5FD]/50 text-[10px] mt-1">Press standard button below once you reach and board students.</Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setPassengersBoarded(Math.max(0, passengersBoarded - 1))}
                className="w-12 h-12 bg-white/5 border border-white/5 items-center justify-center rounded-xl"
              >
                <Text className="text-white text-lg font-bold">-</Text>
              </TouchableOpacity>
              <View className="flex-1 bg-white/5 border border-white/5 items-center justify-center rounded-xl">
                <Text className="text-white text-xs">Boarded: {passengersBoarded}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPassengersBoarded(passengersBoarded + 1)}
                className="w-12 h-12 bg-white/5 border border-white/5 items-center justify-center rounded-xl"
              >
                <Text className="text-white text-lg font-bold">+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleStopReached}
              className="w-full py-3 bg-[#6C2BD9] rounded-xl items-center"
            >
              <Text className="text-white text-xs font-bold">Log Stop Arrival</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-[#13102A] p-5 rounded-2xl border border-white/5 space-y-3">
            <Text className="text-white text-sm font-bold">Safety Incident Alerts</Text>
            <TouchableOpacity
              onPress={handleTriggerSOS}
              className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl items-center"
            >
              <Text className="text-red-400 text-xs font-bold">🚨 Trigger SOS Alarm</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleEndTrip}
            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl items-center mt-4"
          >
            <Text className="text-red-400 text-xs font-bold">Close active console / end trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="my-6 bg-[#13102A] p-6 rounded-2xl border border-white/5 space-y-4">
          <Text className="text-white text-sm font-bold">Select Fleet Vehicle</Text>
          {buses.map(b => (
            <TouchableOpacity
              key={b.id}
              onPress={() => setSelectedBus(b)}
              className={`p-4 rounded-xl border ${selectedBus?.id === b.id ? 'bg-[#6C2BD9]/20 border-[#8B5CF6]' : 'bg-[#0D0A1A] border-white/5'}`}
            >
              <Text className="text-white text-xs font-bold">{b.vehicle_number} ({b.model})</Text>
              <Text className="text-[#C4B5FD]/50 text-[10px] mt-0.5">Route: {b.bus_routes?.name}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={handleStartTrip}
            className="w-full py-3 bg-[#6C2BD9] rounded-xl items-center mt-2"
          >
            <Text className="text-white text-xs font-bold">Start Trip Broadcast</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
```

---

## Screen 12: Parent Tracking Map (`/parent/transit/track`)

This screen displays live tracking telemetry of the student's route bus, showing current upcoming stops sequence lists and ETA duration calculations.

### Code Spec:
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

export default function ParentTrackingScreen() {
  const [subscription, setSubscription] = useState<any>(null);
  const [busPosition, setBusPosition] = useState<any>(null);
  const [etas, setEtas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchSubAndTracking();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchSubAndTracking = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const profileStr = await AsyncStorage.getItem('iris_user_profile');
      const user = profileStr ? JSON.parse(profileStr) : null;
      const studentId = user?.student_id || 'c0000000-0000-0000-0000-000000000006';

      const res = await fetch(`https://api.iris365.in/api/v1/transit/subscriptions/student/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.has_subscription) {
        setSubscription(data.subscription);
        connectSocketTracking(data.subscription.route_id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      // Mock subscription fallback
      const mockSub = {
        id: 'sub-1',
        stop_name: 'Sardarpura 4th Road',
        route_id: '80000000-0000-0000-0000-000000000001',
        bus_routes: {
          name: 'Jodhpur Central Route',
          stops: [
            { name: "Sardarpura 4th Road", stop_index: 0 },
            { name: "Shastri Nagar Circle", stop_index: 1 },
            { name: "Mogra Highway Stop", stop_index: 2 },
            { name: "SIET Campus Terminal", stop_index: 3 }
          ]
        }
      };
      setSubscription(mockSub);
      connectSocketTracking(mockSub.route_id);
    }
  };

  const connectSocketTracking = (routeId: string) => {
    setBusPosition({
      latitude: 26.2912,
      longitude: 73.0156,
      speed: 38,
      heading: 180,
      vehicle_number: 'RJ-19-PB-4050'
    });
    setEtas([
      { name: "Sardarpura 4th Road", distance_km: 0.2, eta_minutes: 1 },
      { name: "Shastri Nagar Circle", distance_km: 3.4, eta_minutes: 8 },
      { name: "Mogra Highway Stop", distance_km: 15.2, eta_minutes: 24 }
    ]);
    setLoading(false);

    socketRef.current = io('https://api.iris365.in/transit', {
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('subscribe_bus', { bus_id: '70000000-0000-0000-0000-000000000001' });
    });

    socketRef.current.on('bus:location_updated', (data: any) => {
      setBusPosition({
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        vehicle_number: data.vehicle_number
      });
      if (data.etas) {
        setEtas(data.etas);
      }
    });

    socketRef.current.on('trip:delayed', (data: any) => {
      Alert.alert("⚠️ Route Delay Notification", `${data.incident_type.toUpperCase()}: ${data.description}`);
    });
  };

  return (
    <ScrollView className="flex-1 bg-[#0D0A1A] px-4 pt-6">
      <Text className="text-white text-xl font-bold">Realtime Transit Map</Text>
      <Text className="text-[#C4B5FD] text-xs mt-1">Live tracking and estimated arrival times for your child's bus route.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6C2BD9" className="mt-8" />
      ) : subscription ? (
        <View className="my-6 space-y-4">
          <View className="w-full h-52 bg-[#13102A] rounded-2xl border border-white/5 items-center justify-center overflow-hidden relative">
            <View className="absolute top-4 left-4 bg-[#6C2BD9] px-2.5 py-0.5 rounded text-[8px] font-bold">MAP ELEMENT</View>
            <Text className="text-white font-bold text-xs">Simulated Leaflet Native Tracking Coordinates</Text>
            {busPosition && (
              <Text className="text-[#C4B5FD]/70 text-[10px] mt-1 font-mono">
                Lat: {busPosition.latitude.toFixed(4)} • Lng: {busPosition.longitude.toFixed(4)} • Speed: {busPosition.speed} km/h
              </Text>
            )}
          </View>

          <View className="bg-[#13102A] p-5 rounded-2xl border border-white/5">
            <Text className="text-[#C4B5FD]/50 text-[9px] uppercase font-bold">Assigned Bus</Text>
            <Text className="text-white text-base font-bold mt-1">RJ-19-PB-4050</Text>
            <Text className="text-[#C4B5FD]/70 text-xs mt-0.5">Route: {subscription.bus_routes?.name}</Text>
            <Text className="text-[#A78BFA] text-[10px] font-semibold mt-2.5">
              My Boarding Stop: {subscription.stop_name}
            </Text>
          </View>

          <View className="bg-[#13102A] p-5 rounded-2xl border border-white/5 space-y-3.5">
            <Text className="text-white text-xs font-bold uppercase tracking-wider text-[#C4B5FD]/75">Route Sequence ETAs</Text>
            
            <View className="space-y-3">
              {etas.map((eta, i) => {
                const isMyStop = eta.name === subscription.stop_name;
                return (
                  <View key={i} className={`p-3 rounded-xl border flex-row justify-between items-center ${
                    isMyStop ? 'bg-[#6C2BD9]/10 border-[#8B5CF6]/30' : 'bg-[#0D0A1A] border-white/5'
                  }`}>
                    <View>
                      <Text className="text-white text-xs font-semibold">{eta.name}</Text>
                      <Text className="text-[#C4B5FD]/40 text-[9px] mt-0.5">Distance: {eta.distance_km} km</Text>
                    </View>

                    <View className="text-right">
                      <Text className="text-emerald-400 text-xs font-bold font-mono">{eta.eta_minutes} mins</Text>
                      {isMyStop && <Text className="text-[#A78BFA] text-[8px] font-semibold mt-0.5">Your Stop</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

        </View>
      ) : (
        <View className="my-8 rounded-2xl border border-white/5 bg-[#13102A]/20 p-8 text-center">
          <Text className="text-[#C4B5FD]/30 text-xs">No active transit subscription found. Subscribe to a route to enable tracking.</Text>
        </View>
      )}
    </ScrollView>
  );
}
```

---

## Screen 13: Mobile Guard Scanner (`/guard/scanner`)

Activated from the guard's device, this screen uses the camera to scan rotating Student QR passes, decode the signatures, verify rotation limits, check against blacklist database, and log entry movement directions.

### Code Spec:
```typescript
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MobileGuardScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    Alert.alert("Validating QR Pass...", "Checking token credentials & timestamp signatures.");

    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');

      // Dispatch request to backend core API
      const response = await fetch('https://api.iris365.in/api/v1/gate/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qr_token: data,
          gate_number: 'mobile_terminal'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert(
          "ACCESS ALLOWED ✅",
          `Logged: ${result.entry?.person_name}\nDirection: ${result.entry?.direction?.toUpperCase()}\nMethod: QR Pass`
        );
      } else {
        Alert.alert("ACCESS DENIED ❌", result.error || "Invalid scan or token expired.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not reach validation server.");
    } finally {
      // Delay scanner reactivation
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (hasPermission === null) {
    return <Text className="text-white text-center p-8">Requesting camera permissions...</Text>;
  }
  if (hasPermission === false) {
    return <Text className="text-white text-center p-8">Camera permission denied.</Text>;
  }

  return (
    <View className="flex-1 bg-[#0D0A1A]">
      <View className="p-6 bg-[#13102A] border-b border-white/5 pt-12">
        <Text className="text-white text-base font-bold">Mobile Scanner Station</Text>
        <Text className="text-[#C4B5FD] text-[10px]">Align student QR code in view below</Text>
      </View>

      <View className="flex-1 justify-center items-center relative">
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Transparent Scanning reticle overlay */}
        <View className="w-64 h-64 border-2 border-dashed border-[#A78BFA]/50 rounded-2xl items-center justify-center">
          <View className="w-48 h-[1px] bg-red-500 animate-pulse" />
        </View>
      </View>
    </View>
  );
}
```

---

## Screen 14: Mobile Visitor Pass Console (`/guard/visitor-pass`)

Enables security guards to record quick visitor intake forms from mobile terminals, snap guest photos, lookup host profiles, and register passes.

### Code Spec:
```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MobileVisitorIntakeScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostId, setHostId] = useState('b0000000-0000-0000-0000-000000000006'); // default mock student id
  const [submitting, setSubmitting] = useState(false);

  const handleRegisterVisitor = async () => {
    if (!name || !phone || !purpose) {
      Alert.alert("Validation Error", "Please fill Name, Phone, and Purpose.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('iris_jwt_token');
      const response = await fetch('https://api.iris365.in/api/v1/gate/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visitor_name: name,
          visitor_phone: phone,
          visitor_id_type: 'Aadhar Card',
          visitor_id_number: 'N/A-Mobile Intake',
          visitor_photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
          host_id: hostId,
          host_type: 'student',
          host_name: hostName || 'Khushal Gehlot',
          purpose,
          valid_hours: 4
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        Alert.alert("Pass Created 🎉", `Visitor Ticket ${result.pass?.pass_number} generated. Notice dispatched to Host.`);
        setName('');
        setPhone('');
        setPurpose('');
        setHostName('');
      } else {
        Alert.alert("Filing Failed", result.error || "An error occurred.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Unable to connect to security server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#0D0A1A] px-4 pt-12">
      <Text className="text-white text-xl font-bold">Mobile Guest Intake</Text>
      <Text className="text-[#C4B5FD] text-xs mt-1">Register incoming guests from guard mobile terminal</Text>

      <View className="my-6 space-y-4">
        <View>
          <Text className="text-[#C4B5FD]/70 text-[10px] uppercase font-bold mb-1.5">Guest Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ramesh Malhotra"
            placeholderTextColor="rgba(255,255,255,0.2)"
            className="bg-[#13102A] border border-white/5 rounded-xl px-4 py-3 text-white text-xs"
          />
        </View>

        <View>
          <Text className="text-[#C4B5FD]/70 text-[10px] uppercase font-bold mb-1.5">Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="e.g. +91 99999 88888"
            placeholderTextColor="rgba(255,255,255,0.2)"
            className="bg-[#13102A] border border-white/5 rounded-xl px-4 py-3 text-white text-xs"
          />
        </View>

        <View>
          <Text className="text-[#C4B5FD]/70 text-[10px] uppercase font-bold mb-1.5">Host Name Reference</Text>
          <TextInput
            value={hostName}
            onChangeText={setHostName}
            placeholder="e.g. Khushal Gehlot"
            placeholderTextColor="rgba(255,255,255,0.2)"
            className="bg-[#13102A] border border-white/5 rounded-xl px-4 py-3 text-white text-xs"
          />
        </View>

        <View>
          <Text className="text-[#C4B5FD]/70 text-[10px] uppercase font-bold mb-1.5">Purpose of Visit</Text>
          <TextInput
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g. Project consultation / Delivery"
            placeholderTextColor="rgba(255,255,255,0.2)"
            className="bg-[#13102A] border border-white/5 rounded-xl px-4 py-3 text-white text-xs"
          />
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={handleRegisterVisitor}
          className="w-full py-3.5 bg-[#6C2BD9] rounded-xl items-center justify-center mt-4"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-xs font-bold">Register Visitor Pass</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```





