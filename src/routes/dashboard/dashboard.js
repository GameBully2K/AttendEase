import express from 'express';
import conn from '../../methods/db/db.js';
import { getYearToDateDays } from '../../methods/dashboard/yearToDate.js';
import { app } from '../../methods/communication/api.express.js';
import io from '../../methods/communication/socket.io.js';

const dashboard = express.Router();

function gaussianRandom(mean = 0, stdev = 1) {
    let u = 1 - Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
}

dashboard.get('/yearlyabsencebyday', async (req, res) => {
    console.log('calling yearlyabsencebyday...');
    const dataset = [];
    const { yearToDateDays, dateArray } = getYearToDateDays();
    const query = await conn.promise().query('SELECT (SELECT Date FROM Seance WHERE ID_seance = Seance) AS date from Absence;');

    // Define holiday dates (example: Jan 1st, July 4th, Dec 25th)
    const holidays = ["2024-01-01", "2024-07-04", "2024-12-25"];

    for (let i = 0; i < yearToDateDays.length; i++) {
        let t = i + 1;

        // Weekend effect (sinusoidal function)
        let weekendEffect = 0.2 * Math.sin((2 * Math.PI * t) / 7);

        // Holiday effect
        let holidayEffect = holidays.includes(yearToDateDays[i]) ? 0.4 : 0;

        // Vacation effect (Gaussian function centered around day 210)
        let vacationEffect = 0.6 * Math.exp(-Math.pow(t - 210, 2) / (2 * 30 * 30));

        // Random noise effect
        let randomEffect = 0.1 * gaussianRandom();

        // Total absence rate
        let absenceRate = weekendEffect + holidayEffect + vacationEffect + randomEffect +1;

        dataset.push(absenceRate);
    }

    res.status(200).send({
        data: dateArray,
        dataset: dataset
    });
    console.log('yearlyabsencebyday called: status ok ✅');
});

io.on('yearlyabsencebyday', async () => {
    console.log('yearlyabsencebyday event called');
    const dataset = [];
    const { yearToDateDays, dateArray } = getYearToDateDays();
    const query = await conn.promise().query('SELECT (SELECT Date FROM Seance WHERE ID_seance = Seance) AS date from Absence;');

    // Define holiday dates (example: Jan 1st, July 4th, Dec 25th)
    const holidays = ["2024-01-01", "2024-07-04", "2024-12-25"];

    for (let i = 0; i < yearToDateDays.length; i++) {
        let t = i + 1;

        // Weekend effect (sinusoidal function)
        let weekendEffect = 0.2 * Math.sin((2 * Math.PI * t) / 7);

        // Holiday effect
        let holidayEffect = holidays.includes(yearToDateDays[i]) ? 0.4 : 0;

        // Vacation effect (Gaussian function centered around day 210)
        let vacationEffect = 0.6 * Math.exp(-Math.pow(t - 210, 2) / (2 * 30 * 30));

        // Random noise effect
        let randomEffect = 0.1 * gaussianRandom();

        // Total absence rate
        let absenceRate = weekendEffect + holidayEffect + vacationEffect + randomEffect;

        dataset.push(absenceRate);
    }

    io.emit('yearlyabsencebyday', {
        rdata: dateArray,
        rdataset: dataset
    });
});

export default dashboard;




// import express from 'express';
// import conn from '../../methods/db/db.js';
// import {getYearToDateDays} from '../../methods/dashboard/yearToDate.js';
// import { app } from '../../methods/communication/api.express.js';
// import io from '../../methods/communication/socket.io.js';

// const dashboard = express.Router();

// dashboard.get('/yearlyabsencebyday', async (req, res) => {
//     console.log('calling yearlyabsencebyday...');
//     const dataset = [];
//     const {yearToDateDays, dateArray} = getYearToDateDays();
//     const query = await conn.promise().query('SELECT ( SELECT Date FROM Seance WHERE ID_seance = Seance ) AS date from Absence;')
//     for (let i = 0; i < yearToDateDays.length; i++) {
//         // let count = 0;
//         // for (let j = 0; j < query[0].length; j++) {
//         //     let date = new Date(query[0][j].date);
//         //     date = date.getTime()// + 2*86400*1000;
//         //     date = new Date(date);
//         //     date = date.toISOString().split('T')[0];
//         //     if (yearToDateDays[i] === date) {
//         //         count++;
//         //     }
//         // }
//         // dataset[i] = count;
//         dataset.push(Math.sin(i*(Math.PI/70))+5);
//     }
//     res.status(200).send({
//         data : dateArray,
//         dataset : dataset
//     });
//     console.log('yearlyabsencebyday called: status ok ✅');
// });

// io.on('yearlyabsencebyday', async () => {
//     console.log('yearlyabsencebyday event called');
//     const dataset = [];
//     const {yearToDateDays, dateArray} = getYearToDateDays();
//     const query = await conn.promise().query('SELECT ( SELECT Date FROM Seance WHERE ID_seance = Seance ) AS date from Absence;')
//     for (let i = 0; i < yearToDateDays.length; i++) {
//         let count = 0;
//         for (let j = 0; j < query[0].length; j++) {
//             let date = new Date(query[0][j].date);
//             date = date.getTime()// + 2*86400*1000;
//             date = new Date(date);
//             date = date.toISOString().split('T')[0];
//             if (yearToDateDays[i] === date) {
//                 count++;
//             }
//         }
//         dataset[i] = count;
//         //dataset.push(Math.floor(Math.random() * 15) + 3);
//     }
//     socket.emit('yearlyabsencebyday', {
//         rdata : dateArray,
//         rdataset : dataset
//     });
// });

// export default dashboard;