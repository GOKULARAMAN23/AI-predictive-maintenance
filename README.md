# AI PREDICTIVE SYSTEM

## AI-Powered Motor Health Monitoring & Predictive Maintenance System

> **Give Your Machines a Voice. Before They Fail.**

MACHINE DNA™ is a smart motor health monitoring and predictive maintenance prototype designed to continuously monitor the operating condition of industrial motors.

The system collects multiple machine parameters such as **temperature, vibration, and electrical current**, processes the data, evaluates the motor's condition, and provides an early warning when abnormal behavior is detected.

---

## Problem Statement

Industrial motors are critical components in manufacturing plants, pumps, conveyors, compressors, fans, and other machinery.

A motor failure can result in:

- Unplanned production downtime
- High maintenance costs
- Equipment damage
- Production delays
- Reduced machine availability
- Potential safety risks

Traditional maintenance approaches often depend on scheduled maintenance or reacting after a failure occurs.

### Our Goal

Instead of waiting for a motor to fail, MACHINE DNA aims to continuously monitor the machine and identify abnormal operating conditions at an early stage.

---

# Our Solution

MACHINE DNA combines multiple sensors with a processing system to understand the health of a motor.

### Parameters monitored

| Parameter | Sensor | Purpose |
|---|---|---|
| Temperature | DS18B20 | Detect overheating and abnormal thermal conditions |
| Vibration | MPU6050 | Detect abnormal mechanical vibration |
| Current | ACS712 | Monitor electrical load/current behavior |

The collected sensor data is processed by an **Arduino UNO** and converted into an understandable motor health status.

---

# System Architecture

```text
                  DC MOTOR
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   MPU6050        DS18B20      ACS712
  Vibration     Temperature     Current
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
                ARDUINO UNO
                     │
                     ▼
             DATA PROCESSING
                     │
                     ▼
             HEALTH ASSESSMENT
                     │
              ┌──────┼──────┐
              │      │      │
              ▼      ▼      ▼
            GREEN  YELLOW   RED
            NORMAL WARNING CRITICAL
                     │
                     ▼
             SERIAL / DASHBOARD
