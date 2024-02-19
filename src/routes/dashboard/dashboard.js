
import express from 'express';
import conn from '../../methods/db/db.js';
import {getYearToDateDays} from '../../methods/dashboard/yearToDate.js';


const dashboard = express.Router();
dashboard.get('/yearlyabsencebyday', async (req, res) => {
    const dataset = [];
    const {yearToDateDays, dateArray} = getYearToDateDays();
    const query = await conn.promise().query('SELECT ( SELECT Date FROM Seance WHERE ID_seance = Seance ) AS date from Absence;')
    console.log(query);
    for (let i = 0; i < yearToDateDays.length; i++) {
        let count = 0;
        for (let j = 0; j < query[0].length; j++) {
            let date = new Date(query[0][j].date);
            date = date.getTime()// + 2*86400*1000;
            date = new Date(date);
            date = date.toISOString().split('T')[0];
            if (yearToDateDays[i] === date) {
                count++;
            }
        }
        dataset[i] = count;
        //dataset.push(Math.floor(Math.random() * 15) + 0);
    }
    res.status(200).send({
        data : dateArray,
        dataset : dataset
    });
});

export default dashboard;