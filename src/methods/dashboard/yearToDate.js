function getYearToDateDays() {
  const currentDate = Date.now();
  let start = currentDate-86400*1000*365;

  const yearToDateDays = [];
  const dateArray = [];
  for (let i=0; i<= 365 ; i++) {
    start = i==0?start:start+86400*1000;
    const date = new Date(start);
    yearToDateDays.push(date.toISOString().split('T')[0]);

    let month = date.getMonth();
    switch (month) {
      case 0:
        month= "Jan";
        break;
      case 1:
        month = "Feb";
        break;
      case 2:
        month = "Mar";
        break;
      case 3:
        month = "Apr";
        break;
      case 4:
        month = "May";
        break;
      case 5:
        month = "Jun";
        break;
      case 6:
        month = "Jul";
        break;
      case 7:
        month = "Aug";
        break;
      case 8:
        month = "Sep";
        break;
      case 9:
        month = "Oct";
        break;
      case 10:
        month = "Nov";
        break;
      case 11:
        month = "Dec";
        break;
    }
    dateArray.push(date.getDate() + " " + month);

  }

  return {yearToDateDays, dateArray};
}

const {yearToDateDays, dateArray} = getYearToDateDays();
// console.log(yearToDateDays);
console.log(new Date(yearToDateDays[0]).getDate());
// console.log(dateArray);
