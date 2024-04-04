import { ServiceMaintenances } from '/imports/api/collections/serviceMaintenances';

// MT 04.04.2024
// Diese Funktion wurde im Produktvsystem einmal ausgeführt und wird deshalb nicht mehr benötigt.
return;

console.log( 'start insert initial ServiceMaintenances dataset' );
ServiceMaintenances.remove({});
ServiceMaintenances.insert({
    _id: '_initialDataset',
    dateStart: new Date('2024-03-20T08:52:15.244Z'),//ISODate('2024-03-20T08:52:15.244Z'),
    plannedServiceTime: '13:00 bis 17:30 Uhr',
    active: false
});

console.log( 'done insert initial ServiceMaintenances dataset' );