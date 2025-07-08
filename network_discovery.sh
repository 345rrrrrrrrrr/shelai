#!/bin/bash
# Network Discovery Script
echo "=== Network Information ===" > network_scan.txt
echo "Date: $(date)" >> network_scan.txt
echo "Hostname: $(hostname)" >> network_scan.txt
echo "User: $(whoami)" >> network_scan.txt
echo "" >> network_scan.txt

echo "=== Network Interfaces ===" >> network_scan.txt
ip addr show 2>/dev/null || ifconfig 2>/dev/null || echo "No network tools available" >> network_scan.txt
echo "" >> network_scan.txt

echo "=== Process Information ===" >> network_scan.txt
ps aux | head -20 >> network_scan.txt
echo "" >> network_scan.txt

echo "=== Environment Variables ===" >> network_scan.txt
env | grep -E "(HOME|USER|PATH)" >> network_scan.txt

echo "Network scan completed at $(date)" >> network_scan.txt

