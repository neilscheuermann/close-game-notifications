const axios = require('axios')
const secrets = require('./secrets')

const apikey = secrets.API_KEY
const password = secrets.PASSWORD

const encryptedAPIKey = Buffer.from(apikey + ':' + password).toString('base64')

/*
played status is either UNPLAYED, LIVE, or COMPLETED_PENDING_REVIEW
*/

const todaysDate = new Date();
console.log('todays date: ', todaysDate)

const todaysLiveGames = async () => {
  try {
    const response = await axios({
      type: "GET",
      url: `https://api.mysportsfeeds.com/v2.0/pull/nba/2018-2019-regular/date/20190116/games.json`,
      dataType: 'json',
      async: false,
      headers: {
        "Authorization": "Basic " + encryptedAPIKey
      },
      data: '{ "comment" }',
      success: function (){
        console.log('Thanks for your comment!');
      }
    });

    const games = response.data.games
    const liveGames = games.filter(game => game.schedule.playedStatus === "LIVE").map(game => `${game.schedule.awayTeam.abbreviation} vs. ${game.schedule.homeTeam.abbreviation}`)

    console.log('Today: ', Object.keys(response.data.games[0]));
    console.log(liveGames);
  } catch (error) {
    console.error('Neils error: ', error)
  }
}

const fetchCurrentScore = async (dateAwayHome) => {
  try {
    const response = await axios({
      type: "GET",
      url: `https://api.mysportsfeeds.com/v2.0/pull/nba/2018-2019-regular/games/${dateAwayHome}/boxscore.json`,
      dataType: 'json',
      async: false,
      headers: {
        "Authorization": "Basic " + encryptedAPIKey
      },
      data: '{ "comment" }',
      success: function (){
        console.log('Thanks for your comment!');
      }
    });

    const lastUpdatedOn = response.data.lastUpdatedOn
    const awayTeam = `${response.data.references.teamReferences[0].city} ${response.data.references.teamReferences[0].name}`
    const homeTeam = `${response.data.references.teamReferences[1].city} ${response.data.references.teamReferences[1].name}`
    const currentQuarter = response.data.scoring.currentQuarter
    const currentIntermission = response.data.scoring.currentIntermission
    const quarterOrHalftime = currentIntermission === 1 ? 'end of 1st quarter' : currentIntermission === 2 ? 'halftime' : currentIntermission === 3 ? 'end of 3rd quarter' : currentIntermission === 4 ? 'end of regulation' : ''
    const secondsRemaingingInQuarter = response.data.scoring.currentQuarterSecondsRemaining
    const awayScoreTotal = response.data.scoring.awayScoreTotal
    const homeScoreTotal = response.data.scoring.homeScoreTotal
    const suffix = currentQuarter === 1 ? 'st' : currentQuarter === 2 ? 'nd' : currentQuarter === 3 ? 'rd' : currentQuarter === 4 ? 'th' : ''
    const currentDisplay = () => {
      const score = `${awayTeam}: ${awayScoreTotal} - ${homeTeam}: ${homeScoreTotal}`
      const quarterMessage = `${Math.floor(secondsRemaingingInQuarter/60)}:${secondsRemaingingInQuarter % 60} left in the ${currentQuarter}${suffix}`
      const intermissionMessage = quarterOrHalftime
      const timeRemaining = currentQuarter ? quarterMessage : intermissionMessage
      return `${score} --------- ${timeRemaining}.`
    }

    console.log(Object.keys(response.data.scoring));
    console.log('Last updated on: ', lastUpdatedOn);
    console.log(currentDisplay())
    console.log('Seconds remaingin in quarter: ', secondsRemaingingInQuarter)
    console.log('current quarter: ', response.data.scoring.currentQuarter)
    console.log('current intermission: ', response.data.scoring.currentIntermission)
    console.log('Played Status: ', response.data.game.playedStatus)
  } catch (error) {
    console.error('Neils error: ', error)
  }
}

fetchCurrentScore('20190116-ORL-DET');
todaysLiveGames();

