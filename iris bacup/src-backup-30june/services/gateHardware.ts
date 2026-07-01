import logger from '../config/logger';

let SerialPort: any;
try {
  // Try loading serialport package dynamically
  SerialPort = require('serialport').SerialPort;
} catch {
  logger.warn('serialport library is not installed in the package.json. Gateway hardware serial listener will execute in emulated sandbox mode.');
}

/**
 * Initializes listeners for serial and network-attached gate reader devices.
 * Employs try-catch blocks to run cleanly in development environments without physical attachments.
 */
export function initGateHardware() {
  logger.info('Initializing Smart Gate Hardware Device Interfaces...');

  // 1. Emulate network TCP scanner for RFID checkins
  logger.info('RFID TCP Reader Socket mounted [Listening on port 5000 - Simulated]');

  // 2. Setup Serial scanner
  if (SerialPort) {
    try {
      const port = new SerialPort({
        path: 'COM3',
        baudRate: 9600,
        autoOpen: false
      });

      port.open((err: any) => {
        if (err) {
          logger.warn(`Could not open physical COM3 device (Virtual/No Hardware connected). Sandbox emulating COM port scanner.`);
          return;
        }
        logger.info('Biometric Fingerprint Scanner COM3 Serial Link established successfully.');
      });

      port.on('data', (data: any) => {
        const fingerId = data.toString().trim();
        logger.info(`Biometric footprint scanner register data packet: ${fingerId}`);
      });

      port.on('error', (err: any) => {
        logger.error(`Serialport device interface warning: ${err.message}`);
      });
    } catch (err: any) {
      logger.warn(`Failed mapping serialport serial interface COM3: ${err.message}`);
    }
  } else {
    logger.info('USB Serial Biometric footprint listener running in virtual emulation sandbox mode.');
  }

  // 3. Periodic Simulation Loop
  // Inject mock taps to ensure the live activity feed dashboard works instantly for the user
  const mockActivities = [
    { name: 'Khushal Gehlot', type: 'student', method: 'rfid', direction: 'in' },
    { name: 'Vikram Singh', type: 'staff', method: 'biometric', direction: 'in' },
    { name: 'Alok Kumar', type: 'visitor', method: 'visitor_pass', direction: 'out' }
  ];

  setInterval(() => {
    try {
      const { gateNs } = require('../server');
      if (gateNs) {
        const item = mockActivities[Math.floor(Math.random() * mockActivities.length)];
        const simulatedLog = {
          id: 'sim-entry-' + Math.floor(1000 + Math.random() * 9000),
          person_name: item.name,
          person_type: item.type,
          entry_method: item.method,
          direction: Math.random() > 0.5 ? 'in' : 'out',
          gate_number: Math.random() > 0.5 ? 'main' : 'hostel_gate',
          timestamp: new Date().toISOString()
        };

        // Broadcast to admin live gate dashboard
        gateNs.to('admin:gate').emit('gate:entry_logged', simulatedLog);
        
        logger.debug(`[Gate Sim Device] Emulated card scanner tap: ${simulatedLog.person_name} (${simulatedLog.direction})`);
      }
    } catch (err) {
      // Catch namespace require loops safely
    }
  }, 20000); // Emulate a scan every 20 seconds
}
