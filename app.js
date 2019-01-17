const MySportsFeeds = require('mysportsfeeds-node')
const secrets = require('./secrets')

const apikey = secrets.API_KEY
const password = secrets.PASSWORD

const msf = new MySportsFeeds('2.0', true, null)

msf.authenticate(apikey, password)

const fetchData = async () => {
  try {
    const response = await msf.getData('nba', '2018-2019-regular', 'game_boxscore', 'json', {force: true, game: '20190116-ORL-DET'});

    console.log(Object.keys(response.references.teamReferences));
    console.log('last updated on: ', response.lastUpdatedOn);
    // console.log('team references: ', response.references.teamReferences)
    console.log('Current quarter: ', response.scoring.currentQuarter)
    console.log('Seconds remaingin in quarter: ', response.scoring.currentQuarterSecondsRemaining)
    console.log('Away score total: ', response.scoring.awayScoreTotal)
    console.log('Home score total: ', response.scoring.homeScoreTotal)
  } catch (error) {
    console.error("Neil's code error handler: ", error)
  }
}

fetchData()
