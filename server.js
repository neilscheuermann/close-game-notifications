const axios = require('axios');
const cron = require('node-cron');
const secrets = require('./secrets');
const twilio = require('twilio');
const {
  SPORTS_FEEDS_API_KEY,
  SPORTS_FEEDS_PASSWORD,
  MY_NUMBER,
  TWILIO_NUMBER,
} = secrets;
const createMessagesForLiveGames = require('./utilityFunctions');

const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const mySportsFeedsEncryption = Buffer.from(
  SPORTS_FEEDS_API_KEY + ':' + SPORTS_FEEDS_PASSWORD
).toString('base64');

/*
played status is either UNPLAYED, LIVE, COMPLETED_PENDING_REVIEW, or COMLETED
*/

const todaysGames = async date => {
  try {
    // Pulls a JSON file of most up-to-date live data for all games for the requested date.
    const response = await axios({
      type: 'GET',
      url: `https://api.mysportsfeeds.com/v2.0/pull/nba/2018-2019-regular/date/${date}/games.json`,
      dataType: 'json',
      headers: {
        Authorization: 'Basic ' + mySportsFeedsEncryption,
      },
    });

    const arrOfMessages = createMessagesForLiveGames(response);

    return arrOfMessages;
  } catch (error) {
    console.error('Error within todaysGames function: ', error);
  }
};

// When this script is running, fetchCurrentScore() will run every 15 seconds.
// COULD FIND A WAY TO DYNAMICALLY INPUT TIMES TO RUN DEPENDING ON THE SCHEDULED GAMES THAT DAY.
// Cron job scheduling examples - https://github.com/kelektiv/node-cron/tree/master/examples
cron.schedule('*/15 * * * * *', () => {
  console.log(`****** Cron Job ran at ${new Date()} *******`);

  todaysGames('20190118').then(messagesArr => {
    if (!messagesArr.length) console.log('There are no live games.')
    else messagesArr.forEach(message => {
      console.log(message)
      twilioClient.messages.create({
        to: MY_NUMBER,
        from: TWILIO_NUMBER,
        body: 'Heroku is working.'
      })
    });
  });
});
