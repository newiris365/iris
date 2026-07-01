import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';

/**
 * Mobile Student Attendance Screen Spec (/student/scanner)
 * Simulates mobile-based front-camera barcode tap and coordinate log checking.
 */
export function MobileStudentScannerScreen() {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 26.2389, lng: 73.0243 });

  useEffect(() => {
    // Simulate mobile GPS sensor lock on mount
    const timer = setTimeout(() => {
      setGpsLocked(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleScanTap = () => {
    if (!gpsLocked || loading) return;
    setLoading(true);
    setTimeout(() => {
      setScanned(true);
      setLoading(false);
    }, 1500);
  };

  const resetScanner = () => {
    setScanned(false);
  };

  return (
    <View style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Check-In Portal</Text>
        <Text style={styles.headerSubtitle}>IRIS 365 Biometric Scanner</Text>
      </View>

      {/* BODY PANEL */}
      <View style={styles.body}>
        {scanned ? (
          <View style={styles.cardSuccess}>
            <Text style={styles.titleSuccess}>✓ Attendance Logged</Text>
            <Text style={styles.descSuccess}>Status: Present</Text>
            <Text style={styles.descSuccess}>Verified: Face-Mesh + Geo-location match</Text>
            <Text style={styles.coordLabel}>
              GPS Lock: {coordinates.lat.toFixed(4)}N, {coordinates.lng.toFixed(4)}E
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={resetScanner}>
              <Text style={styles.btnText}>Check-In Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scannerViewport}>
            <View style={styles.viewfinderBox}>
              <View style={styles.laserLine} />
              <Text style={styles.scannerHint}>Align Face & QR Code</Text>
            </View>

            <View style={styles.telemetryStrip}>
              <Text style={styles.telemetryText}>
                {gpsLocked 
                  ? `✓ GPS Core Lock: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` 
                  : 'Searching GPS satellite coordinates...'}
              </Text>
            </View>

            <TouchableOpacity 
              disabled={loading || !gpsLocked}
              style={[styles.primaryBtn, (!gpsLocked || loading) && styles.btnDisabled]} 
              onPress={handleScanTap}
            >
              <Text style={styles.btnText}>
                {loading ? 'Verifying Coordinates...' : 'Tap to Emulate Scanner tap'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Mobile Parent Progress Dashboard Screen Spec (/parent/dashboard)
 * Telemetry report cards displaying attendance dials, canteen spending, and fee schedule updates.
 */
export function MobileParentDashboardScreen() {
  const [stats] = useState({
    name: 'Khushal Gehlot',
    roll: 'CS23B1024',
    overallAttendance: 84,
    healthScore: 84,
    pendingFees: 50000,
    allowance: 350
  });

  const [logs] = useState([
    { title: 'Gate Entry', desc: 'Main Campus In-Gate Checked', time: '09:05 AM', type: 'in' },
    { title: 'Canteen Order', desc: 'Meals log: Samosa & Juice', time: '11:20 AM', type: 'canteen' },
    { title: 'Class Session', desc: 'Present: Compiler Design Lab', time: '02:00 PM', type: 'present' }
  ]);

  return (
    <ScrollView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guardian Dashboard</Text>
        <Text style={styles.headerSubtitle}>Realtime Student Monitoring Panel</Text>
      </View>

      {/* STUDENT PROFILE STRIP */}
      <View style={styles.profileStrip}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{stats.name[0]}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{stats.name}</Text>
          <Text style={styles.profileRoll}>{stats.roll} • B.Tech CSE (S4)</Text>
        </View>
      </View>

      {/* GRID STATS */}
      <View style={styles.gridContainer}>
        {/* Attendance dial card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>Attendance</Text>
          <Text style={styles.statsPrimaryText}>{stats.overallAttendance}%</Text>
          <Text style={styles.statsSubText}>Status: Safe</Text>
        </View>

        {/* AI Health Score card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>AI Health</Text>
          <Text style={styles.statsPrimaryText}>{stats.healthScore}%</Text>
          <Text style={styles.statsSubText}>Low Risk Class</Text>
        </View>
      </View>

      {/* GRID STATS ROW 2 */}
      <View style={styles.gridContainer}>
        {/* Outstanding Dues */}
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>Dues Outstanding</Text>
          <Text style={[styles.statsPrimaryText, styles.textAlert]}>₹{stats.pendingFees.toLocaleString()}</Text>
          <Text style={styles.statsSubText}>Tuition installment open</Text>
        </View>

        {/* Canteen Wallet Balance card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>Canteen Balance</Text>
          <Text style={styles.statsPrimaryText}>₹{stats.allowance}</Text>
          <Text style={styles.statsSubText}>Prepaid allowance</Text>
        </View>
      </View>

      {/* TODAY'S TIMELINE LOGS */}
      <View style={styles.logsSection}>
        <Text style={styles.sectionTitle}>Child's Activity Timeline (Today)</Text>
        {logs.map((log, index) => (
          <View key={index} style={styles.logRow}>
            <View style={styles.logBullet}>
              <View style={styles.bulletInner} />
            </View>
            <View style={styles.logContent}>
              <Text style={styles.logTitleText}>{log.title}</Text>
              <Text style={styles.logDescText}>{log.desc}</Text>
            </View>
            <Text style={styles.logTimeText}>{log.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * Mobile Student Canteen Menu Screen
 * Simulates mobile-based canteen menu browsing, searching, and veg filtering.
 */
export function MobileCanteenMenuScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [dishes] = useState([
    { id: '1', name: 'Masala Dosa', price: 80, isVeg: true, calories: 350 },
    { id: '2', name: 'Cold Coffee', price: 60, isVeg: true, calories: 180 },
    { id: '3', name: 'Veg Biryani', price: 130, isVeg: true, calories: 520 },
    { id: '4', name: 'Samosa (2pc)', price: 30, isVeg: true, calories: 260 },
    { id: '5', name: 'Chicken Biryani', price: 180, isVeg: false, calories: 620 },
  ]);

  const filtered = dishes.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVeg = !vegOnly || d.isVeg;
    return matchSearch && matchVeg;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus Canteen Menu</Text>
        <Text style={styles.headerSubtitle}>Order Fresh Food Mobile App</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput 
          placeholder="Search dishes (e.g. Dosa)..."
          placeholderTextColor="#A78BFA"
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
        <TouchableOpacity 
          onPress={() => setVegOnly(!vegOnly)}
          style={[styles.vegBtn, vegOnly && styles.vegBtnActive]}
        >
          <Text style={styles.vegBtnText}>{vegOnly ? 'Veg Only 🌱' : 'All Foods'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollBody}>
        {filtered.map(dish => (
          <View key={dish.id} style={styles.dishCard}>
            <View>
              <Text style={styles.dishName}>{dish.name} {dish.isVeg ? '🌱' : '🍗'}</Text>
              <Text style={styles.dishDetails}>{dish.calories} kcal • ₹{dish.price}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setCartCount(c => c + 1)}
              style={styles.addDishBtn}
            >
              <Text style={styles.addDishBtnText}>Add +</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {cartCount > 0 && (
        <View style={styles.footerCartStrip}>
          <Text style={styles.footerCartText}>{cartCount} items selected</Text>
          <TouchableOpacity style={styles.footerCartBtn}>
            <Text style={styles.footerCartBtnText}>View Cart →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/**
 * Mobile Student Canteen Cart Screen
 * Configures items checkouts, applies promo codes, and processes wallet transactions.
 */
export function MobileCanteenCartScreen() {
  const [promo, setPromo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCheckout = () => {
    setIsSuccess(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Cart</Text>
        <Text style={styles.headerSubtitle}>Complete your dining wallet checkout</Text>
      </View>

      {isSuccess ? (
        <View style={styles.bodyCentered}>
          <View style={styles.cardSuccess}>
            <Text style={styles.titleSuccess}>✓ Payment Confirmed</Text>
            <Text style={styles.descSuccess}>Token Number: #185</Text>
            <Text style={styles.descSuccess}>Deducted: ₹140.00 from Wallet</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsSuccess(false)}>
              <Text style={styles.btnText}>Order Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.scrollBody}>
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionTitle}>Items in Cart</Text>
            
            <View style={styles.cartRow}>
              <Text style={styles.cartRowText}>1× Masala Dosa</Text>
              <Text style={styles.cartRowPrice}>₹80</Text>
            </View>
            <View style={styles.cartRow}>
              <Text style={styles.cartRowText}>1× Cold Coffee</Text>
              <Text style={styles.cartRowPrice}>₹60</Text>
            </View>

            <View style={styles.divider} />

            <TextInput 
              placeholder="Promo Code (e.g. WELCOME10)"
              placeholderTextColor="#A78BFA"
              value={promo}
              onChangeText={setPromo}
              style={styles.mobileInput}
            />

            <TextInput 
              placeholder="Add cooking notes (e.g. less ice)..."
              placeholderTextColor="#A78BFA"
              value={notes}
              onChangeText={setNotes}
              style={styles.mobileInput}
            />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>Subtotal: ₹140</Text>
              <Text style={styles.summaryTotal}>Total: ₹140</Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckout}>
              <Text style={styles.btnText}>Pay with Wallet • ₹140</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/**
 * Mobile Student Canteen Track Screen
 * Simulates realtime status tracker timeline for current active orders.
 */
export function MobileCanteenTrackScreen() {
  const [status, setStatus] = useState<'Received' | 'Preparing' | 'Ready'>('Received');

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('Preparing'), 2000);
    const t2 = setTimeout(() => setStatus('Ready'), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Order Progress</Text>
        <Text style={styles.headerSubtitle}>Order ID: ORD-MOBILE-49A</Text>
      </View>

      <View style={styles.bodyCentered}>
        <View style={styles.trackCard}>
          <Text style={styles.trackLabel}>Pickup Token</Text>
          <Text style={styles.trackToken}>#185</Text>

          <View style={styles.timelineContainer}>
            <View style={[styles.timelineDot, styles.dotActive]} />
            <Text style={[styles.timelineStep, styles.stepActive]}>1. Order Received</Text>
          </View>
          
          <View style={styles.timelineContainer}>
            <View style={[styles.timelineDot, (status === 'Preparing' || status === 'Ready') && styles.dotActive]} />
            <Text style={[styles.timelineStep, (status === 'Preparing' || status === 'Ready') && styles.stepActive]}>2. In Preparation</Text>
          </View>

          <View style={styles.timelineContainer}>
            <View style={[styles.timelineDot, status === 'Ready' && styles.dotActive]} />
            <Text style={[styles.timelineStep, status === 'Ready' && styles.stepActive]}>3. Ready for Collection</Text>
          </View>

          {status === 'Ready' && (
            <View style={styles.bellAlert}>
              <Text style={styles.bellAlertText}>🔔 Food is ready at Counter 01!</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * Mobile Student Canteen Wallet Screen
 * Razorpay emulators, allowance triggers, and manual ledger transactions audits.
 */
export function MobileCanteenWalletScreen() {
  const [balance, setBalance] = useState(350);
  const [loading, setLoading] = useState(false);

  const handleTopup = (amt: number) => {
    setLoading(true);
    setTimeout(() => {
      setBalance(b => b + amt);
      setLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet Ledger</Text>
        <Text style={styles.headerSubtitle}>Top-up campus allowance balances</Text>
      </View>

      <ScrollView style={styles.scrollBody}>
        <View style={styles.walletCard}>
          <Text style={styles.walletCardLabel}>Available Balance</Text>
          <Text style={styles.walletCardBalance}>₹{balance.toFixed(2)}</Text>
        </View>

        <Text style={styles.quickTopupTitle}>Quick Top-up Allowance</Text>
        <View style={styles.topupButtonsRow}>
          {[100, 250, 500].map(amt => (
            <TouchableOpacity 
              key={amt}
              onPress={() => handleTopup(amt)}
              style={styles.topupBtn}
            >
              <Text style={styles.topupBtnText}>+₹{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <Text style={styles.loadingText}>Simulating Razorpay Payment Gateway...</Text>
        )}

        <Text style={styles.quickTopupTitle}>Recent Ledger Transactions</Text>
        <View style={styles.mobileTxContainer}>
          <View style={styles.mobileTxRow}>
            <Text style={styles.txDesc}>Manual desk cash deposit</Text>
            <Text style={[styles.txAmt, styles.txCredit]}>+₹300.00</Text>
          </View>
          <View style={styles.mobileTxRow}>
            <Text style={styles.txDesc}>Meals: Dosa & Coffee checkout</Text>
            <Text style={[styles.txAmt, styles.txDebit]}>-₹140.00</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Mobile Gym Slot Booking Screen Spec (/student/gym/book)
 * Simulates reserving a gym session slot, showing horizontal date selector, available slot capacities, and QR check-in display.
 */
export function MobileGymSlotBookingScreen() {
  const [selectedDate, setSelectedDate] = useState('Today, Jun 10');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [qrCode, setQrCode] = useState('');

  const dates = ['Today, Jun 10', 'Thu, Jun 11', 'Fri, Jun 12', 'Sat, Jun 13', 'Sun, Jun 14'];
  const slots = [
    { id: 'slot-1', time: '06:00 AM - 07:30 AM', type: 'Weights & Cardio', capacity: '15/20 left' },
    { id: 'slot-2', time: '07:30 AM - 09:00 AM', type: 'General Training', capacity: '18/20 left' },
    { id: 'slot-3', time: '05:00 PM - 06:30 PM', type: 'Cardio Focus', capacity: '10/20 left' },
    { id: 'slot-4', time: '06:30 PM - 08:00 PM', type: 'General Training', capacity: '12/20 left' },
  ];

  const handleBookSlot = () => {
    if (!selectedSlot) return;
    const bid = `FIT-BK-${Math.floor(Math.random() * 9000 + 1000)}`;
    setBookingId(bid);
    setQrCode(`FIT-BOOK-${bid}-CS23B`);
    setBookingSuccess(true);
  };

  const handleCancelBooking = () => {
    setBookingSuccess(false);
    setSelectedSlot(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reserve Gym Slot</Text>
        <Text style={styles.headerSubtitle}>IRIS FitZone Scheduling App</Text>
      </View>

      {bookingSuccess ? (
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.bodyCentered}>
          <View style={styles.ticketCard}>
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.titleSuccess}>✓ Booking Confirmed</Text>
              <Text style={styles.descSuccess}>Show QR at gym entrance within 10 mins</Text>
            </View>

            <View style={styles.ticketDashedLine} />

            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodeImagePlaceholder}>
                <Text style={{ fontSize: 24, color: '#FFF' }}>🔳</Text>
                <Text style={{ color: '#FFF', fontSize: 10, marginTop: 5, fontFamily: 'monospace' }}>{bookingId}</Text>
              </View>
            </View>

            <View style={{ gap: 8, width: '100%', marginVertical: 15 }}>
              <Text style={styles.cartRowText}>Date: {selectedDate}</Text>
              <Text style={styles.cartRowText}>Time: {slots.find(s => s.id === selectedSlot)?.time}</Text>
              <Text style={styles.cartRowText}>Pass Code: {qrCode}</Text>
              <Text style={styles.cartRowText}>Status: Reserved</Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCancelBooking}>
              <Text style={styles.btnText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.container}>
          {/* Horizontal Date Selector */}
          <View style={{ height: 60, paddingVertical: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {dates.map(date => {
                const active = date === selectedDate;
                return (
                  <TouchableOpacity 
                    key={date} 
                    style={[styles.dateCard, active && styles.dateCardActive]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dateCardText, active && styles.dateCardTextActive]}>{date}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView style={styles.scrollBody}>
            <Text style={styles.quickTopupTitle}>Available Time Slots</Text>
            {slots.map(slot => {
              const selected = slot.id === selectedSlot;
              return (
                <TouchableOpacity 
                  key={slot.id} 
                  style={[styles.slotCard, selected && styles.slotCardActive]}
                  onPress={() => setSelectedSlot(slot.id)}
                >
                  <View>
                    <Text style={styles.dishName}>{slot.time}</Text>
                    <Text style={styles.dishDetails}>{slot.type}</Text>
                  </View>
                  <Text style={styles.slotCapacity}>{slot.capacity}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity 
              disabled={!selectedSlot}
              style={[styles.primaryBtn, !selectedSlot && styles.btnDisabled, { marginTop: 20 }]} 
              onPress={handleBookSlot}
            >
              <Text style={styles.btnText}>Book Selected Session</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/**
 * Mobile Gym Progress Charts Screen Spec (/student/gym/progress)
 * Displays emulated weekly weight trends, body composition metrics, and session logs.
 */
export function MobileGymProgressChartsScreen() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('PDF Progress Report downloaded successfully!');
    }, 1200);
  };

  const chartData = [
    { label: 'W1', value: 74.0, height: 100 },
    { label: 'W2', value: 73.5, height: 90 },
    { label: 'W3', value: 73.1, height: 82 },
    { label: 'W4', value: 72.8, height: 75 },
    { label: 'W5', value: 72.4, height: 68 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fitness Tracker</Text>
        <Text style={styles.headerSubtitle}>IRIS FitZone Analytics Dashboard</Text>
      </View>

      <View style={styles.profileStrip}>
        <View style={styles.avatarBox}>
          <Text style={{ fontSize: 20 }}>💪</Text>
        </View>
        <View>
          <Text style={styles.profileName}>Khushal Gehlot</Text>
          <Text style={styles.profileRoll}>Streak: 7 Days • Level: Intermediate</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.gridContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>Weight</Text>
          <Text style={styles.statsPrimaryText}>72.4 kg</Text>
          <Text style={[styles.statsSubText, { color: '#10B981' }]}>↓ 1.6kg this month</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>Body Fat</Text>
          <Text style={styles.statsPrimaryText}>14.8 %</Text>
          <Text style={[styles.statsSubText, { color: '#10B981' }]}>↓ 1.2% this month</Text>
        </View>
      </View>

      {/* Emulated Chart */}
      <View style={[styles.statsCard, { marginHorizontal: 15, marginBottom: 20 }]}>
        <Text style={styles.cardLabel}>Weight Trend (Past 5 Weeks)</Text>
        
        <View style={styles.progressBarChartContainer}>
          {chartData.map((bar, idx) => (
            <View key={idx} style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { height: bar.height }]} />
              <Text style={styles.progressBarLabel}>{bar.label}</Text>
              <Text style={{ color: '#C4B5FD', fontSize: 8, marginTop: 2 }}>{bar.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action button */}
      <View style={{ paddingHorizontal: 15, marginBottom: 20 }}>
        <TouchableOpacity 
          disabled={downloading}
          style={[styles.primaryBtn, downloading && styles.btnDisabled]}
          onPress={handleDownload}
        >
          <Text style={styles.btnText}>
            {downloading ? 'Compiling Fitness PDF...' : 'Download Full Progress Report (PDF)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity logs */}
      <View style={styles.logsSection}>
        <Text style={styles.sectionTitle}>Recent Workout Sessions</Text>
        <View style={styles.logRow}>
          <Text style={{ fontSize: 16, marginRight: 10 }}>🏋️</Text>
          <View style={styles.logContent}>
            <Text style={styles.logTitleText}>Full Body Strength</Text>
            <Text style={styles.logDescText}>Duration: 60 Mins • Calories: 420 kcal</Text>
          </View>
          <Text style={styles.logTimeText}>Jun 08</Text>
        </View>
        <View style={styles.logRow}>
          <Text style={{ fontSize: 16, marginRight: 10 }}>🏃</Text>
          <View style={styles.logContent}>
            <Text style={styles.logTitleText}>HIIT Cardio Sprint</Text>
            <Text style={styles.logDescText}>Duration: 45 Mins • Calories: 315 kcal</Text>
          </View>
          <Text style={styles.logTimeText}>Jun 06</Text>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * Mobile Gym Wellness Screen Spec (/student/gym/wellness)
 * Daily wellness checks for mood, sleep, stress with counselor warning suggestions.
 */
export function MobileGymWellnessScreen() {
  const [mood, setMood] = useState(3);
  const [sleep, setSleep] = useState(8);
  const [stress, setStress] = useState(3);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  const moodEmojis = ['😭', '😞', '😐', '🙂', '🤩'];

  const handleSubmitCheckin = () => {
    setCheckinSuccess(true);
  };

  const isLowWellness = mood <= 2 && stress >= 4;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wellness Check-In</Text>
        <Text style={styles.headerSubtitle}>Daily Vitals & Streak Logger</Text>
      </View>

      {checkinSuccess ? (
        <View style={styles.bodyCentered}>
          <View style={styles.cardSuccess}>
            <Text style={styles.titleSuccess}>✓ Check-in Complete</Text>
            <Text style={styles.descSuccess}>+10 FitPoints credited to ledger!</Text>
            <Text style={styles.descSuccess}>Streak maintained successfully.</Text>

            {isLowWellness && (
              <View style={styles.counselorAlertBox}>
                <Text style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>⚠️ Guidance Advice</Text>
                <Text style={{ color: '#FFF', fontSize: 10, lineHeight: 14 }}>
                  If you are feeling overwhelmed, you can request a confidential chat with our campus counselor in one click.
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.primaryBtn, { marginTop: 20 }]} 
              onPress={() => setCheckinSuccess(false)}
            >
              <Text style={styles.btnText}>Log Vitals Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.scrollBody}>
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionTitle}>How are you feeling today?</Text>

            {/* Mood selector */}
            <Text style={styles.cardLabel}>Mood State</Text>
            <View style={styles.emojiRow}>
              {[1, 2, 3, 4, 5].map(m => {
                const active = m === mood;
                return (
                  <TouchableOpacity 
                    key={m} 
                    style={[styles.emojiBtn, active && styles.emojiBtnActive]}
                    onPress={() => setMood(m)}
                  >
                    <Text style={styles.emojiText}>{moodEmojis[m - 1]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sleep hours stepper */}
            <Text style={[styles.cardLabel, { marginTop: 10 }]}>Sleep Hours</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setSleep(s => Math.max(0, s - 1))}>
                <Text style={styles.btnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{sleep} hours</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setSleep(s => Math.min(24, s + 1))}>
                <Text style={styles.btnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Stress level stepper */}
            <Text style={[styles.cardLabel, { marginTop: 10 }]}>Stress Level</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setStress(s => Math.max(1, s - 1))}>
                <Text style={styles.btnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{stress} / 5</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setStress(s => Math.min(5, s + 1))}>
                <Text style={styles.btnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 15 }]} onPress={handleSubmitCheckin}>
              <Text style={styles.btnText}>Submit Daily Log</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/**
 * Mobile Gym Virtual Classes Screen Spec (/student/gym/classes)
 * Live Jitsi streaming and video catalogs bookmarks.
 */
export function MobileGymVirtualClassesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [playingClass, setPlayingClass] = useState<string | null>(null);

  const categories = ['All', 'HIIT', 'Yoga', 'Strength', 'Stretch'];
  const classes = [
    { id: '1', title: 'Live Morning Yoga Flow', category: 'Yoga', duration: '45 Mins', isLive: true },
    { id: '2', title: 'Power HIIT Cardio Rush', category: 'HIIT', duration: '30 Mins', isLive: false },
    { id: '3', title: 'Full Body strength Conditioning', category: 'Strength', duration: '50 Mins', isLive: false },
  ];

  const filtered = classes.filter(c => selectedCategory === 'All' || c.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FitZone Virtual Classes</Text>
        <Text style={styles.headerSubtitle}>Video catalogs & Jitsi stream streams</Text>
      </View>

      {/* Horizontal Category scroll */}
      <View style={{ height: 60, paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {categories.map(cat => {
            const active = cat === selectedCategory;
            return (
              <TouchableOpacity 
                key={cat} 
                style={[styles.dateCard, active && styles.dateCardActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.dateCardText, active && styles.dateCardTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {playingClass ? (
        <ScrollView style={styles.scrollBody}>
          <View style={styles.videoPlayer}>
            <Text style={styles.videoPlaceholderText}>▶️ Playing Session: {playingClass}</Text>
            <Text style={{ color: '#A78BFA', fontSize: 10, marginTop: 10 }}>Streaming Live via Jitsi secure connection...</Text>
            
            <View style={styles.playProgressTrack}>
              <View style={styles.playProgressFill} />
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, { marginTop: 25, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} 
              onPress={() => setPlayingClass(null)}
            >
              <Text style={styles.btnText}>Close Player</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollBody}>
          {filtered.map(c => (
            <View key={c.id} style={styles.dishCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dishName}>{c.title}</Text>
                <Text style={styles.dishDetails}>
                  {c.category} • {c.duration} {c.isLive ? '🔴 LIVE' : '📼 Recorded'}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.addDishBtn, c.isLive && { backgroundColor: '#EF4444' }]}
                onPress={() => setPlayingClass(c.title)}
              >
                <Text style={styles.addDishBtnText}>{c.isLive ? 'Join' : 'Play'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/**
 * Mobile Event Discovery Feed Screen (/student/events)
 * Compiles a category browser, countdown timers, search filters, and detail overlays.
 */
export function MobileEventDiscoveryScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = ['All', 'Cultural', 'Tech', 'Workshop', 'Hackathon'];
  const events = [
    { id: '1', title: 'TechFest 2026 — AI & Robotics Summit', category: 'Tech', venue: 'Main Auditorium', date: '2026-06-20', price: '₹299', desc: 'The flagship technology summit featuring hackathons, workshops, and keynotes.' },
    { id: '2', title: 'Cultural Nite: Rhythm & Hues', category: 'Cultural', venue: 'Open Air Theatre', date: '2026-06-25', price: 'FREE', desc: 'Annual cultural extravaganza with live performances, DJ night, and food stalls.' },
    { id: '3', title: 'Design Thinking Workshop', category: 'Workshop', venue: 'Seminar Hall B', date: '2026-06-18', price: 'FREE', desc: 'Hands-on workshop on design thinking methodology with industry professionals.' },
    { id: '4', title: 'CodeStorm — 24hr Hackathon', category: 'Hackathon', venue: 'Innovation Lab', date: '2026-07-12', price: '₹199', desc: 'Build, break, innovate. 24 hours of non-stop coding with prizes worth 2L.' }
  ];

  const filtered = events.filter(e => {
    const matchCat = selectedCategory === 'All' || e.category === selectedCategory;
    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IRIS Event Discovery</Text>
        <Text style={styles.headerSubtitle}>Browse upcoming campus events & festivals</Text>
      </View>

      {/* Search Input bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          placeholder="Search events..."
          placeholderTextColor="#A78BFA"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Horizontal Category bar */}
      <View style={{ height: 60, paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {categories.map(cat => {
            const active = cat === selectedCategory;
            return (
              <TouchableOpacity 
                key={cat} 
                style={[styles.dateCard, active && styles.dateCardActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.dateCardText, active && styles.dateCardTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List Feed */}
      <ScrollView style={styles.scrollBody}>
        {filtered.map(e => {
          const isExpanded = expandedId === e.id;
          return (
            <TouchableOpacity 
              key={e.id} 
              style={[styles.slotCard, isExpanded && styles.slotCardActive]}
              onPress={() => setExpandedId(isExpanded ? null : e.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.dishName}>{e.title}</Text>
                <Text style={styles.dishDetails}>{e.category} • {e.venue} • {e.date}</Text>
                <Text style={[styles.slotCapacity, { marginTop: 4 }]}>Price: {e.price}</Text>
                
                {isExpanded && (
                  <Text style={{ color: '#C4B5FD', fontSize: 11, marginTop: 10, lineHeight: 16 }}>
                    {e.desc}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * Mobile Event Ticket Pass Screen (/student/events/:id/ticket)
 * Renders glassmorphic event passes featuring cryptographic QR checks.
 */
export function MobileEventTicketScreen() {
  const [ticket] = useState({
    ticket_number: 'EVT-A3F9K2L1',
    event_title: 'TechFest 2026 — AI & Robotics Summit',
    venue: 'Main Auditorium, Block A',
    date: '2026-06-20',
    type: 'In Person Attendee',
    payment_status: 'Completed'
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Event Ticket Pass</Text>
        <Text style={styles.headerSubtitle}>Present at campus entrance check-in counter</Text>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={{ alignItems: 'center', paddingTop: 20 }}>
        <View style={styles.ticketCard}>
          {/* Top header strip */}
          <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>IRIS 365 Pass</Text>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 8 }}>{ticket.event_title}</Text>
          
          <View style={styles.ticketDashedLine} />

          {/* Details */}
          <View style={{ width: '100%', gap: 6, marginBottom: 15 }}>
            <Text style={{ color: '#C4B5FD', fontSize: 11 }}><Text style={{ fontWeight: 'bold' }}>Venue:</Text> {ticket.venue}</Text>
            <Text style={{ color: '#C4B5FD', fontSize: 11 }}><Text style={{ fontWeight: 'bold' }}>Date:</Text> {ticket.date}</Text>
            <Text style={{ color: '#C4B5FD', fontSize: 11 }}><Text style={{ fontWeight: 'bold' }}>Option:</Text> {ticket.type}</Text>
          </View>

          {/* QR Box */}
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCodeImagePlaceholder}>
              <Text style={{ fontSize: 48, color: '#C4B5FD' }}>🔲</Text>
            </View>
          </View>

          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold', fontFamily: 'monospace', marginTop: 12 }}>{ticket.ticket_number}</Text>
          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: 'bold', marginTop: 6 }}>✓ payment: {ticket.payment_status}</Text>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20, width: '90%' }]}>
          <Text style={styles.btnText}>Share Pass via WhatsApp</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/**
 * Mobile Event Live Interaction Panel (/student/events/:id/live)
 * Allows floating reaction emission, poll voting, and moderated Q&A posts.
 */
export function MobileEventLiveScreen() {
  const [question, setQuestion] = useState('');
  const [votedOption, setVotedOption] = useState<number | null>(null);
  
  const [activePoll] = useState({
    id: 'p1',
    question: 'Which AI model are you most excited to build with today?',
    options: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro']
  });

  const [questions, setQuestions] = useState([
    { id: '1', text: 'Will GPU cloud servers be provided?', upvotes: 24 },
    { id: '2', text: 'Is there a limit on group submission members?', upvotes: 8 }
  ]);

  const handleSendReaction = (emoji: string) => {
    // Simulated Socket emit
  };

  const handleUpvote = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
  };

  const handlePostQuestion = () => {
    if (!question.trim()) return;
    const mockQ = {
      id: Math.random().toString(),
      text: question,
      upvotes: 0
    };
    setQuestions([mockQ, ...questions]);
    setQuestion('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Event Hub</Text>
        <Text style={styles.headerSubtitle}>Vote in polls, post questions, send reactions</Text>
      </View>

      <ScrollView style={styles.scrollBody}>
        {/* Live Reactions Panel */}
        <View style={[styles.cartSection, { marginBottom: 20 }]}>
          <Text style={styles.cartSectionTitle}>Float Emoji Reactions</Text>
          <View style={styles.emojiRow}>
            {['❤️', '👏', '🔥', '😮'].map(emoji => (
              <TouchableOpacity 
                key={emoji} 
                style={styles.emojiBtn}
                onPress={() => handleSendReaction(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Live Poll Panel */}
        <View style={[styles.cartSection, { marginBottom: 20 }]}>
          <Text style={styles.cartSectionTitle}>Realtime Audience Poll</Text>
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold', marginVertical: 8 }}>
            {activePoll.question}
          </Text>

          {activePoll.options.map((opt, idx) => {
            const isVoted = votedOption === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.slotCard, isVoted && styles.slotCardActive, { paddingVertical: 10, marginVertical: 4 }]}
                onPress={() => setVotedOption(idx)}
              >
                <Text style={{ color: '#FFF', fontSize: 11 }}>{opt}</Text>
                {isVoted && <Text style={{ color: '#10B981', fontSize: 10, fontWeight: 'bold' }}>Voted</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Q&A Board */}
        <View style={styles.cartSection}>
          <Text style={styles.cartSectionTitle}>Auditorium Q&A Board</Text>
          
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
            <TextInput
              placeholder="Submit a question to organizers..."
              placeholderTextColor="#A78BFA"
              value={question}
              onChangeText={setQuestion}
              style={[styles.searchInput, { flex: 1 }]}
            />
            <TouchableOpacity style={styles.addDishBtn} onPress={handlePostQuestion}>
              <Text style={styles.addDishBtnText}>Post</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 8, marginTop: 10 }}>
            {questions.map(q => (
              <View key={q.id} style={[styles.dishCard, { marginBottom: 4 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFF', fontSize: 12 }}>{q.text}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.addDishBtn, { backgroundColor: 'rgba(108,43,217,0.15)', borderWidth: 1, borderColor: '#6C2BD9' }]}
                  onPress={() => handleUpvote(q.id)}
                >
                  <Text style={{ color: '#A78BFA', fontSize: 10, fontWeight: 'bold' }}>🔥 {q.upvotes}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Mobile Hostel Preferences Screen Spec
 */
export function MobileHostelPreferencesScreen() {
  const [sleep, setSleep] = useState(3);
  const [study, setStudy] = useState(3);
  const [clean, setClean] = useState(3);
  const [noise, setNoise] = useState(3);
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Roommate Matching Preferences</Text>
        <Text style={styles.headerSubtitle}>Configure sliders to match optimal roommates</Text>
      </View>
      <ScrollView style={styles.scrollBody}>
        {saved ? (
          <View style={styles.cardSuccess}>
            <Text style={styles.titleSuccess}>✓ Preferences Saved</Text>
            <Text style={styles.descSuccess}>Matching algorithm updated. Potential roommates will appear in allocation matrices.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setSaved(false)}>
              <Text style={styles.btnText}>Edit Preferences</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionTitle}>Preference Sliders (1-5)</Text>
            
            <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: 'bold', marginTop: 10 }}>Sleep Schedule: {sleep}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setSleep(s => Math.max(1, s - 1))}>
                <Text style={styles.stepperVal}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{sleep === 1 ? 'Early Bird' : sleep === 5 ? 'Night Owl' : 'Balanced'}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setSleep(s => Math.min(5, s + 1))}>
                <Text style={styles.stepperVal}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: 'bold', marginTop: 10 }}>Study Habits: {study}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setStudy(s => Math.max(1, s - 1))}>
                <Text style={styles.stepperVal}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{study <= 2 ? 'In-room' : 'Library/Group'}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setStudy(s => Math.min(5, s + 1))}>
                <Text style={styles.stepperVal}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: 'bold', marginTop: 10 }}>Cleanliness: {clean}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setClean(s => Math.max(1, s - 1))}>
                <Text style={styles.stepperVal}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{clean <= 2 ? 'Relaxed' : clean === 5 ? 'Spotless' : 'Neat'}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setClean(s => Math.min(5, s + 1))}>
                <Text style={styles.stepperVal}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: 'bold', marginTop: 10 }}>Noise Tolerance: {noise}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setNoise(s => Math.max(1, s - 1))}>
                <Text style={styles.stepperVal}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{noise <= 2 ? 'Low Tolerance' : 'High Tolerance'}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setNoise(s => Math.min(5, s + 1))}>
                <Text style={styles.stepperVal}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={() => setSaved(true)}>
              <Text style={styles.btnText}>Save Roommate Preferences</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Mobile Digital Night Roll Call Screen Spec
 */
export function MobileHostelRollCallScreen() {
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (confirmed || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, confirmed]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Night Roll Call</Text>
        <Text style={styles.headerSubtitle}>Confirm presence for Floor 2 check-in</Text>
      </View>
      <View style={styles.body}>
        {confirmed ? (
          <View style={styles.cardSuccess}>
            <Text style={styles.titleSuccess}>✓ Presence Verified</Text>
            <Text style={styles.descSuccess}>Logged: Present at {new Date().toLocaleTimeString()}</Text>
            <Text style={{ color: '#A78BFA', fontSize: 10, marginTop: 10 }}>Verified via Block Wi-Fi gateway</Text>
          </View>
        ) : timeLeft <= 0 ? (
          <View style={[styles.cardSuccess, { borderColor: 'rgba(239, 68, 68, 0.25)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={[styles.titleSuccess, { color: '#EF4444' }]}>⚠ Window Expired</Text>
            <Text style={styles.descSuccess}>You missed the 60s verification time frame. Contact warden desk.</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <View style={[styles.scannerViewport, { marginBottom: 20 }]}>
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', fontFamily: 'monospace' }}>{timeLeft}s</Text>
              <Text style={{ color: '#A78BFA', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold', marginTop: 5 }}>Verification Window Time</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setConfirmed(true)}>
              <Text style={styles.btnText}>Tap to Confirm Presence</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Mobile Mental Wellness Check-in Screen Spec
 */
export function MobileHostelWellnessScreen() {
  const [mood, setMood] = useState(3);
  const [notes, setNotes] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [crisis, setCrisis] = useState(false);

  const emojis = ['😢', '😟', '😐', '🙂', '😊'];

  const handleSubmit = (isCrisis: boolean) => {
    if (isCrisis) {
      setCrisis(true);
    }
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wellness Tracker</Text>
        <Text style={styles.headerSubtitle}>How is your week in the hostel?</Text>
      </View>
      <ScrollView style={styles.scrollBody}>
        {submitted ? (
          <View style={styles.cardSuccess}>
            <Text style={styles.titleSuccess}>{crisis ? '⚠ Counselor Contacted' : '✓ Wellness Logged'}</Text>
            <Text style={styles.descSuccess}>
              {crisis 
                ? 'Your immediate help request has been triggered. A counselor will reach out shortly.' 
                : 'Thank you for checking in. Your mood logging helps aggregate block stats.'}
            </Text>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 15 }]} onPress={() => { setSubmitted(false); setCrisis(false); }}>
              <Text style={styles.btnText}>Submit Another Check-in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionTitle}>Choose Mood Rating (1-5)</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 }}>
              {emojis.map((emoji, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.stepperBtn, mood === (idx + 1) && { backgroundColor: '#6C2BD9' }]}
                  onPress={() => setMood(idx + 1)}
                >
                  <Text style={{ fontSize: 16 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Add optional notes (roommate, studies, health)..."
              placeholderTextColor="#A78BFA"
              value={notes}
              onChangeText={setNotes}
              style={[styles.searchInput, { height: 80, textAlignVertical: 'top', padding: 12, marginBottom: 15 }]}
              multiline
            />

            <TouchableOpacity style={[styles.primaryBtn, { marginBottom: 15 }]} onPress={() => handleSubmit(false)}>
              <Text style={styles.btnText}>Submit Check-in</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: '#EF4444' }]} 
              onPress={() => handleSubmit(true)}
            >
              <Text style={styles.btnText}>⚠ CRISIS: NEED HELP NOW</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Mobile Library Research Screen Spec
 * Chat interface and forms for research topic concepts, summarization, and comparisons.
 */
export function MobileLibraryResearchScreen() {
  const [activeTab, setActiveTab] = useState<'brief' | 'summarize' | 'compare'>('brief');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [bookA, setBookA] = useState('');
  const [bookB, setBookB] = useState('');
  const [comparison, setComparison] = useState<any>(null);

  const handleResearch = () => {
    if (!topic.trim()) return;
    setLoading(true);
    setBrief(null);
    setTimeout(() => {
      setBrief({
        concepts: [
          { title: 'Asymptotic Complexity', desc: 'Analyzing algorithm efficiency for large data inputs.' },
          { title: 'Divide & Conquer Paradigm', desc: 'Breaking problem down into sub-problems recursively.' }
        ],
        books: ['Introduction to Algorithms', 'Design Patterns'],
        references: ['ACM Surveys, 2026', 'IEEE Transactions on Computers']
      });
      setLoading(false);
    }, 1000);
  };

  const handleSummarize = () => {
    if (!selectedBook) return;
    setLoading(true);
    setSummary([]);
    setTimeout(() => {
      setSummary([
        '1. Essential academic algorithms guide.',
        '2. Focuses on asymptotic performance bounds.',
        '3. Includes proofs for sorting and search methods.',
        '4. Standard university computer science textbook.',
        '5. High utility for practical coding exams.'
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleCompare = () => {
    if (!bookA || !bookB) return;
    setLoading(true);
    setComparison(null);
    setTimeout(() => {
      setComparison({
        focusA: 'Book A focuses on theoretical proof trees.',
        focusB: 'Book B focuses on programming codes.',
        verdict: 'Use Book A for classes; Book B for project building.'
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Research Assistant</Text>
        <Text style={styles.headerSubtitle}>IRIS Library Mobile AI Companion</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: '#13102A' }}>
        {(['brief', 'summarize', 'compare'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, alignItems: 'center', py: 12, borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: '#6C2BD9', padding: 12 }}
          >
            <Text style={{ color: activeTab === tab ? '#FFF' : '#C4B5FD', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'brief' && (
          <View style={{ padding: 15, gap: 15 }}>
            <View style={styles.cartSection}>
              <Text style={styles.cartSectionTitle}>Topic Research Brief</Text>
              <TextInput
                placeholder="Enter research topic..."
                placeholderTextColor="#A78BFA"
                value={topic}
                onChangeText={setTopic}
                style={styles.mobileInput}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleResearch} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Synthesizing...' : 'Request AI Brief'}</Text>
              </TouchableOpacity>
            </View>

            {brief && (
              <View style={{ gap: 12 }}>
                <Text style={styles.quickTopupTitle}>Key Concepts</Text>
                {brief.concepts.map((c: any, i: number) => (
                  <View key={i} style={styles.slotCard}>
                    <Text style={{ color: '#A78BFA', fontWeight: 'bold', fontSize: 12 }}>{c.title}</Text>
                    <Text style={{ color: '#C4B5FD', fontSize: 10, marginTop: 4 }}>{c.desc}</Text>
                  </View>
                ))}

                <Text style={styles.quickTopupTitle}>Suggested Catalog Books</Text>
                {brief.books.map((b: string, i: number) => (
                  <View key={i} style={styles.logRow}>
                    <Text style={styles.logTitleText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'summarize' && (
          <View style={{ padding: 15, gap: 15 }}>
            <View style={styles.cartSection}>
              <Text style={styles.cartSectionTitle}>Book Summarizer</Text>
              <TextInput
                placeholder="Type Book Title..."
                placeholderTextColor="#A78BFA"
                value={selectedBook}
                onChangeText={setSelectedBook}
                style={styles.mobileInput}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSummarize} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Summarizing...' : 'Get 5-Point Summary'}</Text>
              </TouchableOpacity>
            </View>

            {summary.length > 0 && (
              <View style={styles.cartSection}>
                <Text style={styles.cartSectionTitle}>Claude Summary</Text>
                {summary.map((point, i) => (
                  <Text key={i} style={{ color: '#FFF', fontSize: 11, marginVertical: 4 }}>{point}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'compare' && (
          <View style={{ padding: 15, gap: 15 }}>
            <View style={styles.cartSection}>
              <Text style={styles.cartSectionTitle}>Compare Textbooks</Text>
              <TextInput
                placeholder="Book A Title..."
                placeholderTextColor="#A78BFA"
                value={bookA}
                onChangeText={setBookA}
                style={styles.mobileInput}
              />
              <TextInput
                placeholder="Book B Title..."
                placeholderTextColor="#A78BFA"
                value={bookB}
                onChangeText={setBookB}
                style={styles.mobileInput}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleCompare} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Comparing...' : 'Compare Suitability'}</Text>
              </TouchableOpacity>
            </View>

            {comparison && (
              <View style={styles.cartSection}>
                <Text style={styles.cartSectionTitle}>Comparison Verdict</Text>
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Book A Focus:</Text>
                <Text style={{ color: '#C4B5FD', fontSize: 10, marginBottom: 8 }}>{comparison.focusA}</Text>
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Book B Focus:</Text>
                <Text style={{ color: '#C4B5FD', fontSize: 10, marginBottom: 8 }}>{comparison.focusB}</Text>
                <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: 'bold' }}>AI Recommendation:</Text>
                <Text style={{ color: '#FFF', fontSize: 11 }}>{comparison.verdict}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Mobile Library Goals Screen Spec
 * Displays goal indicators, streaking logs, and manual pages logger.
 */
export function MobileLibraryGoalsScreen() {
  const [target, setTarget] = useState(12);
  const [completed, setCompleted] = useState(3);
  const [streak, setStreak] = useState(5);
  const [pagesLog, setPagesLog] = useState('');
  const [isBookComplete, setIsBookComplete] = useState(false);

  const handleLogProgress = () => {
    const pages = parseInt(pagesLog);
    if (isNaN(pages) || pages <= 0) return;
    setStreak(s => s + 1);
    if (isBookComplete) {
      setCompleted(c => c + 1);
    }
    setPagesLog('');
    setIsBookComplete(false);
    alert(`Logged ${pages} pages read! daily streak extended!`);
  };

  const handleUpdateTarget = () => {
    alert(`Target set to ${target} books for the year!`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reading Challenge</Text>
        <Text style={styles.headerSubtitle}>IRIS Library Goals Tracker</Text>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>Books Completed</Text>
          <Text style={styles.statsPrimaryText}>{completed} / {target}</Text>
          <Text style={styles.statsSubText}>{target - completed} books remaining</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>Daily Streak</Text>
          <Text style={styles.statsPrimaryText}>{streak} Days</Text>
          <Text style={styles.statsSubText}>Keep logging daily!</Text>
        </View>
      </View>

      <View style={styles.cartSection}>
        <Text style={styles.cartSectionTitle}>Log Reading Session</Text>
        <TextInput
          placeholder="Number of pages read..."
          placeholderTextColor="#A78BFA"
          keyboardType="numeric"
          value={pagesLog}
          onChangeText={setPagesLog}
          style={styles.mobileInput}
        />
        <TouchableOpacity
          onPress={() => setIsBookComplete(!isBookComplete)}
          style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}
        >
          <Text style={{ color: '#C4B5FD', fontSize: 11 }}>
            {isBookComplete ? '🌱 Finished the book!' : 'Did you complete the book?'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogProgress}>
          <Text style={styles.btnText}>Log Progress</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cartSection}>
        <Text style={styles.cartSectionTitle}>Update Annual Challenge</Text>
        <TextInput
          placeholder="Target books count..."
          placeholderTextColor="#A78BFA"
          keyboardType="numeric"
          value={target.toString()}
          onChangeText={text => setTarget(parseInt(text) || 0)}
          style={styles.mobileInput}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateTarget}>
          <Text style={styles.btnText}>Update Target</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/**
 * Mobile Library Book Clubs Screen Spec
 * Chapter discussion boards threads simulator.
 */
export function MobileLibraryBookClubsScreen() {
  const [selectedClub, setSelectedClub] = useState('c1');
  const [replyText, setReplyText] = useState('');
  const [responses, setResponses] = useState([
    { name: 'Khushal Patel', text: 'Asymptotic analysis is critical for evaluating memory scalability.', date: 'Jun 09' }
  ]);

  const clubs = [
    { id: 'c1', name: 'Algorithms & Computing club', schedule: 'Fri 4 PM' },
    { id: 'c2', name: 'AI Frontiers Circle', schedule: 'Mon 6 PM' }
  ];

  const handlePostReply = () => {
    if (!replyText.trim()) return;
    setResponses([
      ...responses,
      { name: 'Me', text: replyText, date: 'Today' }
    ]);
    setReplyText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book Clubs Forum</Text>
        <Text style={styles.headerSubtitle}>Active Discussions & Study Circles</Text>
      </View>

      {/* Selector */}
      <View style={{ paddingVertical: 10, height: 60 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {clubs.map(c => {
            const active = c.id === selectedClub;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.dateCard, active && styles.dateCardActive]}
                onPress={() => setSelectedClub(c.id)}
              >
                <Text style={[styles.dateCardText, active && styles.dateCardTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 80 }}>
        {selectedClub === 'c1' ? (
          <View style={{ padding: 15, gap: 15 }}>
            <View style={styles.ticketCard}>
              <Text style={{ color: '#A78BFA', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' }}>Chapter 1: Foundations</Text>
              <Text style={{ color: '#FFF', fontSize: 12, marginTop: 4, lineHeight: 16 }}>
                "What are the main time complexities we care about in practice and why does asymptotic order matter?"
              </Text>
            </View>

            <Text style={styles.quickTopupTitle}>Replies</Text>
            {responses.map((r, i) => (
              <View key={i} style={styles.slotCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#A78BFA', fontWeight: 'bold', fontSize: 10 }}>{r.name}</Text>
                  <Text style={{ color: '#C4B5FD', fontSize: 8 }}>{r.date}</Text>
                </View>
                <Text style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>{r.text}</Text>
              </View>
            ))}

            <View style={styles.cartSection}>
              <TextInput
                placeholder="Write analytical reply..."
                placeholderTextColor="#A78BFA"
                value={replyText}
                onChangeText={setReplyText}
                style={styles.mobileInput}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handlePostReply}>
                <Text style={styles.btnText}>Post Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#C4B5FD', fontSize: 12 }}>No discussions launched yet in this club.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function MobileTransitPredictiveScreen() {
  const [prediction, setPrediction] = useState({
    predicted_delay_minutes: 8,
    confidence_score: 91,
    delay_factors: [
      { factor: 'Historical baseline avg', weight: 4 },
      { factor: 'Weather slowdown (Rain/Wet roads)', weight: 4 }
    ],
    route_name: "Jodhpur Central Route (ROUTE-101)"
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ML Predictive Arrival</Text>
        <Text style={styles.headerSubtitle}>Calculated arrival times & delay statistics</Text>
      </View>
      <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 15, gap: 15 }}>
        <View style={styles.ticketCard}>
          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Live Status</Text>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'extrabold', marginTop: 5 }}>Predicted Delay: {prediction.predicted_delay_minutes} min</Text>
          <Text style={{ color: '#C4B5FD', fontSize: 10, marginTop: 2 }}>Confidence score: {prediction.confidence_score}%</Text>
        </View>

        <Text style={styles.quickTopupTitle}>Delay Factor Breakdown</Text>
        {prediction.delay_factors.map((df, i) => (
          <View key={i} style={styles.slotCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>{df.factor}</Text>
              <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: 'bold' }}>+{df.weight} mins</Text>
            </View>
          </View>
        ))}

        <View style={{ padding: 15, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLength: 1, borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 12 }}>
          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: 'bold' }}>SATELLITE CALIBRATION REPORT</Text>
          <Text style={{ color: '#C4B5FD', fontSize: 10, marginTop: 4, lineHeight: 14 }}>
            Prediction aggregates over 90 days of trip logs, day of week schedules, and active meteorological alerts.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export function MobileTransitSOSScreen() {
  const [triggered, setTriggered] = useState(false);
  const [lastRfid, setLastRfid] = useState('RFID scan: Boarded Bus Stop Jodhpur Terminal (05:05 PM)');
  const [lastGps, setLastGps] = useState('GPS Lat: 26.2912, Lng: 73.0156 (Updated 1 min ago)');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent Transit SOS</Text>
        <Text style={styles.headerSubtitle}>Instant emergency warden alerts</Text>
      </View>
      <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 15, gap: 15 }}>
        <View style={{ padding: 15, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLength: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 12, gap: 8 }}>
          <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>EMERGENCY PROCEDURES</Text>
          <Text style={{ color: '#C4B5FD', fontSize: 10, lineHeight: 14 }}>
            Tapping the SOS will instantly broadcast an alarm to the bus driver console, alert campus security and wardens, and load emergency RFID tracking.
          </Text>
        </View>

        {!triggered ? (
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: '#EF4444', height: 50, justifyContent: 'center' }]} 
            onPress={() => setTriggered(true)}
          >
            <Text style={styles.btnText}>TRIGGER EMERGENCY SOS ALARM</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ padding: 15, backgroundColor: '#251215', borderRadius: 12, borderLength: 1, borderColor: '#EF4444', gap: 5 }}>
            <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 12 }}>DISPATCH SYSTEMS ACTIVE</Text>
            <Text style={{ color: '#C4B5FD', fontSize: 10 }}>Driver has been notified. Security team is checking logs.</Text>
          </View>
        )}

        <Text style={styles.quickTopupTitle}>Child Telemetry Tracker</Text>
        <View style={styles.slotCard}>
          <Text style={{ color: '#A78BFA', fontSize: 10, fontWeight: 'bold' }}>LAST RFID CARD TOUCHPOINT</Text>
          <Text style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>{lastRfid}</Text>
        </View>

        <View style={styles.slotCard}>
          <Text style={{ color: '#A78BFA', fontSize: 10, fontWeight: 'bold' }}>LAST GPS VEHICLE COORDINATE</Text>
          <Text style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>{lastGps}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

export function MobileTransitParkingScreen() {
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicles, setVehicles] = useState([
    { number: 'RJ-19-CS-4412', model: 'Hero Splendor', verified: true }
  ]);

  const handleRegister = () => {
    if (!vehicleNo) return;
    setVehicles([...vehicles, { number: vehicleNo.toUpperCase(), model: 'Honda Activa', verified: true }]);
    setVehicleNo('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus Parking Passes</Text>
        <Text style={styles.headerSubtitle}>Manage passes & slot grids</Text>
      </View>
      <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 15, gap: 15 }}>
        <Text style={styles.quickTopupTitle}>Your Registered Passes</Text>
        {vehicles.map((v, i) => (
          <View key={i} style={styles.ticketCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' }}>{v.number}</Text>
                <Text style={{ color: '#C4B5FD', fontSize: 10, marginTop: 2 }}>{v.model}</Text>
              </View>
              <View style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#000', fontSize: 8, fontWeight: 'bold' }}>QR PASS</Text>
              </View>
            </View>
            <Text style={{ color: '#10B981', fontSize: 9, marginTop: 8 }}>✓ Verified for Entry Gate Scanners</Text>
          </View>
        ))}

        <Text style={styles.quickTopupTitle}>Register Vehicle</Text>
        <View style={styles.cartSection}>
          <TextInput
            placeholder="e.g. RJ-19-CS-1234"
            placeholderTextColor="#A78BFA"
            value={vehicleNo}
            onChangeText={setVehicleNo}
            style={styles.mobileInput}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister}>
            <Text style={styles.btnText}>Register & Issue Pass</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export function MobileGateMusterScreen() {
  const [markedSafe, setMarkedSafe] = useState(false);
  const [musterLocation, setMusterLocation] = useState('Main Sports Field');

  const handleMarkSafe = () => {
    setMarkedSafe(true);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: '#251215', borderBottomColor: '#EF4444' }]}>
        <Text style={[styles.headerTitle, { color: '#EF4444' }]}>EMERGENCY MUSTER DRILL</Text>
        <Text style={styles.headerSubtitle}>Evacuate to nearest safe assembly point</Text>
      </View>
      <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 15, gap: 15 }}>
        <View style={[styles.ticketCard, { borderColor: '#EF4444' }]}>
          <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: 'bold' }}>ACTIVE ALARM SYSTEM</Text>
          <Text style={{ color: '#FFF', fontSize: 13, marginTop: 5, lineHeight: 18 }}>
            "A fire evacuation drill is currently active. Evacuate Academic Blocks and gather at Sports Ground."
          </Text>
        </View>

        {!markedSafe ? (
          <View style={{ gap: 15 }}>
            <Text style={styles.quickTopupTitle}>Select Your Safe Assembly Point</Text>
            <View style={styles.cartSection}>
              <TextInput
                value={musterLocation}
                onChangeText={setMusterLocation}
                style={styles.mobileInput}
              />
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#EF4444' }]} onPress={handleMarkSafe}>
                <Text style={styles.btnText}>MARK MYSELF SAFE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ padding: 20, alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, borderLength: 1, borderColor: '#10B981', gap: 10 }}>
            <Text style={{ color: '#10B981', fontSize: 15, fontWeight: 'bold' }}>✓ Accounted Safe</Text>
            <Text style={{ color: '#C4B5FD', fontSize: 10, textAlign: 'center', lineHeight: 14 }}>
              Safety status logged at assembly: {musterLocation}. Please follow marshal directions.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function MobileGateIntercomScreen() {
  const [incoming, setIncoming] = useState(true);
  const [statusText, setStatusText] = useState('Incoming ring...');

  const handleResponse = (approved: boolean) => {
    setIncoming(false);
    setStatusText(approved ? 'Visitor Approved!' : 'Visitor Access Denied.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Intercom Call</Text>
        <Text style={styles.headerSubtitle}>Direct gate kiosk tablet connection</Text>
      </View>
      <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 15, gap: 20 }}>
        <View style={styles.ticketCard}>
          <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: 'bold' }}>VIDEO RINGING</Text>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'extrabold', marginTop: 5 }}>Rohan Verma (Guardian)</Text>
          <Text style={{ color: '#C4B5FD', fontSize: 10, marginTop: 2 }}>{statusText}</Text>
        </View>

        {incoming && (
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { flex: 1, backgroundColor: '#10B981', height: 45, justifyContent: 'center' }]} 
              onPress={() => handleResponse(true)}
            >
              <Text style={styles.btnText}>Approve entry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryBtn, { flex: 1, backgroundColor: '#EF4444', height: 45, justifyContent: 'center' }]} 
              onPress={() => handleResponse(false)}
            >
              <Text style={styles.btnText}>Deny entry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.slotCard}>
          <Text style={{ color: '#A78BFA', fontSize: 10, fontWeight: 'bold' }}>KIOSK FEED SUMMARY</Text>
          <Text style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>
            Direct visitor intercom calls allow zero-guard checkins. Calls are automatically recorded for safety tracking.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export function MobileGateContractorScreen() {
  const [permits, setPermits] = useState([
    { company: 'Apex Plumbing Services', scope: 'Pipeline Repair', date: 'Today', status: 'Approved' }
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contractor Permit passes</Text>
        <Text style={styles.headerSubtitle}>Vendor checks & QR credentials</Text>
      </View>
      <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 15, gap: 15 }}>
        {permits.map((p, i) => (
          <View key={i} style={styles.ticketCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{p.company}</Text>
                <Text style={{ color: '#C4B5FD', fontSize: 10, marginTop: 2 }}>{p.scope}</Text>
              </View>
              <View style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#000', fontSize: 8, fontWeight: 'bold' }}>QR PASS</Text>
              </View>
            </View>
            <Text style={{ color: '#10B981', fontSize: 9, marginTop: 8 }}>✓ Work Permit Approved for today</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Mobile Director Strategic Goals Screen Spec (/director/goals)
 * Simulates setting annual targets, showing trajectory projections and at-risk alarms.
 */
export function MobileDirectorGoalsScreen() {
  const [goals, setGoals] = useState([
    { id: '1', name: 'Attendance Rate', target: 85, current: 82, unit: '%', status: 'on_track', projected: 83.2, alarm: '' },
    { id: '2', name: 'Fee Collection', target: 150, current: 142, unit: 'L', status: 'on_track', projected: 148, alarm: '' },
    { id: '3', name: 'Pass Rate', target: 90, current: 88, unit: '%', status: 'on_track', projected: 89, alarm: '' },
    { id: '4', name: 'Annual Fee Target Large', target: 250, current: 110, unit: 'L', status: 'at_risk', projected: 170, alarm: 'At current rate, Fee target will be missed by ₹80L' }
  ]);

  const handleAdjustTarget = (id: string, delta: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const newTarget = Math.max(0, g.target + delta);
        // Recalculate alarm
        let alarm = '';
        if (g.projected < newTarget && g.status === 'at_risk') {
          alarm = `At current rate, Fee target will be missed by ₹${newTarget - g.projected}L`;
        }
        return { ...g, target: newTarget, alarm };
      }
      return g;
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Director Strategic Goals</Text>
        <Text style={styles.headerSubtitle}>Real-time Trajectory Forecasts</Text>
      </View>

      {/* Alarm triggers */}
      {goals.some(g => g.alarm) && (
        <View style={[styles.cardSuccess, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', marginHorizontal: 15, marginTop: 15 }]}>
          <Text style={[styles.titleSuccess, { color: '#EF4444' }]}>⚠️ Goals At Risk Alarm</Text>
          {goals.filter(g => g.alarm).map(g => (
            <Text key={g.id} style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>• {g.alarm}</Text>
          ))}
        </View>
      )}

      <View style={{ padding: 15, gap: 15 }}>
        {goals.map(goal => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          return (
            <View key={goal.id} style={[styles.statsCard, { padding: 15 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>{goal.name}</Text>
                <Text style={{ color: goal.status === 'at_risk' ? '#EF4444' : '#10B981', fontSize: 10, fontWeight: 'bold' }}>
                  {goal.status === 'at_risk' ? 'AT RISK' : 'ON TRACK'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
                <View>
                  <Text style={{ color: '#C4B5FD', fontSize: 8 }}>TARGET</Text>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{goal.target}{goal.unit}</Text>
                </View>
                <View>
                  <Text style={{ color: '#C4B5FD', fontSize: 8 }}>CURRENT</Text>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{goal.current}{goal.unit}</Text>
                </View>
                <View>
                  <Text style={{ color: '#C4B5FD', fontSize: 8 }}>PROJECTED</Text>
                  <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: 'bold' }}>{goal.projected}{goal.unit}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginVertical: 8 }}>
                <View style={{ height: '100%', width: `${pct}%`, backgroundColor: goal.status === 'at_risk' ? '#EF4444' : '#6C2BD9', borderRadius: 3 }} />
              </View>

              {/* Interactive adjusting controls */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                <Text style={{ color: '#C4B5FD', fontSize: 9 }}>Adjust Target:</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={() => handleAdjustTarget(goal.id, -5)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 10 }}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleAdjustTarget(goal.id, 5)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 10 }}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/**
 * Mobile Director P&L Screen Spec (/director/financial-pl)
 * Displays emulated revenues, manual costs offsets and net surplus dials.
 */
export function MobileDirectorPLScreen() {
  const [costs, setCosts] = useState({
    staff: 12.0,
    maintenance: 3.0,
    utilities: 1.5
  });

  const revenues = {
    fees: 43.0,
    canteen: 1.28,
    events: 0.95,
    gym: 0.44,
    hostel: 6.4
  };

  const totalRev = Object.values(revenues).reduce((a, b) => a + b, 0);
  const totalCost = costs.staff + costs.maintenance + costs.utilities;
  const netSurplus = totalRev - totalCost;

  const handleUpdateCost = (key: 'staff' | 'maintenance' | 'utilities', val: string) => {
    const num = parseFloat(val) || 0;
    setCosts(prev => ({ ...prev, [key]: num }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial P&L Spreadsheet</Text>
        <Text style={styles.headerSubtitle}>Real-time Surplus Diagnostics</Text>
      </View>

      {/* Net dial summary */}
      <View style={[styles.walletCard, { marginHorizontal: 15, marginTop: 15, backgroundColor: '#13102A' }]}>
        <Text style={styles.walletCardLabel}>Consolidated Net Surplus</Text>
        <Text style={[styles.walletCardBalance, { color: netSurplus >= 0 ? '#10B981' : '#EF4444' }]}>
          ₹{netSurplus.toFixed(2)}L
        </Text>
        <Text style={{ color: '#C4B5FD', fontSize: 9, marginTop: 4 }}>
          Revenue: ₹{totalRev.toFixed(2)}L • Costs: ₹{totalCost.toFixed(2)}L
        </Text>
      </View>

      {/* Breakdown fields */}
      <View style={{ padding: 15, gap: 15 }}>
        
        {/* Income */}
        <View style={styles.statsCard}>
          <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 5 }}>
            Active Income Streams
          </Text>
          <View style={{ marginTop: 8, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#FFF', fontSize: 11 }}>Completed Fees</Text>
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>₹{revenues.fees.toFixed(2)}L</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#FFF', fontSize: 11 }}>Canteen orders</Text>
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>₹{revenues.canteen.toFixed(2)}L</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#FFF', fontSize: 11 }}>Hostel allocations</Text>
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>₹{revenues.hostel.toFixed(2)}L</Text>
            </View>
          </View>
        </View>

        {/* Expenses entries */}
        <View style={styles.statsCard}>
          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 5 }}>
            Log Expenditures (₹ in Lakhs)
          </Text>
          
          <View style={{ marginTop: 10, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 11 }}>Staff Payroll</Text>
              <TextInput
                keyboardType="numeric"
                value={String(costs.staff)}
                onChangeText={t => handleUpdateCost('staff', t)}
                style={{ backgroundColor: '#0D0A1A', color: '#FFF', paddingHorizontal: 8, paddingVertical: 4, width: 80, borderRadius: 6, textAlign: 'right', fontSize: 11 }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 11 }}>Maintenance</Text>
              <TextInput
                keyboardType="numeric"
                value={String(costs.maintenance)}
                onChangeText={t => handleUpdateCost('maintenance', t)}
                style={{ backgroundColor: '#0D0A1A', color: '#FFF', paddingHorizontal: 8, paddingVertical: 4, width: 80, borderRadius: 6, textAlign: 'right', fontSize: 11 }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 11 }}>Utilities</Text>
              <TextInput
                keyboardType="numeric"
                value={String(costs.utilities)}
                onChangeText={t => handleUpdateCost('utilities', t)}
                style={{ backgroundColor: '#0D0A1A', color: '#FFF', paddingHorizontal: 8, paddingVertical: 4, width: 80, borderRadius: 6, textAlign: 'right', fontSize: 11 }}
              />
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

/**
 * Mobile Director Student Journey Screen Spec (/director/journey)
 * Displays search lists, student engagement tags and quick counselor routing switches.
 */
export function MobileDirectorJourneyScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'disengaged' | 'ambassadors'>('all');
  
  const [students, setStudents] = useState([
    { id: '1', name: 'Rohan Sharma', roll: 'CS23B1042', dept: 'CSE', score: 92, intervention: 'none' },
    { id: '2', name: 'Khushal Gehlot', roll: 'CS23B1024', dept: 'CSE', score: 95, intervention: 'none' },
    { id: '3', name: 'Vikram Aditya', roll: 'EC23B1015', dept: 'ECE', score: 24, intervention: 'none' },
    { id: '4', name: 'Sanjay Meena', roll: 'ME23B1089', dept: 'ME', score: 28, intervention: 'pending' }
  ]);

  const handleIntervention = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        alert(`Guidance counselor route confirmed for ${s.name}`);
        return { ...s, intervention: 'assigned' };
      }
      return s;
    }));
  };

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.toLowerCase().includes(search.toLowerCase());
    if (filter === 'disengaged') return matchSearch && s.score < 50;
    if (filter === 'ambassadors') return matchSearch && s.score >= 85;
    return matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Journey Directory</Text>
        <Text style={styles.headerSubtitle}>Touchpoint Engagement score tracker</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchBarContainer}>
        <TextInput
          placeholder="Search student details..."
          placeholderTextColor="#A78BFA"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8, paddingHorizontal: 15 }}>
        {['all', 'disengaged', 'ambassadors'].map(f => (
          <TouchableOpacity 
            key={f} 
            onPress={() => setFilter(f as any)} 
            style={{ 
              backgroundColor: filter === f ? '#6C2BD9' : 'rgba(255,255,255,0.05)', 
              paddingVertical: 6, 
              paddingHorizontal: 12, 
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(108, 43, 217, 0.15)'
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, textTransform: 'capitalize', fontWeight: 'bold' }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollBody}>
        {filtered.map(student => (
          <View key={student.id} style={styles.dishCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dishName}>{student.name}</Text>
              <Text style={styles.dishDetails}>
                {student.roll} • {student.dept} • Engagement: {student.score}%
              </Text>
              
              {student.score < 50 && (
                <Text style={{ color: '#EF4444', fontSize: 9, marginTop: 4, fontWeight: 'bold' }}>
                  ⚠️ Disengaged risk segment
                </Text>
              )}
            </View>

            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              {student.intervention === 'assigned' ? (
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#10B981' }}>
                  <Text style={{ color: '#10B981', fontSize: 9, fontWeight: 'bold' }}>Assigned</Text>
                </View>
              ) : student.score < 50 ? (
                <TouchableOpacity 
                  onPress={() => handleIntervention(student.id)} 
                  style={{ backgroundColor: '#EF4444', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>Assign Guide</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: '#10B981', fontSize: 16 }}>★</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A1A',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#13102A',
    backgroundColor: '#13102A',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#A78BFA',
    marginTop: 2,
  },
  body: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyCentered: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    flex: 1,
    padding: 15,
  },
  scannerViewport: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  viewfinderBox: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: '#6C2BD9',
    borderRadius: 20,
    backgroundColor: 'rgba(19, 16, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 25,
  },
  laserLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#A78BFA',
    position: 'absolute',
    top: '50%',
  },
  scannerHint: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 150,
  },
  telemetryStrip: {
    backgroundColor: '#13102A',
    borderWidth: 1,
    borderColor: 'rgba(108, 43, 217, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  telemetryText: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#6C2BD9',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnDisabled: {
    backgroundColor: 'rgba(108, 43, 217, 0.4)',
  },
  btnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cardSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  titleSuccess: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 10,
  },
  descSuccess: {
    fontSize: 12,
    color: '#FFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  coordLabel: {
    fontSize: 10,
    color: '#A78BFA',
    marginTop: 12,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  profileStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#13102A',
    marginHorizontal: 15,
    marginVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 43, 217, 0.25)',
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6C2BD9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileRoll: {
    color: '#A78BFA',
    fontSize: 10,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 12,
    marginBottom: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#13102A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 43, 217, 0.15)',
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#A78BFA',
    textTransform: 'uppercase',
  },
  statsPrimaryText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginVertical: 6,
  },
  textAlert: {
    color: '#FBBF24',
  },
  statsSubText: {
    fontSize: 9,
    color: '#A78BFA',
    opacity: 0.6,
  },
  logsSection: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A78BFA',
    marginBottom: 15,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(19, 16, 42, 0.4)',
    padding: 12,
    borderRadius: 12,
  },
  logBullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#6C2BD9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bulletInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
  },
  logContent: {
    flex: 1,
  },
  logTitleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logDescText: {
    color: '#A78BFA',
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
  logTimeText: {
    color: '#A78BFA',
    fontSize: 9,
    opacity: 0.5,
  },

  /* NEW MOBILE CANTEEN STYLES */
  searchBarContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    backgroundColor: '#0D0A1A',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#13102A',
    borderColor: 'rgba(108, 43, 217, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#FFF',
    fontSize: 12,
  },
  vegBtn: {
    backgroundColor: '#13102A',
    borderColor: 'rgba(108, 43, 217, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  vegBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  vegBtnText: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dishCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#13102A',
    borderColor: 'rgba(108, 43, 217, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  dishName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dishDetails: {
    color: '#A78BFA',
    fontSize: 10,
    marginTop: 3,
    opacity: 0.8,
  },
  addDishBtn: {
    backgroundColor: '#6C2BD9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addDishBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footerCartStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6C2BD9',
    padding: 15,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  footerCartText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerCartBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  footerCartBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cartSection: {
    backgroundColor: '#13102A',
    borderRadius: 16,
    borderColor: 'rgba(108, 43, 217, 0.2)',
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },
  cartSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 43, 217, 0.15)',
    paddingBottom: 8,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cartRowText: {
    color: '#C4B5FD',
    fontSize: 12,
  },
  cartRowPrice: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mobileInput: {
    height: 40,
    backgroundColor: '#0D0A1A',
    borderColor: 'rgba(108, 43, 217, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#FFF',
    fontSize: 11,
  },
  summaryBox: {
    backgroundColor: '#0D0A1A',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  summaryText: {
    color: '#A78BFA',
    fontSize: 10,
  },
  summaryTotal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  trackCard: {
    backgroundColor: '#13102A',
    borderRadius: 20,
    borderColor: 'rgba(108, 43, 217, 0.3)',
    borderWidth: 1,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  trackLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#A78BFA',
    textTransform: 'uppercase',
  },
  trackToken: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 10,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    paddingVertical: 4,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dotActive: {
    backgroundColor: '#10B981',
  },
  timelineStep: {
    fontSize: 11,
    color: '#A78BFA',
    opacity: 0.6,
  },
  stepActive: {
    color: '#FFF',
    fontWeight: 'bold',
    opacity: 1,
  },
  bellAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  bellAlertText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  walletCard: {
    backgroundColor: '#6C2BD9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  walletCardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  walletCardBalance: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  quickTopupTitle: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  topupButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  topupBtn: {
    flex: 1,
    backgroundColor: '#13102A',
    borderColor: 'rgba(108, 43, 217, 0.25)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  topupBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#FBBF24',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 15,
  },
  mobileTxContainer: {
    backgroundColor: '#13102A',
    borderRadius: 16,
    borderColor: 'rgba(108, 43, 217, 0.15)',
    borderWidth: 1,
    padding: 10,
  },
  mobileTxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  txDesc: {
    color: '#FFF',
    fontSize: 11,
  },
  txAmt: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  txCredit: {
    color: '#10B981',
  },
  txDebit: {
    color: '#EF4444',
  },
  horizontalScroll: {
    paddingHorizontal: 15,
  },
  dateCard: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#13102A',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(108, 43, 217, 0.2)',
    justifyContent: 'center',
    height: 35,
  },
  dateCardActive: {
    backgroundColor: '#6C2BD9',
    borderColor: '#8B5CF6',
  },
  dateCardText: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateCardTextActive: {
    color: '#FFF',
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#13102A',
    borderColor: 'rgba(108, 43, 217, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  slotCardActive: {
    borderColor: '#6C2BD9',
    backgroundColor: 'rgba(108, 43, 217, 0.15)',
  },
  slotCapacity: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketCard: {
    backgroundColor: '#13102A',
    borderRadius: 20,
    borderColor: 'rgba(108, 43, 217, 0.25)',
    borderWidth: 1,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  ticketDashedLine: {
    width: '100%',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginVertical: 15,
  },
  qrCodeContainer: {
    padding: 15,
    backgroundColor: '#0D0A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 43, 217, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeImagePlaceholder: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  progressBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  progressBar: {
    width: 24,
    backgroundColor: '#6C2BD9',
    borderRadius: 4,
  },
  progressBarLabel: {
    color: '#A78BFA',
    fontSize: 9,
    marginTop: 6,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 15,
  },
  emojiBtn: {
    flex: 1,
    backgroundColor: '#0D0A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  emojiBtnActive: {
    borderColor: '#6C2BD9',
    backgroundColor: 'rgba(108, 43, 217, 0.15)',
  },
  emojiText: {
    fontSize: 20,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D0A1A',
    borderColor: 'rgba(108, 43, 217, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
    marginTop: 6,
    marginBottom: 12,
  },
  stepperBtn: {
    backgroundColor: '#13102A',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  counselorAlertBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    width: '100%',
  },
  videoPlayer: {
    backgroundColor: '#000',
    borderColor: 'rgba(108, 43, 217, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1.6,
  },
  videoPlaceholderText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  playProgressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 20,
  },
  playProgressFill: {
    width: '35%',
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
});

// ============================================================
// MODULE 10: AI CONCIERGE MOBILE SCREENS
// ============================================================

/**
 * Mobile Voice Assistant Screen
 * Web Speech API + TTS playback for voice-driven AI interactions
 */
export function MobileVoiceAssistantScreen() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [messages, setMessages] = useState<{ type: 'user' | 'bot'; text: string }[]>([]);

  const mockRespond = (query: string) => {
    const lower = query.toLowerCase();
    if (lower.includes('attendance')) return language === 'hi' ? 'आपकी attendance 84% है। Keep it above 75%!' : 'Your attendance is 84%. Keep it above 75%!';
    if (lower.includes('fee') || lower.includes('फीस')) return language === 'hi' ? 'आपकी pending fees ₹2,500 है।' : 'Your pending fees are ₹2,500.';
    if (lower.includes('class') || lower.includes('क्लास')) return language === 'hi' ? 'आज Maths 9 AM और Physics 11 AM है।' : 'Today: Maths at 9 AM, Physics at 11 AM.';
    return language === 'hi' ? 'मैं IRIS हूँ। अटेंडेंस, फीस, टाइमटेबल पूछें।' : 'I\'m IRIS. Ask about attendance, fees, or timetable.';
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      if (transcript) {
        const reply = mockRespond(transcript);
        setMessages(prev => [...prev, { type: 'user', text: transcript }, { type: 'bot', text: reply }]);
        setResponse(reply);
        setTranscript('');
      }
    } else {
      setIsListening(true);
      setTranscript('');
      setTimeout(() => {
        setTranscript(language === 'hi' ? 'मेरी अटेंडेंस बताओ' : 'What is my attendance?');
      }, 2000);
    }
  };

  return (
    <ScrollView style={voiceStyles.container}>
      <Text style={voiceStyles.title}>🎙️ Voice Assistant</Text>
      <Text style={voiceStyles.subtitle}>Speak in {language === 'hi' ? 'हिंदी' : 'English'}</Text>

      <TouchableOpacity style={voiceStyles.langToggle} onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}>
        <Text style={voiceStyles.langToggleText}>{language === 'hi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}</Text>
      </TouchableOpacity>

      <View style={voiceStyles.chatArea}>
        {messages.length === 0 && (
          <Text style={voiceStyles.emptyText}>{language === 'hi' ? 'माइक दबाएं और बोलें' : 'Tap the mic and speak'}</Text>
        )}
        {messages.map((msg, i) => (
          <View key={i} style={[voiceStyles.msgBubble, msg.type === 'user' ? voiceStyles.userBubble : voiceStyles.botBubble]}>
            <Text style={voiceStyles.msgLabel}>{msg.type === 'user' ? '🎤 You' : '🤖 IRIS'}</Text>
            <Text style={voiceStyles.msgText}>{msg.text}</Text>
          </View>
        ))}
      </View>

      {isListening && (
        <View style={voiceStyles.waveContainer}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={[voiceStyles.waveBar, { height: Math.max(8, Math.random() * 40) }]} />
          ))}
        </View>
      )}

      {transcript ? <Text style={voiceStyles.liveTranscript}>"{transcript}"</Text> : null}

      <TouchableOpacity style={[voiceStyles.micButton, isListening && voiceStyles.micButtonActive]} onPress={toggleListen}>
        <Text style={voiceStyles.micIcon}>{isListening ? '⏹️' : '🎤'}</Text>
      </TouchableOpacity>
      <Text style={voiceStyles.micHint}>{isListening ? 'Listening...' : 'Tap to speak'}</Text>
    </ScrollView>
  );
}

const voiceStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1A', padding: 20 },
  title: { color: '#E0E7FF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#9CA3AF', fontSize: 13, marginBottom: 16 },
  langToggle: { alignSelf: 'flex-end', backgroundColor: 'rgba(108,43,217,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(108,43,217,0.4)', marginBottom: 16 },
  langToggleText: { color: '#C4B5FD', fontSize: 12, fontWeight: '600' },
  chatArea: { backgroundColor: 'rgba(19,16,42,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(108,43,217,0.2)', padding: 16, minHeight: 250, marginBottom: 16 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 80, fontSize: 14 },
  msgBubble: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '80%' as any },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'rgba(108,43,217,0.3)', borderWidth: 1, borderColor: 'rgba(108,43,217,0.5)' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(30,25,55,0.8)', borderWidth: 1, borderColor: 'rgba(55,48,80,0.6)' },
  msgLabel: { color: '#9CA3AF', fontSize: 10, marginBottom: 4 },
  msgText: { color: '#E0E7FF', fontSize: 13, lineHeight: 20 },
  waveContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2, height: 50, marginBottom: 12 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: '#6C2BD9' },
  liveTranscript: { color: '#E0E7FF', fontSize: 14, fontStyle: 'italic', textAlign: 'center', backgroundColor: 'rgba(108,43,217,0.1)', padding: 10, borderRadius: 8, marginBottom: 16 },
  micButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#6C2BD9', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  micButtonActive: { backgroundColor: '#EF4444' },
  micIcon: { fontSize: 28 },
  micHint: { color: '#6B7280', textAlign: 'center', fontSize: 12 },
});

/**
 * Mobile Study Plan Screen
 * Displays AI-generated daily study schedule with color-coded blocks
 */
export function MobileStudyPlanScreen() {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [completion, setCompletion] = useState(35);

  const days = ['Monday', 'Tuesday', 'Wednesday'];
  const dayEmojis: Record<string, string> = { Monday: '🌅', Tuesday: '🔥', Wednesday: '⚡' };

  const schedule: Record<string, { time: string; subject: string; topic: string; type: string }[]> = {
    Monday: [
      { time: '06:00-08:00', subject: 'Mathematics', topic: 'Linear Algebra - Eigenvalues', type: 'focus' },
      { time: '09:00-10:30', subject: 'Physics', topic: 'Thermodynamics revision', type: 'review' },
      { time: '16:00-17:30', subject: 'Data Structures', topic: 'Binary Trees Practice', type: 'practice' },
    ],
    Tuesday: [
      { time: '06:00-08:00', subject: 'Data Structures', topic: 'Graph Algorithms - DFS/BFS', type: 'focus' },
      { time: '09:00-10:30', subject: 'Mathematics', topic: 'Calculus - Integration', type: 'review' },
      { time: '16:00-17:30', subject: 'English', topic: 'Technical Writing', type: 'light' },
    ],
    Wednesday: [
      { time: '06:00-08:00', subject: 'Physics', topic: 'Optics & Waves', type: 'focus' },
      { time: '16:00-18:00', subject: 'Mathematics', topic: 'Practice Problems Set', type: 'practice' },
    ],
  };

  const typeColors: Record<string, string> = {
    focus: '#6C2BD9', review: '#3B82F6', practice: '#10B981', light: '#F59E0B'
  };

  const exams = [
    { subject: 'Mathematics', date: 'Jun 25', days: 15 },
    { subject: 'Physics', date: 'Jun 27', days: 17 },
    { subject: 'Data Structures', date: 'Jun 30', days: 20 },
  ];

  return (
    <ScrollView style={studyStyles.container}>
      <Text style={studyStyles.title}>📖 Study Plan</Text>
      <Text style={studyStyles.subtitle}>AI-generated personalized schedule</Text>

      {/* Progress */}
      <View style={studyStyles.progressCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={studyStyles.progressLabel}>Study Progress</Text>
          <Text style={studyStyles.progressValue}>{completion}%</Text>
        </View>
        <View style={studyStyles.progressTrack}>
          <View style={[studyStyles.progressFill, { width: `${completion}%` as any }]} />
        </View>
      </View>

      {/* Exam Countdown */}
      <Text style={studyStyles.sectionTitle}>📅 Exam Countdown</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {exams.map((exam, i) => (
          <View key={i} style={[studyStyles.examCard, { borderColor: exam.days <= 7 ? 'rgba(239,68,68,0.4)' : 'rgba(108,43,217,0.3)' }]}>
            <Text style={studyStyles.examSubject}>{exam.subject}</Text>
            <Text style={studyStyles.examDate}>{exam.date}</Text>
            <Text style={[studyStyles.examDays, { color: exam.days <= 7 ? '#EF4444' : '#10B981' }]}>{exam.days}d left</Text>
          </View>
        ))}
      </ScrollView>

      {/* Day Selector */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {days.map(day => (
          <TouchableOpacity key={day} onPress={() => setSelectedDay(day)}
            style={[studyStyles.dayTab, selectedDay === day && studyStyles.dayTabActive]}>
            <Text style={[studyStyles.dayTabText, selectedDay === day && studyStyles.dayTabTextActive]}>
              {dayEmojis[day]} {day.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Schedule Blocks */}
      {(schedule[selectedDay] || []).map((block, i) => (
        <View key={i} style={[studyStyles.blockCard, { borderLeftColor: typeColors[block.type] || '#6B7280' }]}>
          <Text style={[studyStyles.blockTime, { color: typeColors[block.type] || '#6B7280' }]}>{block.time}</Text>
          <Text style={studyStyles.blockSubject}>{block.subject}</Text>
          <Text style={studyStyles.blockTopic}>{block.topic}</Text>
          <View style={[studyStyles.blockBadge, { backgroundColor: `${typeColors[block.type]}20`, borderColor: `${typeColors[block.type]}50` }]}>
            <Text style={[studyStyles.blockBadgeText, { color: typeColors[block.type] }]}>{block.type.toUpperCase()}</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const studyStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1A', padding: 20 },
  title: { color: '#E0E7FF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#9CA3AF', fontSize: 13, marginBottom: 16 },
  progressCard: { backgroundColor: 'rgba(19,16,42,0.8)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(108,43,217,0.3)', padding: 16, marginBottom: 16 },
  progressLabel: { color: '#C4B5FD', fontSize: 13, fontWeight: '600' },
  progressValue: { color: '#10B981', fontSize: 13, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(30,25,55,0.8)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#6C2BD9' },
  sectionTitle: { color: '#C4B5FD', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  examCard: { backgroundColor: 'rgba(19,16,42,0.7)', borderRadius: 12, borderWidth: 1, padding: 12, marginRight: 10, minWidth: 130, alignItems: 'center' },
  examSubject: { color: '#E0E7FF', fontSize: 13, fontWeight: '600' },
  examDate: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },
  examDays: { fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  dayTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(19,16,42,0.5)', borderWidth: 1, borderColor: 'rgba(55,48,80,0.3)' },
  dayTabActive: { backgroundColor: 'rgba(108,43,217,0.3)', borderColor: 'rgba(108,43,217,0.5)' },
  dayTabText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  dayTabTextActive: { color: '#C4B5FD' },
  blockCard: { backgroundColor: 'rgba(19,16,42,0.6)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(55,48,80,0.3)', borderLeftWidth: 4, padding: 14, marginBottom: 10 },
  blockTime: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', marginBottom: 4 },
  blockSubject: { color: '#E0E7FF', fontSize: 14, fontWeight: '600' },
  blockTopic: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  blockBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  blockBadgeText: { fontSize: 9, fontWeight: '700' },
});

/**
 * Mobile Nudges Screen
 * Inbox of proactive AI nudge notifications with read/action controls
 */
export function MobileNudgesScreen() {
  const [nudges] = useState([
    { id: '1', type: 'weekly_prep', title: '📚 Week Ahead Prep', message: 'You have 5 classes tomorrow. Physics assignment due Wednesday.', priority: 'normal', read: false, actioned: false },
    { id: '2', type: 'attendance_warning', title: '⚠️ Attendance Alert', message: 'Data Structures attendance dropped to 68%. Attend next 4 classes.', priority: 'high', read: true, actioned: false },
    { id: '3', type: 'fee_reminder', title: '💰 Fee Reminder', message: '₹12,500 installment due in 3 days. Pay now to avoid late charges.', priority: 'urgent', read: false, actioned: false },
    { id: '4', type: 'exam_countdown', title: '📝 Exam Countdown', message: 'Mid-semesters begin in 12 days! Focus on Linear Algebra this week.', priority: 'high', read: true, actioned: true },
    { id: '5', type: 'streak_celebration', title: '🔥 7-Day Streak!', message: 'Attended every class for 7 days! You\'re in the top 15% of your batch!', priority: 'low', read: true, actioned: true },
    { id: '6', type: 'library_due', title: '📖 Library Book Due', message: '"Introduction to Algorithms" is due in 2 days. Renew at /student/library.', priority: 'normal', read: false, actioned: false },
  ]);

  const priorityColors: Record<string, string> = {
    low: '#6B7280', normal: '#3B82F6', high: '#F59E0B', urgent: '#EF4444'
  };

  const unread = nudges.filter(n => !n.read).length;
  const actioned = nudges.filter(n => n.actioned).length;

  return (
    <ScrollView style={nudgeStyles.container}>
      <Text style={nudgeStyles.title}>🔔 Smart Nudges</Text>
      <Text style={nudgeStyles.subtitle}>AI-powered proactive notifications</Text>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <View style={nudgeStyles.statCard}>
          <Text style={nudgeStyles.statValue}>{nudges.length}</Text>
          <Text style={nudgeStyles.statLabel}>Total</Text>
        </View>
        <View style={nudgeStyles.statCard}>
          <Text style={[nudgeStyles.statValue, { color: '#F59E0B' }]}>{unread}</Text>
          <Text style={nudgeStyles.statLabel}>Unread</Text>
        </View>
        <View style={nudgeStyles.statCard}>
          <Text style={[nudgeStyles.statValue, { color: '#10B981' }]}>{actioned}</Text>
          <Text style={nudgeStyles.statLabel}>Done</Text>
        </View>
      </View>

      {/* Nudge Cards */}
      {nudges.map(nudge => (
        <View key={nudge.id} style={[nudgeStyles.nudgeCard, { opacity: nudge.actioned ? 0.6 : 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={nudgeStyles.nudgeTitle}>
              {nudge.title}
              {!nudge.read && <Text style={{ color: '#6C2BD9' }}> ●</Text>}
            </Text>
            <View style={[nudgeStyles.priorityBadge, { borderColor: `${priorityColors[nudge.priority]}50`, backgroundColor: `${priorityColors[nudge.priority]}15` }]}>
              <Text style={[nudgeStyles.priorityText, { color: priorityColors[nudge.priority] }]}>{nudge.priority}</Text>
            </View>
          </View>
          <Text style={nudgeStyles.nudgeMessage}>{nudge.message}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {!nudge.read && (
              <TouchableOpacity style={nudgeStyles.actionBtn}>
                <Text style={nudgeStyles.actionText}>Mark Read</Text>
              </TouchableOpacity>
            )}
            {!nudge.actioned && (
              <TouchableOpacity style={[nudgeStyles.actionBtn, { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <Text style={[nudgeStyles.actionText, { color: '#10B981' }]}>✅ Done</Text>
              </TouchableOpacity>
            )}
            {nudge.actioned && <Text style={{ color: '#10B981', fontSize: 11 }}>✅ Completed</Text>}
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const nudgeStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1A', padding: 20 },
  title: { color: '#E0E7FF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#9CA3AF', fontSize: 13, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(19,16,42,0.8)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(108,43,217,0.3)', padding: 12, alignItems: 'center' },
  statValue: { color: '#6C2BD9', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#6B7280', fontSize: 10, marginTop: 2 },
  nudgeCard: { backgroundColor: 'rgba(19,16,42,0.8)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(108,43,217,0.3)', padding: 14, marginBottom: 10 },
  nudgeTitle: { color: '#E0E7FF', fontSize: 14, fontWeight: '600', flex: 1 },
  nudgeMessage: { color: '#9CA3AF', fontSize: 12, lineHeight: 18 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  priorityText: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(108,43,217,0.3)', backgroundColor: 'rgba(108,43,217,0.1)' },
  actionText: { color: '#C4B5FD', fontSize: 11 },
});

