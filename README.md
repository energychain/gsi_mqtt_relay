# gsi_mqtt_relay
MQTT publisher relay for Corrently GrünstromIndex.

Relay, der es erlaubt den aktuellen GrünstromIndex Wert via MQTT an einen lokalen Broker/Server zu veröffentlichen.

## Installation

### via Package Manager npm
```
npm -g -i gsi_mqtt_relay
```

## Usage
```
gsi-mqtt -h <mqtt-url> [-p ZIPCODE] [-d] [-q]
```

You will receive messages for topics:
| Topic | Message |
|---|---|
| gsi_json_ZIPCODE | JSON Object |
| gsi_ZIPCODE | Integer |
| gsi | Integer |
| gsi_all | JSON Object |

## Referenzen
- https://www.corrently.de/hintergrund/gruenstromindex/index.html
