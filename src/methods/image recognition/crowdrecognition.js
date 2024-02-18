import axios from "axios";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

let images = [];
let average =13;

for (let i = 1; i <= 5; i++) {
    images.push(fs.readFileSync('public/'+i+'.jpg', {
        encoding: "base64"
    }));
}


for (let i = 0; i < 5; i++) {
    await axios({
        method: "POST",
        url: process.env.CROWD_RECOGNITION_URL,
        params: {
            api_key: process.env.CROWD_RECOGNITION_AI_API_KEY,
            confidence : 2,
            overlap: 90
        },
        data: images[i],
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
    .then(function(response) {
        console.log(response.data);
        average += response.data.predictions.length||average/i+1;
    })
    .catch(function(error) {
        console.log(error.message);
    });
}

average = average / 5;
console.log("Average count: ", average);