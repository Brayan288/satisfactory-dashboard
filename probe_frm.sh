#!/bin/bash
for ep in getMercer getMercerShrine getCrashSite getDropPod getBerry getNut getMushroom getFlower getSpore getWreck getHardDrive getSchematic getSuncatcher; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 "http://localhost:8080/$ep")
  size=$(curl -s -m 20 "http://localhost:8080/$ep" | wc -c)
  echo "$ep -> HTTP $code, bytes=$size"
done
