// Base Smart Home Provider Abstract Interface
// All providers (Demo, Google Home, Matter, ApiDevice) inherit and implement these methods

export class SmartHomeProvider {
  constructor(id, name, type) {
    if (this.constructor === SmartHomeProvider) {
      throw new Error('SmartHomeProvider is an abstract class and cannot be instantiated directly.');
    }
    this.id = id;
    this.name = name;
    this.type = type; // 'demo' | 'google_home' | 'matter' | 'device_api'
  }

  getProviderId() {
    return this.id;
  }

  getProviderName() {
    return this.name;
  }

  /**
   * Returns current provider state: 'not_configured' | 'ready' | 'connected' | 'demo'
   */
  async getStatus() {
    throw new Error('getStatus() must be implemented by subclass');
  }

  /**
   * Fetches all registered or available devices normalized to CommonDevice
   */
  async getDevices() {
    throw new Error('getDevices() must be implemented by subclass');
  }

  /**
   * Fetches state for a specific device
   */
  async getDeviceState(deviceId) {
    throw new Error('getDeviceState() must be implemented by subclass');
  }

  /**
   * Fetches telemetry for a specific device
   */
  async getEnergyTelemetry(deviceId) {
    throw new Error('getEnergyTelemetry() must be implemented by subclass');
  }

  /**
   * Turns a device ON or OFF
   */
  async setPower(deviceId, state) {
    throw new Error('setPower() must be implemented by subclass');
  }

  /**
   * Sets temperature setpoint
   */
  async setTemperature(deviceId, temperature) {
    throw new Error('setTemperature() must be implemented by subclass');
  }

  /**
   * Sets light brightness (0-100)
   */
  async setBrightness(deviceId, brightness) {
    throw new Error('setBrightness() must be implemented by subclass');
  }

  /**
   * Sets fan speed (1-5)
   */
  async setFanSpeed(deviceId, speed) {
    throw new Error('setFanSpeed() must be implemented by subclass');
  }

  /**
   * Scans and discovers devices available through this provider
   */
  async scanDevices() {
    throw new Error('scanDevices() must be implemented by subclass');
  }
}
