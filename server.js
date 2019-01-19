const axios = require('axios');
const cron = require('node-cron');
const twilio = require('twilio');
if (process.env.NODE_ENV !== 'production') require('./secrets');
// Helper functions
const {createMessagesForNailBiterGames, formatDate} = require('./utilityFunctions');
// Secrets
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  SPORTS_FEEDS_API_KEY,
  SPORTS_FEEDS_PASSWORD,
  MY_NUMBER,
  TWILIO_NUMBER,
} = process.env;
const currentDate = formatDate(new Date())

// Authenticating twilio account
const twilioClient = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Encryption code for MySportsFeeds API requests
const mySportsFeedsEncryption = Buffer.from(
  SPORTS_FEEDS_API_KEY + ':' + SPORTS_FEEDS_PASSWORD
).toString('base64');


const todaysGames = async date => {
  try {
    // Pulls a JSON file of most up-to-date live data for all games for the requested date.
    const {data} = await axios({
      type: 'GET',
      url: `https://api.mysportsfeeds.com/v2.0/pull/nba/2018-2019-regular/date/${date}/games.json`,
      dataType: 'json',
      headers: {
        Authorization: 'Basic ' + mySportsFeedsEncryption,
      },
    });

    // Returns an array of currated data for live nail-biter games.
    return createMessagesForNailBiterGames(data);
  } catch (error) {
    console.error('Error within todaysGames function: ', error);
  }
};

const messageHasBeenSent = {}

// When this script is running, fetchCurrentScore() will run every 15 seconds.
// TODO: FIND A WAY TO DYNAMICALLY INPUT TIMES TO RUN DEPENDING ON THE SCHEDULED GAMES THAT DAY.
// cron.schedule('*/15 * * * * *', () => {
//   console.log(`****** Cron Job ran at ${new Date()} *******`);

//   todaysGames(currentDate).then(messagesArr => {
//     if (!messagesArr.length) console.log('There are no nail-biters.')

//     // Loops through each message of the nail-biter array.
//     else messagesArr.forEach(message => {
//       // Sends one notification per close game, then adds message to tracker object to prevent repeated messages from being sent.
//       if (!messageHasBeenSent[message.gameId]) {
//         console.log(message)
//         twilioClient.messages.create({
//           to: MY_NUMBER,
//           from: TWILIO_NUMBER,
//           body: message.message
//         })
//         messageHasBeenSent[message.gameId] = true
//       }
//     });
//   });
// });

// Supposed to run at 10:05, 10:35, 11:05, and 11:35pm on Mon-Fri
cron.schedule('5,35 22-23 * * 1-5', () => {
  console.log(`******* Cron job ran at ${new Date()} *******`);

  twilioClient.messages.create({
    to: MY_NUMBER,
    from: TWILIO_NUMBER,
    body: new Date().toString()
  })
})

// Supposed to run at 3:05, 3:35, 4:05, and 4:35pm on Sat-Sun
cron.schedule('5,35 3-4 * * 6-7', () => {
  console.log(`******* Cron job ran at ${new Date()} *******`);

  twilioClient.messages.create({
    to: MY_NUMBER,
    from: TWILIO_NUMBER,
    body: new Date().toString()
  })
})
